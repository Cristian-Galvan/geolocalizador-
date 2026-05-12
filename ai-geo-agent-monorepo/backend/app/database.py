import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Definimos la ruta absoluta que configuraste en el volumen de Railway
DATABASE_DIR = "/backend/app/data"
DATABASE_PATH = os.path.join(DATABASE_DIR, "geo_agent.db")

# 2. Verificamos que la carpeta exista (esto evita errores al arrancar)
if not os.path.exists(DATABASE_DIR):
    os.makedirs(DATABASE_DIR, exist_ok=True)

# 3. Construimos la URL de conexión para SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Creamos el motor de la base de datos
# El argumento check_same_thread=False es necesario solo para SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()