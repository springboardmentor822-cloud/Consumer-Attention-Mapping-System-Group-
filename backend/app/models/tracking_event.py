"""
TrackingEvent - one row per (frame, tracked object) in TimescaleDB.

IMPORTANT: this file is intentionally NOT imported by
app/models/__init__.py. Every other model in that file gets swept into
init_db()'s create_all(engine) call against the MAIN Postgres database -
if TrackingEvent were imported there too, create_all() would try to
create this table on the wrong database (main Postgres instead of
TimescaleDB), since SQLModel shares one global metadata registry across
every table=True class by default.

This table is created separately, only against the TimescaleDB engine,
by app/core/timescale_db.py's init_timescale_db() - see that file.
"""

import uuid
from datetime import datetime

from sqlalchemy import PrimaryKeyConstraint
from sqlmodel import SQLModel, Field


class TrackingEvent(SQLModel, table=True):
    __tablename__ = "tracking_events"

    # Composite primary key (id, event_time) - required by TimescaleDB.
    # create_hypertable() partitions on event_time, and Postgres requires
    # the partitioning column to be part of every unique constraint on
    # the table, including the primary key. A standalone `id` PK (as in
    # every other model in this project) fails that requirement.
    # id stays effectively unique per row in practice (freshly generated
    # UUID per insert) - this constraint doesn't change that, it just
    # widens the enforced uniqueness to include event_time too, which is
    # what TimescaleDB needs to be able to guarantee across chunks.
    __table_args__ = (
        PrimaryKeyConstraint("id", "event_time"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4)

    # The column TimescaleDB partitions on. Set by the background worker
    # at insert time (when it drains the event from Redis), not by
    # whoever pushed the event originally - this is when the row is
    # PERSISTED, which is the axis TimescaleDB is actually optimized to
    # query against.
    event_time: datetime

    # Deliberately a plain string, not a foreign_key="camera.id" - a real
    # FK constraint would require this database to be able to see the
    # `camera` table, but that table lives in the OTHER Postgres
    # (main DATABASE_URL), which this database has no connection to.
    # Cross-database foreign keys aren't possible in Postgres at all -
    # this is stored as the camera's UUID value only, application-level
    # linked, not DB-enforced.
    camera_id: str

    frame_index: int
    track_id: float  # matches the float track_ids already coming out of
                      # PersonDetector/ProductDetector (Ultralytics
                      # returns track ids as floats) - one row per
                      # tracked object per frame, not one row per frame
    x1: float
    y1: float
    x2: float
    y2: float
    class_name: str | None = None  # populated for ProductDetector events,
                                    # None for PersonDetector events (no
                                    # class distinction - always "person")
