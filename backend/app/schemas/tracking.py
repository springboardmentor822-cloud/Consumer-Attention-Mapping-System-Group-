from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ShopperSessionBase(BaseModel):
    start_time: datetime
    end_time: datetime | None = None
    path_data: dict[str, Any] = {}


class ShopperSessionCreate(ShopperSessionBase):
    pass


class ShopperSessionUpdate(BaseModel):
    end_time: datetime | None = None
    path_data: dict[str, Any] | None = None


class ShopperSessionRead(ShopperSessionBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttentionEventBase(BaseModel):
    camera_id: UUID | None = None
    timestamp: datetime
    target_type: str
    target_id: UUID | None = None
    gaze_duration_seconds: float


class AttentionEventCreate(AttentionEventBase):
    pass


class AttentionEventRead(AttentionEventBase):
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InteractionEventBase(BaseModel):
    product_id: UUID
    interaction_type: str
    timestamp: datetime


class InteractionEventCreate(InteractionEventBase):
    pass


class InteractionEventRead(InteractionEventBase):
    id: UUID
    session_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
