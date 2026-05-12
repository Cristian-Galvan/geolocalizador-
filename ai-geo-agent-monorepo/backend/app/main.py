from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import logging

from .database import SessionLocal, engine, Base
from . import models, schemas, auth_models, auth_routes
from .auth_routes import get_current_user
from .services.ai_agent import ai_agent
from .services.geo_processor import geo_processor
from .services.distance_calculator import distance_calculator

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear todas las tablas en el arranque (una sola vez)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Geo-Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://geolizer-frontend-production.up.railway.app", 
        "http://localhost:4200"                               
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas de autenticación
app.include_router(auth_routes.router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/ask", response_model=schemas.QueryResponse)
async def ask_agent(
    request: schemas.QueryRequest,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    try:
        # 1. Obtener dirección legible
        readable_address = geo_processor.get_address(request.latitude, request.longitude)
        
        # 2. Obtener respuesta de la IA con estructura JSON
        context_prompt = f"El usuario está cerca de: {readable_address}. {request.prompt}"
        logger.info(f"Consultando IA para usuario {current_user.id}: {request.prompt[:50]}")
        
        ai_response = await ai_agent.get_recommendation(context_prompt, request.latitude, request.longitude)
        
        # 3. Extraer places y response text
        places = ai_response.get("places", []) if isinstance(ai_response, dict) else []
        response_text = ai_response.get("error", "") if isinstance(ai_response, dict) else str(ai_response)
        
        # Si hay error, registrarlo
        if response_text and "error" in response_text.lower():
            logger.warning(f"Error de IA: {response_text}")
        
        # 4. Calcular distancia y tiempo para cada lugar
        places = distance_calculator.add_distance_and_duration(places, request.latitude, request.longitude)
        
        # 5. Guardar en DB
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
        
        logger.info(f"Búsqueda completada: {len(places)} lugares encontrados")
        return new_entry
        
    except Exception as e:
        logger.error(f"Error en /ask: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Error procesando tu solicitud. Intenta de nuevo."
        )

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

@app.get("/visited", response_model=List[schemas.VisitedPlaceResponse])
async def get_visited_places(
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    return db.query(models.VisitedPlace).filter(
        models.VisitedPlace.user_id == current_user.id
    ).order_by(models.VisitedPlace.timestamp.desc()).all()

@app.delete("/visited/{place_id}")
async def delete_visited_place(
    place_id: int,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    
    place = db.query(models.VisitedPlace).filter(
        (models.VisitedPlace.id == place_id) &
        (models.VisitedPlace.user_id == current_user.id)
    ).first()
    
    if not place:
        raise HTTPException(status_code=404, detail="No encontrado")
    
    db.delete(place)
    db.commit()
    return {"message": "Lugar eliminado"}

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
    return {
        "message": "AI Geo-Agent API is online",
        "status": "active",
        "version": "1.0.0"
    }
