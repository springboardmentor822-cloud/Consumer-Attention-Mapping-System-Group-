import datetime as dt
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import CameraStatusEnum, CameraTypeEnum


class StoreCreate(BaseModel):
    name: str = Field(..., max_length=200)
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    timezone: str = "UTC"
    floor_width_m: Optional[float] = None
    floor_height_m: Optional[float] = None
    max_capacity: Optional[int] = None
    manager_id: Optional[int] = None


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    floor_width_m: Optional[float] = None
    floor_height_m: Optional[float] = None
    max_capacity: Optional[int] = None
    manager_id: Optional[int] = None


class StoreOut(BaseModel):
    id: int
    name: str
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    timezone: str
    floor_width_m: Optional[float]
    floor_height_m: Optional[float]
    max_capacity: Optional[int]
    manager_id: Optional[int]
    created_at: dt.datetime

    class Config:
        from_attributes = True


class StoreZoneCreate(BaseModel):
    store_id: int
    name: str
    polygon_coordinates: Optional[str] = None  # JSON-encoded [[x,y], ...]
    description: Optional[str] = None


class StoreZoneOut(BaseModel):
    id: int
    store_id: int
    name: str
    polygon_coordinates: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


class CameraCreate(BaseModel):
    store_id: int
    zone_id: Optional[int] = None
    name: str
    camera_type: CameraTypeEnum
    stream_url: Optional[str] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    fps: Optional[int] = None
    calibration_data: Optional[str] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    zone_id: Optional[int] = None
    status: Optional[CameraStatusEnum] = None
    stream_url: Optional[str] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    fps: Optional[int] = None
    calibration_data: Optional[str] = None


class CameraOut(BaseModel):
    id: int
    store_id: int
    zone_id: Optional[int]
    name: str
    camera_type: CameraTypeEnum
    status: CameraStatusEnum
    stream_url: Optional[str]
    resolution_width: Optional[int]
    resolution_height: Optional[int]
    fps: Optional[int]
    calibration_data: Optional[str]
    last_heartbeat_at: Optional[dt.datetime]
    created_at: dt.datetime

    class Config:
        from_attributes = True
