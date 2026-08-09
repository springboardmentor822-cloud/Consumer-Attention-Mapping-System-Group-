from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class PromotionBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    promotion_type: str = Field(min_length=2, max_length=60)
    status: str = Field(default="Scheduled")
    campaign_id: int | None = None
    product_id: int | None = None
    discount_percent: Decimal | None = Field(default=None, ge=0, le=100)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    name: str | None = None
    promotion_type: str | None = None
    status: str | None = None
    campaign_id: int | None = None
    product_id: int | None = None
    discount_percent: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None


class PromotionResponse(PromotionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PromotionPerformanceResponse(BaseModel):
    promotion_id: int
    data_available: bool
    reach: int | None = None
    avg_engagement_seconds: float | None = None
    note: str
