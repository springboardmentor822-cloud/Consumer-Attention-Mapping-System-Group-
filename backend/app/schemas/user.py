from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role_id: int  # 1 = Store Manager, 2 = Retail Analyst, 3 = Marketing Manager, 4 = Administrator

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
