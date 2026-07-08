from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class RoleRead(BaseModel):
    id: int
    role_name: str

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    role: RoleRead
    store_id: UUID | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    role_id: int | None = None
    store_id: UUID | None = None
    is_active: bool | None = None
