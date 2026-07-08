from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class StoreBase(BaseModel):
    store_name: str = Field(min_length=2, max_length=200)
    location: str = Field(min_length=2, max_length=255)
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata_", "metadata"),
    )


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    store_name: str | None = Field(default=None, min_length=2, max_length=200)
    location: str | None = Field(default=None, min_length=2, max_length=255)
    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("metadata_", "metadata"),
    )


class StoreRead(StoreBase):
    id: UUID
    is_approved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
