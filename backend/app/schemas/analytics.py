import datetime as dt
from typing import Optional

from pydantic import BaseModel

from app.models.enums import (
    CustomerSegmentEnum,
    HeatmapTypeEnum,
    NotificationSeverityEnum,
    NotificationTypeEnum,
    RecommendationTypeEnum,
    ReportFormatEnum,
    ReportTypeEnum,
)


class HeatmapOut(BaseModel):
    id: int
    store_id: int
    camera_id: Optional[int]
    heatmap_type: HeatmapTypeEnum
    period_start: dt.datetime
    period_end: dt.datetime
    data: str  # JSON-encoded grid/points
    generated_at: dt.datetime

    class Config:
        from_attributes = True


class HeatmapGenerateRequest(BaseModel):
    store_id: int
    camera_id: Optional[int] = None
    heatmap_type: HeatmapTypeEnum
    period_start: dt.datetime
    period_end: dt.datetime
    segment: Optional[CustomerSegmentEnum] = None
    shelf_id: Optional[int] = None


class ProductAttractivenessScoreOut(BaseModel):
    id: int
    product_id: int
    period_start: dt.datetime
    period_end: dt.datetime
    attention_duration_score: float
    interaction_frequency_score: float
    pickup_rate_score: float
    conversion_rate_score: float
    repeat_engagement_score: float
    total_score: float
    computed_at: dt.datetime

    class Config:
        from_attributes = True


class ReportCreateRequest(BaseModel):
    store_id: int
    report_type: ReportTypeEnum
    report_format: ReportFormatEnum
    period_start: dt.datetime
    period_end: dt.datetime


class ReportOut(BaseModel):
    id: int
    store_id: int
    requested_by_id: int
    report_type: ReportTypeEnum
    report_format: ReportFormatEnum
    period_start: dt.datetime
    period_end: dt.datetime
    file_path: Optional[str]
    status: str
    created_at: dt.datetime
    completed_at: Optional[dt.datetime]

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    store_id: Optional[int]
    camera_id: Optional[int]
    shelf_id: Optional[int]
    product_id: Optional[int]
    notification_type: NotificationTypeEnum
    severity: NotificationSeverityEnum
    message: str
    is_read: int
    created_at: dt.datetime

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    id: int
    store_id: int
    shelf_id: Optional[int]
    product_id: Optional[int]
    recommendation_type: RecommendationTypeEnum
    title: str
    description: str
    confidence_score: Optional[float]
    is_dismissed: int
    created_at: dt.datetime

    class Config:
        from_attributes = True
