from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import StoreStatus


class StoreBase(BaseModel):
    store_name: str = Field(min_length=2, max_length=160)
    store_code: str = Field(min_length=2, max_length=40)
    location: str = Field(min_length=2, max_length=255)
    manager_name: str = Field(min_length=2, max_length=120)
    status: StoreStatus = StoreStatus.active


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    store_name: str | None = None
    store_code: str | None = None
    location: str | None = None
    manager_name: str | None = None
    status: StoreStatus | None = None


class StoreResponse(StoreBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
