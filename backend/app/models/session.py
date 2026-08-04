import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Float, JSON
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

    store = relationship("Store", back_populates="sessions")
    product_interactions = relationship("ProductInteraction", back_populates="session", cascade="all, delete-orphan")
    attention_events = relationship("AttentionEvent", back_populates="session", cascade="all, delete-orphan")
