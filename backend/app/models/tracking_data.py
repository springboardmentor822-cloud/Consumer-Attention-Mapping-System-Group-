"""
PART 5 - Tracking Models

Independent SQLAlchemy model for Milestone 2 coordinate/tracking data.
Does NOT modify the User model or any existing table. Uses the same
Base as Milestone 1 models purely so it participates in
`Base.metadata.create_all` and gets its own new table
("tracking_data") - existing tables are untouched.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TrackingData(Base):
    __tablename__ = "tracking_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    customer_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)

    frame_number: Mapped[int] = mapped_column(Integer, nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    camera = relationship("Camera")
    zone = relationship("Zone")
