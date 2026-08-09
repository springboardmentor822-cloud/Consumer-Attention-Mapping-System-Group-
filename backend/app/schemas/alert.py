from datetime import datetime

from pydantic import BaseModel, Field, computed_field


class AlertCreate(BaseModel):
    store_id: int
    alert_type: str = Field(min_length=2, max_length=40)
    severity: str = Field(default="warning")
    message: str = Field(min_length=2)
    camera_id: int | None = None
    zone_id: int | None = None


class AlertResponse(BaseModel):
    id: int
    store_id: int
    camera_id: int | None
    zone_id: int | None
    alert_type: str
    severity: str
    message: str
    is_resolved: bool
    created_by: int | None
    resolved_by: int | None
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[misc]
    @property
    def status(self) -> str:
        """Derived, not stored - "resolved" always means is_resolved=True.
        A separate status column would be a second source of truth for the
        same fact and could drift from is_resolved."""
        return "resolved" if self.is_resolved else "open"
