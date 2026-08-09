from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class CampaignBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    campaign_type: str = Field(min_length=2, max_length=60)
    status: str = Field(default="Draft")
    start_date: date
    end_date: date
    budget: Decimal = Field(ge=0, default=Decimal("0"))
    store_id: int | None = None
    zone_id: int | None = None
    description: str | None = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: str | None = None
    campaign_type: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget: Decimal | None = None
    store_id: int | None = None
    zone_id: int | None = None
    description: str | None = None


class CampaignResponse(CampaignBase):
    id: int
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CampaignPerformanceResponse(BaseModel):
    campaign_id: int
    data_available: bool
    reach: int | None = None
    avg_engagement_seconds: float | None = None
    note: str


class CampaignSummaryResponse(BaseModel):
    total_campaigns: int
    active_campaigns: int
    completed_campaigns: int
    draft_campaigns: int
    total_budget: float
    total_promotions: int
    active_promotions: int
    avg_attention_seconds: float
