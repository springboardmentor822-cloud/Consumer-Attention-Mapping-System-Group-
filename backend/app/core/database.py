import logging
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

logger = logging.getLogger("app.core.database")
settings = get_settings()

Base = declarative_base()

# Primary database URL (PostgreSQL)
SQLALCHEMY_DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=settings.POSTGRES_USER,
    password=settings.POSTGRES_PASSWORD,
    host=settings.POSTGRES_SERVER,
    port=settings.POSTGRES_PORT,
    database=settings.POSTGRES_DB,
)

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"connect_timeout": 3}
    )
    # Quick connectivity test
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to PostgreSQL database.")
except Exception as e:
    logger.warning(
        f"Could not connect to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT} ({e}). "
        "Falling back to local SQLite database (local_dev.db)."
    )
    SQLALCHEMY_DATABASE_URL = "sqlite:///./local_dev.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Import all models to ensure they are registered on Base
    from ..models import Role, User, Store, Shelf, Zone, Camera, CoordinateLog
    Base.metadata.create_all(bind=engine)

# MongoDB
try:
    mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    mongo_db = mongo_client[settings.MONGODB_DB]
except Exception as e:
    logger.warning(f"MongoDB connection error: {e}")
    mongo_client = None
    mongo_db = None

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
