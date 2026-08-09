from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Alert(Base):
    """Manager-logged incidents (security observations, inventory issues,
    anything else worth flagging) - complements, doesn't replace, the
    real-time computed alerts already served by
    GET /dashboard/store-manager/alerts (camera-offline, occupancy threshold),
    which stay computed-on-the-fly rather than persisted since they're always
    derived from current Camera.status / live tracking_data."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    # Nullable: manager-logged incidents (the original use case for this
    # table) often aren't tied to one camera/zone. Auto-generated alerts
    # (camera offline, occupancy, queue, restricted zone, loitering) always
    # set these - see app/services/alert_service.py.
    camera_id: Mapped[int | None] = mapped_column(ForeignKey("cameras.id", ondelete="SET NULL"), index=True, nullable=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), index=True, nullable=True)
    alert_type: Mapped[str] = mapped_column(String(40), nullable=False)  # security / inventory / camera / queue / restricted_zone / loitering / other
    severity: Mapped[str] = mapped_column(String(20), default="warning", nullable=False)  # info / warning / critical
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
