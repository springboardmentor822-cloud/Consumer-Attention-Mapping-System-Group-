from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ShelfBase(BaseModel):
    shelf_name: str = Field(min_length=2, max_length=200)
    zone_coordinates: dict[str, Any] = Field(default_factory=dict)


class ShelfCreate(ShelfBase):
    pass


class ShelfUpdate(BaseModel):
    shelf_name: str | None = Field(default=None, min_length=2, max_length=200)
    zone_coordinates: dict[str, Any] | None = None


class ShelfRead(ShelfBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
