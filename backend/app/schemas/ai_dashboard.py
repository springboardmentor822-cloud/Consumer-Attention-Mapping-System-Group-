from datetime import datetime

from pydantic import BaseModel


class LiveCustomerPoint(BaseModel):
    customer_id: int
    camera_id: int
    zone_id: int | None
    x: float
    y: float
    timestamp: datetime


class LiveDashboardResponse(BaseModel):
    active_customers: int
    points: list[LiveCustomerPoint]
    as_of: datetime | None
    is_live: bool


class HeatmapPoint(BaseModel):
    x: float
    y: float
    weight: int


class HeatmapDataResponse(BaseModel):
    camera_id: int | None
    zone_id: int | None
    total_points: int
    points: list[HeatmapPoint]


class CustomerPathPoint(BaseModel):
    frame_number: int
    x: float
    y: float
    timestamp: datetime


class CustomerPathResponse(BaseModel):
    customer_id: int
    total_points: int
    path: list[CustomerPathPoint]


class StoreSummaryResponse(BaseModel):
    store_id: int
    total_cameras: int
    total_zones: int
    unique_customers_tracked: int
    total_tracking_records: int
    busiest_zone_id: int | None
