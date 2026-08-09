from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"))
    zone_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # Drives the "Restricted Zone Entry" auto-alert rule in
    # app/services/alert_rules.py - a tracked person's zone_id matching a
    # restricted zone triggers a critical alert during video processing.
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    store = relationship("Store", back_populates="zones")
    detections = relationship("Detection", back_populates="zone", cascade="all, delete-orphan")