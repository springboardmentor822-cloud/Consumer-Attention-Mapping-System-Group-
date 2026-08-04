from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SessionBase(BaseModel):
    store_id: str
    shopper_identifier: str = Field(..., max_length=50)
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    zone_sequence: Optional[List[str]] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    shopper_identifier: Optional[str] = Field(None, max_length=50)
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    zone_sequence: Optional[List[str]] = None

class SessionResponse(SessionBase):
    id: str
    entry_time: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
