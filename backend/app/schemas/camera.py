from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CameraBase(BaseModel):
    store_id: UUID
    camera_name: str = Field(min_length=2, max_length=200)
    camera_source: str = Field(min_length=1, max_length=500)
    status: str = Field(default="active", min_length=1, max_length=30)


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    store_id: UUID | None = None
    camera_name: str | None = Field(default=None, min_length=2, max_length=200)
    camera_source: str | None = Field(default=None, min_length=1, max_length=500)
    status: str | None = Field(default=None, min_length=1, max_length=30)


class CameraRead(CameraBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
