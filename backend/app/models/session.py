import datetime as dt

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import CustomerSegmentEnum


class ShopperSession(Base):
    """
    One continuous store visit by a single (anonymous, re-identified-only-within-session)
    shopper, generated from entry/exit detection + tracking.
    """
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)

    shopper_uid = Column(String(64), unique=True, index=True, nullable=False)  # anonymized UUID

    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime, nullable=True)
    total_duration_seconds = Column(Float, nullable=True)

    entry_zone_id = Column(Integer, ForeignKey("store_zones.id"), nullable=True)
    exit_zone_id = Column(Integer, ForeignKey("store_zones.id"), nullable=True)

    zones_visited_count = Column(Integer, default=0)
    total_distance_m = Column(Float, nullable=True)
    # meters/second, computed from tracking_data points on session close -
    # distinguishes browsing/stopping (low) from passing-through (high).
    avg_velocity_mps = Column(Float, nullable=True)

    segment = Column(Enum(CustomerSegmentEnum), default=CustomerSegmentEnum.UNCLASSIFIED)

    created_at = Column(DateTime, default=dt.datetime.utcnow)

    store = relationship("Store")
    tracking_points = relationship(
        "TrackingData", back_populates="session", cascade="all, delete-orphan"
    )
    attention_events = relationship(
        "AttentionEvent", back_populates="session", cascade="all, delete-orphan"
    )
    interactions = relationship(
        "ProductInteraction", back_populates="session", cascade="all, delete-orphan"
    )
