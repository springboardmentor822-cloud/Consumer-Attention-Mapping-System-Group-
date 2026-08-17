from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class ProductScore(Base):
    __tablename__ = "product_scores"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    store_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)

    # Main attractiveness score (0-100)
    attractiveness_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    # Sub-scores (0-100 each)
    shelf_visibility_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    engagement_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    conversion_potential_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    marketing_effectiveness_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    # Raw metrics used for scoring
    metrics: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
