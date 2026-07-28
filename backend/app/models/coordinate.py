import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from backend.app.core.database import Base


class TrackingCoordinate(Base):
    __tablename__ = "tracking_coordinates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    camera_id = Column(String, nullable=False)
    shopper_id = Column(String, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)

    # Optimizing for time-series queries
    __table_args__ = (
        Index("ix_tracking_coordinates_timestamp_store", "store_id", "timestamp"),
    )
