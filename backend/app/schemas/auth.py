import datetime as dt
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import RoleEnum


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: RoleEnum = RoleEnum.RETAIL_ANALYST


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    is_verified: bool
    created_at: dt.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class EmailVerificationConfirm(BaseModel):
    token: str


class UserUpdateRole(BaseModel):
    role: RoleEnum


class UserUpdateStatus(BaseModel):
    is_active: Optional[bool] = None
