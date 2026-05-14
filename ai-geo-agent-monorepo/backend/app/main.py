from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import logging
from math import radians, sin, cos, sqrt, atan2

from .database import SessionLocal, engine, Base
from . import models, schemas, auth_models, auth_routes
from .auth_routes import get_current_user
from .services.ai_agent import ai_agent
from .services.geo_processor import geo_processor
from .services.distance_calculator import distance_calculator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Geo-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _validate_places(places: list, user_lat: float, user_lng: float, max_km: float = 60.0) -> list:
    """Filtra lugares con coordenadas inválidas o demasiado lejos del usuario."""
    valid = []
    for p in places:
        lat = p.get("latitude")
        lng = p.get("longitude")
        if lat is None or lng is None:
            valid.append(p)
            continue
        if lat == 0.0 and lng == 0.0:
            p.pop("latitude", None)
            p.pop("longitude", None)
            valid.append(p)
            continue
        dist = _haversine_km(user_lat, user_lng, lat, lng)
        if dist <= max_km:
            valid.append(p)
        else:
            logger.warning(f"Lugar '{p.get('name')}' descartado: {dist:.1f} km del usuario")
    return valid


@app.post("/ask", response_model=schemas.QueryResponse)
async def ask_agent(
    request: schemas.QueryRequest,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        readable_address = geo_processor.get_address(request.latitude, request.longitude)
        logger.info(f"Usuario {current_user.id} en: {readable_address}")

        ai_response = await ai_agent.get_recommendation(
            request.prompt, request.latitude, request.longitude, readable_address
        )

        if isinstance(ai_response, dict):
            places = ai_response.get("places", [])
            error_msg = ai_response.get("error", "")
        else:
            places = []
            error_msg = str(ai_response)

        if error_msg:
            logger.warning(f"Error de IA: {error_msg}")

        # Filtrar coordenadas inválidas antes de calcular distancias
        places = _validate_places(places, request.latitude, request.longitude)
        places = distance_calculator.add_distance_and_duration(places, request.latitude, request.longitude)

        response_text = error_msg if error_msg else f"Se encontraron {len(places)} lugares."

        new_entry = models.SearchHistory(
            user_id=current_user.id,
            prompt=request.prompt,
            response=response_text,
            places=places,
            latitude=request.latitude,
            longitude=request.longitude,
            address=readable_address
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)

        logger.info(f"Búsqueda completada: {len(places)} lugares válidos")
        return new_entry

    except Exception as e:
        logger.error(f"Error en /ask: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error procesando tu solicitud. Intenta de nuevo.")


@app.get("/history", response_model=List[schemas.QueryResponse])
async def get_history(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return db.query(models.SearchHistory).filter(
        models.SearchHistory.user_id == current_user.id
    ).order_by(models.SearchHistory.timestamp.desc()).all()


@app.delete("/history/{item_id}")
async def delete_history(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    item = db.query(models.SearchHistory).filter(
        (models.SearchHistory.id == item_id) &
        (models.SearchHistory.user_id == current_user.id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(item)
    db.commit()
    return {"message": "Registro eliminado"}


@app.post("/visited", response_model=schemas.VisitedPlaceResponse)
async def rate_place(
    item: schemas.VisitedPlaceCreate,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    new_place = models.VisitedPlace(
        user_id=current_user.id,
        name=item.name,
        address=item.address,
        rating=item.rating,
        comment=item.comment
    )
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place


@app.get("/ratings", response_model=List[schemas.VisitedPlaceResponse])
async def get_ratings(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return db.query(models.VisitedPlace).filter(
        models.VisitedPlace.user_id == current_user.id
    ).order_by(models.VisitedPlace.timestamp.desc()).all()


@app.delete("/ratings/{item_id}")
async def delete_rating(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    item = db.query(models.VisitedPlace).filter(
        (models.VisitedPlace.id == item_id) &
        (models.VisitedPlace.user_id == current_user.id)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(item)
    db.commit()
    return {"message": "Calificación eliminada"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API en funcionamiento"}


@app.get("/")
async def root():
    return {"message": "AI Geo-Agent API is online", "status": "active", "version": "1.0.0"}
