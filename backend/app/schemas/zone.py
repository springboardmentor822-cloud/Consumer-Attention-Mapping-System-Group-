from pydantic import BaseModel
from typing import Optional

class ZoneBase(BaseModel):
    store_id: int
    zone_name: str
    description: Optional[str] = None
    is_restricted: bool = False

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    store_id: Optional[int] = None
    zone_name: Optional[str] = None
    description: Optional[str] = None
    is_restricted: Optional[bool] = None

class ZoneResponse(ZoneBase):
    id: int

    model_config = {"from_attributes": True}
