import datetime as dt
from typing import Optional

from pydantic import BaseModel

from app.models.enums import CustomerSegmentEnum, InteractionTypeEnum


class ShopperSessionCreate(BaseModel):
    store_id: int
    shopper_uid: str
    entry_time: dt.datetime
    entry_zone_id: Optional[int] = None


class ShopperSessionUpdate(BaseModel):
    exit_time: Optional[dt.datetime] = None
    exit_zone_id: Optional[int] = None
    zones_visited_count: Optional[int] = None
    total_distance_m: Optional[float] = None
    segment: Optional[CustomerSegmentEnum] = None


class ShopperSessionOut(BaseModel):
    id: int
    store_id: int
    shopper_uid: str
    entry_time: dt.datetime
    exit_time: Optional[dt.datetime]
    total_duration_seconds: Optional[float]
    entry_zone_id: Optional[int] = None
    exit_zone_id: Optional[int] = None
    zones_visited_count: int
    total_distance_m: Optional[float] = None
    avg_velocity_mps: Optional[float] = None
    segment: CustomerSegmentEnum

    class Config:
        from_attributes = True


class TrackingDataCreate(BaseModel):
    session_id: int
    camera_id: int
    zone_id: Optional[int] = None
    timestamp: dt.datetime
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    detection_confidence: Optional[float] = None
    floor_x: Optional[float] = None
    floor_y: Optional[float] = None
    track_id: int


class TrackingDataOut(TrackingDataCreate):
    id: int

    class Config:
        from_attributes = True


class AttentionEventCreate(BaseModel):
    session_id: int
    shelf_id: Optional[int] = None
    product_id: Optional[int] = None
    camera_id: int
    start_time: dt.datetime
    end_time: Optional[dt.datetime] = None
    duration_seconds: Optional[float] = None
    head_pose_yaw: Optional[float] = None
    head_pose_pitch: Optional[float] = None
    head_pose_roll: Optional[float] = None
    gaze_vector_x: Optional[float] = None
    gaze_vector_y: Optional[float] = None


class AttentionEventOut(AttentionEventCreate):
    id: int
    is_repeat_attention: int

    class Config:
        from_attributes = True


class ProductInteractionCreate(BaseModel):
    session_id: int
    product_id: int
    attention_event_id: Optional[int] = None
    interaction_type: InteractionTypeEnum
    timestamp: dt.datetime


class ProductInteractionOut(ProductInteractionCreate):
    id: int

    class Config:
        from_attributes = True
