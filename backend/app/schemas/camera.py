from pydantic import BaseModel
from typing import Optional

class CameraBase(BaseModel):
    store_id: int
    camera_name: str
    camera_ip: str
    camera_location: str
    status: str = "Online"

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    store_id: Optional[int] = None
    camera_name: Optional[str] = None
    camera_ip: Optional[str] = None
    camera_location: Optional[str] = None
    status: Optional[str] = None

class CameraResponse(CameraBase):
    id: int

    model_config = {"from_attributes": True}
