from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from app.utils.validators import is_valid_stream_url

class CameraBase(BaseModel):
    store_id: str
    name: str = Field(..., max_length=100)
    stream_url: str = Field(..., max_length=255)
    location_name: str = Field(..., max_length=100)
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)
    rotation_angle: Optional[float] = Field(0.0, ge=0, le=360)
    is_active: Optional[bool] = True

    @field_validator("stream_url")
    @classmethod
    def validate_stream_url(cls, value: str) -> str:
        if not is_valid_stream_url(value):
            raise ValueError("Invalid stream URL. Must start with rtsp://, http://, or https://")
        return value

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    stream_url: Optional[str] = Field(None, max_length=255)
    location_name: Optional[str] = Field(None, max_length=100)
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0)
    rotation_angle: Optional[float] = Field(None, ge=0, le=360)
    is_active: Optional[bool] = None

    @field_validator("stream_url")
    @classmethod
    def validate_stream_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if not is_valid_stream_url(value):
            raise ValueError("Invalid stream URL. Must start with rtsp://, http://, or https://")
        return value

class CameraResponse(CameraBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
