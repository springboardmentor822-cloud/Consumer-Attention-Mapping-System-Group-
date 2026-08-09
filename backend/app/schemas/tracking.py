from datetime import datetime

from pydantic import BaseModel, Field


class TrackingStartRequest(BaseModel):
    camera_id: int
    zone_id: int | None = None


class TrackingStartResponse(BaseModel):
    session_id: str
    camera_id: int
    zone_id: int | None
    status: str = "running"


class TrackingStopRequest(BaseModel):
    session_id: str


class TrackingStopResponse(BaseModel):
    session_id: str
    status: str = "stopped"
    unique_customers_tracked: int
    records_saved: int


class TrackingStatusResponse(BaseModel):
    session_id: str
    camera_id: int
    zone_id: int | None
    status: str
    frames_processed: int
    unique_customers_tracked: int
    started_at: datetime


class TrackingHistoryItem(BaseModel):
    customer_id: int
    camera_id: int
    zone_id: int | None
    frame_number: int = Field(alias="frame")
    x: float
    y: float
    confidence: float
    timestamp: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class TrackingHistoryResponse(BaseModel):
    total_records: int
    records: list[TrackingHistoryItem]
