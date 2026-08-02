"""
TimescaleDB connection + initialization.

Deliberately separate from app/core/db.py's engine/init_db(). That file's
engine points at the main app Postgres (Store/Zone/Camera/Shelf/users);
this one points at the TimescaleDB container (port 5433, per
docker-compose.yml). They must never be conflated - see the comment in
tracking_event.py for why TrackingEvent isn't in app/models/__init__.py.
"""

from sqlmodel import SQLModel, Session, create_engine, text

from app.core.config import settings
from app.models.tracking_event import TrackingEvent

timescale_engine = create_engine(settings.TIMESCALE_DATABASE_URL, echo=False)


def init_timescale_db():
    """
    Creates ONLY the tracking_events table against the TimescaleDB engine -
    NOT SQLModel.metadata.create_all(timescale_engine), which would try to
    create every model's table (Store, Zone, Camera, ...) here too, since
    they all share the same global metadata object. The tables= argument
    below restricts create_all to just this one table.

    Then converts it into a real TimescaleDB hypertable via raw SQL -
    create_hypertable() is a TimescaleDB extension function, not something
    SQLModel/SQLAlchemy knows how to call; without this step the table is
    just a plain Postgres table with TimescaleDB's performance benefits
    unused.
    """
    SQLModel.metadata.create_all(
        timescale_engine, tables=[TrackingEvent.__table__]
    )

    with Session(timescale_engine) as session:
        # if_not_exists => True makes this safe to call every startup,
        # same as create_all() being safe to call on tables that already
        # exist - won't error on a second run.
        session.exec(
            text(
                "SELECT create_hypertable("
                "'tracking_events', 'event_time', "
                "if_not_exists => TRUE);"
            )
        )
        session.commit()


def get_timescale_session():
    """FastAPI dependency, mirrors get_session() in app/core/db.py but for
    TimescaleDB - only needed if an API route ever needs to read tracking
    data directly; the background worker uses timescale_engine itself."""
    with Session(timescale_engine) as session:
        yield session
