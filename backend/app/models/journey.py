from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class CustomerJourney(Base):
    __tablename__ = "customer_journeys"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("shopper_sessions.id", ondelete="CASCADE"), nullable=False)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    entry_point: Mapped[str] = mapped_column(String(100), nullable=True)
    exit_point: Mapped[str] = mapped_column(String(100), nullable=True)
    zones_visited: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)  # ordered list of zone names/ids
    zone_transition_sequence: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    total_dwell_time_seconds: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    zone_dwell_times: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # {zone_id: seconds}
    path_length: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    visit_frequency: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    product_interaction_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pickup_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    return_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conversion_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("ShopperSession")
