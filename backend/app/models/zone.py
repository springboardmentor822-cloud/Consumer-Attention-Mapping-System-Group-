from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Zone(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "zones"

    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50), nullable=False)  # entrance, checkout, promotional, shelf_area, generic
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)

    store = relationship("Store", back_populates="zones")
    attention_events = relationship("AttentionEvent", back_populates="zone", cascade="all, delete-orphan")
