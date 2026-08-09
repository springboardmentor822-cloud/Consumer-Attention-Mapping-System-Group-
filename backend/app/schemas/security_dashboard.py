from pydantic import BaseModel

from app.schemas.alert import AlertResponse


class CameraStatusSummary(BaseModel):
    online: int
    offline: int
    total: int


class SecurityDashboardResponse(BaseModel):
    store_id: int | None
    live_alert_count: int
    unresolved_count: int
    camera_status: CameraStatusSummary
    occupancy_alert_count: int
    recent_incidents: list[AlertResponse]


class OccupancyItem(BaseModel):
    camera_id: int
    camera_name: str
    occupancy: int
    threshold: int
    is_over_threshold: bool


class OccupancyResponse(BaseModel):
    store_id: int | None
    cameras: list[OccupancyItem]
