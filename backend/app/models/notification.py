from sqlalchemy import Column, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    store_id = Column(String(36), ForeignKey("stores.id"), nullable=False)
    type = Column(String(50), nullable=False)  # Camera, Traffic, Shelf, System
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)

    store = relationship("Store")
