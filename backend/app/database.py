from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

settings = get_settings()

SQLITE_FALLBACK_URL = f"sqlite:///{Path(__file__).resolve().parents[1] / 'attention_mapping.db'}"


def _create_engine(database_url: str):
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)


def _resolve_engine():
    primary = _create_engine(settings.database_url)
    try:
        with primary.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        # SQLite is an intentional local-development mode even when it was
        # configured explicitly.  Treat it as fallback storage so status APIs
        # and the dashboard never claim that PostgreSQL/TimescaleDB is live.
        return primary, settings.database_url, primary.dialect.name == "sqlite"
    except OperationalError:
        return _create_engine(SQLITE_FALLBACK_URL), SQLITE_FALLBACK_URL, True


engine, active_database_url, using_fallback_database = _resolve_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
timescale_enabled = False
timescale_error: str | None = None


def activate_sqlite_fallback():
    global active_database_url, engine, using_fallback_database

    engine.dispose()
    engine = _create_engine(SQLITE_FALLBACK_URL)
    SessionLocal.configure(bind=engine)
    active_database_url = SQLITE_FALLBACK_URL
    using_fallback_database = True
    return engine


def initialize_timescale() -> bool:
    """Convert high-frequency observations to a hypertable when TimescaleDB is available.

    Local SQLite remains a supported development fallback. A PostgreSQL server
    without the TimescaleDB extension stays usable, but exposes the reason via
    ``timescale_error`` rather than silently claiming time-series support.
    """

    global timescale_enabled, timescale_error
    timescale_enabled = False
    timescale_error = None
    if engine.dialect.name != "postgresql":
        timescale_error = "TimescaleDB is disabled because the active database is not PostgreSQL."
        return False
    try:
        with engine.begin() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
            connection.execute(
                text(
                    "SELECT create_hypertable(" 
                    "'tracking_observations', 'observed_at', "
                    "if_not_exists => TRUE, migrate_data => TRUE)"
                )
            )
        timescale_enabled = True
        return True
    except Exception as exc:
        timescale_error = str(exc)
        return False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
