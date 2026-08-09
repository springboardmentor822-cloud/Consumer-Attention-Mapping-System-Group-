from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EngagementMetric(Base):
    """One row per visit (same grain as DwellMetric - see app/analytics/engagement.py).
    Standing/interaction/viewing time are all derived from movement speed between
    consecutive tracking_data points within the visit, not a separate sensor -
    there's no interaction/attention hardware in this system, only positional
    tracking, so engagement is a real but proxy measure, documented as such at
    the API layer."""

    __tablename__ = "engagement_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id", ondelete="CASCADE"), index=True, nullable=False)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), index=True, nullable=True)
    # Ties this row back to the DwellMetric visit it was computed from -
    # (customer_id, camera_id, entry_time) is the same natural key used there,
    # so both tables can be deduped and correlated the same way.
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    standing_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    interaction_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    viewing_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    engagement_score: Mapped[float] = mapped_column(Float, nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
