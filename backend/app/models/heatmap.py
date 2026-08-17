from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class HeatmapResult(Base):
    __tablename__ = "heatmap_results"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    heatmap_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # store_traffic, shelf, product, engagement
    zone_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True)
    shelf_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("shelves.id", ondelete="SET NULL"), nullable=True)
    grid_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # {points: [[x,y,val],...], max_val: float}
    time_range_hours: Mapped[float] = mapped_column(Float, default=24, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
