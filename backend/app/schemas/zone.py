from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

VALID_ZONE_TYPES = {"entrance", "checkout", "promotional", "shelf_area", "generic", "exit"}

class ZoneBase(BaseModel):
    store_id: str
    name: str = Field(..., max_length=100)
    zone_type: str
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)

    @field_validator("zone_type")
    @classmethod
    def validate_zone_type(cls, value: str) -> str:
        val = value.lower().strip()
        if val not in VALID_ZONE_TYPES:
            raise ValueError(f"Invalid zone type. Must be one of {list(VALID_ZONE_TYPES)}")
        return val

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    zone_type: Optional[str] = None
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)

    @field_validator("zone_type")
    @classmethod
    def validate_zone_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        val = value.lower().strip()
        if val not in VALID_ZONE_TYPES:
            raise ValueError(f"Invalid zone type. Must be one of {list(VALID_ZONE_TYPES)}")
        return val

class ZoneResponse(ZoneBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
