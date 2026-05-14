from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from .database import SessionLocal
from . import auth_models, auth_schemas
from .auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    decode_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[auth_models.User]:
    if not authorization:
        return None
    
    try:
        # Extraer el token del header "Bearer <token>"
        token = authorization.replace("Bearer ", "").replace("bearer ", "")
        token_data = decode_token(token)
        if not token_data or not token_data.username:
            return None
        
        user = db.query(auth_models.User).filter(
            auth_models.User.username == token_data.username
        ).first()
        return user
    except Exception:
        return None

@router.post("/register", response_model=auth_schemas.Token)
async def register(user_data: auth_schemas.UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(auth_models.User).filter(
        (auth_models.User.username == user_data.username) |
        (auth_models.User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario o email ya existe"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    db_user = auth_models.User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": auth_schemas.UserResponse.model_validate(db_user)
    }

@router.post("/login", response_model=auth_schemas.Token)
async def login(user_data: auth_schemas.UserLogin, db: Session = Depends(get_db)):
    # Buscar usuario
    user = db.query(auth_models.User).filter(
        auth_models.User.username == user_data.username
    ).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": auth_schemas.UserResponse.model_validate(user)
    }

@router.get("/me", response_model=auth_schemas.UserResponse)
async def get_me(current_user: Optional[auth_models.User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="No autenticado")
    return current_user

@router.post("/logout")
async def logout():
    return {"message": "Sesión cerrada"}
