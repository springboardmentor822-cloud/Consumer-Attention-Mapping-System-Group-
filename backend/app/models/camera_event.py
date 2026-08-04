import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class CameraEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "camera_events"

    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    details = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), nullable=False)

    camera = relationship("Camera")
