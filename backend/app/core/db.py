from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)


def init_db():
    """Create tables. In production, use Alembic migrations instead."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency - yields a DB session per request."""
    with Session(engine) as session:
        yield session
