from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)  # shelf_placement, promotion, layout, traffic
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    supporting_metric: Mapped[str] = mapped_column(String(200), nullable=True)
    expected_impact: Mapped[str] = mapped_column(String(200), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    target_zone_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    target_shelf_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    target_product_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, implemented, dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
