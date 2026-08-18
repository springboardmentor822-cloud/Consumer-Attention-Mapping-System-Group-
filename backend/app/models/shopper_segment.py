# Save as: backend/app/models/shopper_segment.py

import uuid
from datetime import datetime, UTC
from sqlmodel import SQLModel, Field


class ShopperSegment(SQLModel, table=True):
    """
    One row per shopper-session (= one surviving track_id within one
    tracking_runner run for one camera). Session scope matches everything
    else built so far (dwell time, traffic charts) — we have no
    cross-camera shopper identity yet, so a 'session' is camera-scoped.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id", index=True)
    camera_id: uuid.UUID = Field(foreign_key="camera.id", index=True)
    track_id: int = Field(index=True)

    total_path_distance: float
    dwell_time_seconds: float
    avg_velocity: float

    segment_label: str = Field(index=True)  # Explorer / Quick Buyer / etc.
    cluster_id: int  # raw K-Means cluster index, kept for debugging

    computed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
