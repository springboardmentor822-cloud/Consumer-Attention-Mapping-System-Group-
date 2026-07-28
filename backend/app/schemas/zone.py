from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ZoneBase(BaseModel):
    zone_name: str = Field(min_length=1, max_length=200)
    coordinates: dict[str, Any] = Field(default_factory=dict)


class ZoneCreate(ZoneBase):
    pass


class ZoneUpdate(BaseModel):
    zone_name: str | None = Field(default=None, min_length=1, max_length=200)
    coordinates: dict[str, Any] | None = None


class ZoneRead(ZoneBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
