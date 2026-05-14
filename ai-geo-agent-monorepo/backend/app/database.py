import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Si Railway provee DATABASE_URL (Postgres), úsala; si no, SQLite local
DATABASE_URL_ENV = os.getenv("DATABASE_URL", "")

if DATABASE_URL_ENV:
    # Railway inyecta postgres:// pero SQLAlchemy 2.x necesita postgresql://
    SQLALCHEMY_DATABASE_URL = DATABASE_URL_ENV.replace("postgres://", "postgresql://", 1)
else:
    # SQLite: usa /data si existe (volumen Railway), si no, directorio del archivo
    _base_dir = "/data" if os.path.isdir("/data") else os.path.dirname(os.path.abspath(__file__))
    _db_dir = os.path.join(_base_dir, "data")
    os.makedirs(_db_dir, exist_ok=True)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(_db_dir, 'geo_agent.db')}"

_connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()