from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ShelfBase(BaseModel):
    store_id: str
    name: str = Field(..., max_length=100)
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)

class ShelfCreate(ShelfBase):
    pass

class ShelfUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)

class ShelfResponse(ShelfBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
