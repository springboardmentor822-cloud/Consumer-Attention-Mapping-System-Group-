from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class StoreBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=50)
    address: str = Field(..., max_length=255)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    is_active: Optional[bool] = True

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None

class StoreResponse(StoreBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
