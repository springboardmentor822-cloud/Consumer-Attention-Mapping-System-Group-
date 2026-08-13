import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Float, JSON, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.mixins import UUIDMixin, TimestampMixin

class Session(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sessions"

    store_id = Column(String(36), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    shopper_identifier = Column(String(50), nullable=False, index=True)
    entry_time = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None), nullable=False)
    exit_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    zone_sequence = Column(JSON, nullable=True)  # JSON array of zone names/ids visited
    
    path_distance = Column(Float, default=0.0)
    velocity = Column(Float, default=0.0)
    stopping_events = Column(Integer, default=0)
    shelf_visit_count = Column(Integer, default=0)
    interaction_count = Column(Integer, default=0)
    segment = Column(String(50), default="Explorer")

    store = relationship("Store", back_populates="sessions")
    product_interactions = relationship("ProductInteraction", back_populates="session", cascade="all, delete-orphan")
    attention_events = relationship("AttentionEvent", back_populates="session", cascade="all, delete-orphan")
