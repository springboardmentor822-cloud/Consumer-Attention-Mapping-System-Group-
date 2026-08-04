from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

VALID_INTERACTION_TYPES = {"view", "pickup", "compare", "return", "purchase"}

class InteractionBase(BaseModel):
    session_id: str
    product_id: str
    shelf_id: str
    interaction_type: str
    timestamp: Optional[datetime] = None

    @field_validator("interaction_type")
    @classmethod
    def validate_interaction_type(cls, value: str) -> str:
        val = value.lower().strip()
        if val not in VALID_INTERACTION_TYPES:
            raise ValueError(f"Invalid interaction type. Must be one of {list(VALID_INTERACTION_TYPES)}")
        return val

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    session_id: Optional[str] = None
    product_id: Optional[str] = None
    shelf_id: Optional[str] = None
    interaction_type: Optional[str] = None
    timestamp: Optional[datetime] = None

    @field_validator("interaction_type")
    @classmethod
    def validate_interaction_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        val = value.lower().strip()
        if val not in VALID_INTERACTION_TYPES:
            raise ValueError(f"Invalid interaction type. Must be one of {list(VALID_INTERACTION_TYPES)}")
        return val

class InteractionResponse(InteractionBase):
    id: str
    timestamp: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
