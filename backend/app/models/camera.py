from sqlalchemy import Column, String, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Camera(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cameras"

    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    stream_url = Column(String(255), nullable=False)
    location_name = Column(String(100), nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    rotation_angle = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    store = relationship("Store", back_populates="cameras")
    attention_events = relationship("AttentionEvent", back_populates="camera", cascade="all, delete-orphan")
