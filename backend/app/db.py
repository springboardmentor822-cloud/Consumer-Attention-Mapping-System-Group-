import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

def create_db_engine():
    db_url = settings.DATABASE_URL
    
    # If PostgreSQL URL is specified, try creating/connecting to PostgreSQL
    if "postgresql" in db_url:
        try:
            # First try connecting to postgres default DB to ensure database exists
            base_pg_url = db_url.rsplit('/', 1)[0] + '/postgres'
            temp_engine = create_engine(base_pg_url, isolation_level="AUTOCOMMIT", connect_args={"connect_timeout": 3})
            with temp_engine.connect() as conn:
                db_name = db_url.rsplit('/', 1)[1]
                res = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
                if not res.scalar():
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    logger.info(f"Created PostgreSQL database '{db_name}'")
            temp_engine.dispose()

            engine = create_engine(
                db_url, 
                echo=True, 
                pool_size=5, 
                max_overflow=10, 
                pool_pre_ping=True
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to PostgreSQL database.")
            return engine
        except Exception as e:
            logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite database.")
            sqlite_url = settings.SQLITE_URL
            return create_engine(sqlite_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
        return create_engine(db_url, connect_args=connect_args, echo=False)

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
