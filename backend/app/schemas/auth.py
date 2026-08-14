from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool = True

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    full_name: str
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

