from datetime import date, datetime

from pydantic import BaseModel


# Which day the traffic figures on a response actually cover, and whether that
# day is today. Footage is processed in batches rather than streamed from
# always-on cameras, so after midnight "today" is empty until someone
# processes a video; the dashboard then reports the most recent day that has
# real data instead of showing zeros (see _resolve_reporting_day in
# app/api/routers/store_manager.py). These fields exist so the UI can say
# which day it is showing - an older day's numbers must never be presented as
# today's. Both default so existing clients that ignore them keep working.
class ReportingDayMixin(BaseModel):
    reporting_date: date | None = None
    is_today: bool = True


class StoreManagerSummary(ReportingDayMixin):
    store_id: int
    today_visitors: int
    current_customers: int
    avg_dwell_time_seconds: float
    # None when this store has no zone whose name suggests a checkout area to
    # measure conversion against - there is no real purchase/checkout event
    # data in the schema, so this is a zone-proximity proxy, not a literal
    # conversion metric.
    conversion_rate: float | None
    # Unique-customer count near shelves' cameras - a proxy for "products
    # picked" since there is no product-pick detection model, only person
    # detection/tracking.
    shelf_engagement_proxy: int
    online_cameras: int
    total_cameras: int


class CameraStatusItem(BaseModel):
    camera_id: int
    camera_name: str
    camera_location: str
    status: str
    zone_id: int | None
    zone_name: str | None
    latest_people_count: int
    # Most recent YOLO-annotated frame/video from this camera's last processed
    # video - a static fallback for when no live source is registered yet.
    snapshot_url: str | None
    video_url: str | None
    # MJPEG feed that loops the camera's last-processed video and runs
    # detection on every frame in real time. None until a video has been
    # processed for this camera at least once (see app.ai.live_stream).
    live_stream_url: str | None


class CameraStatusResponse(BaseModel):
    store_id: int
    cameras: list[CameraStatusItem]


class HourlyVisitorPoint(BaseModel):
    hour: int
    visitors: int


class VisitorsByHourResponse(ReportingDayMixin):
    store_id: int
    points: list[HourlyVisitorPoint]


class ZoneVisitorPoint(BaseModel):
    zone_id: int
    zone_name: str
    visitors: int


class VisitorsByZoneResponse(ReportingDayMixin):
    store_id: int
    points: list[ZoneVisitorPoint]


class ShelfActivityItem(BaseModel):
    shelf_id: int
    shelf_name: str
    zone: str
    camera_id: int | None
    activity_proxy: int


class ShelfActivityResponse(BaseModel):
    store_id: int
    shelves: list[ShelfActivityItem]


class AlertItem(BaseModel):
    severity: str
    message: str
    camera_id: int | None = None
    zone_id: int | None = None


class AlertsResponse(BaseModel):
    store_id: int
    alerts: list[AlertItem]


class ActivityItem(BaseModel):
    timestamp: datetime
    message: str
    camera_id: int | None = None
    zone_id: int | None = None


class ActivitiesResponse(BaseModel):
    store_id: int
    activities: list[ActivityItem]


class QueueCounterItem(BaseModel):
    zone_id: int
    zone_name: str
    current_length: int
    average_wait_seconds: float
    is_busy: bool


class QueueResponse(BaseModel):
    store_id: int
    counters: list[QueueCounterItem]
    busy_threshold: int
    note: str
