import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class AttentionEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attention_events"

    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), nullable=False, index=True)
    attention_score = Column(Float, nullable=False)
    gaze_duration_ms = Column(Float, default=0.0)
    confidence = Column(Float, default=1.0)

    session = relationship("Session", back_populates="attention_events")
    camera = relationship("Camera", back_populates="attention_events")
    zone = relationship("Zone", back_populates="attention_events")
