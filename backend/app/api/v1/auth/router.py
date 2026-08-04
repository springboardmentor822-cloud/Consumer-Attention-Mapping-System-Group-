from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Any
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models import User, Role

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Pydantic Schemas for inputs/outputs
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role_id: int  # 1 = Manager, 2 = Analyst, 3 = Marketing, 4 = Admin

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str


# Authentication Dependency Helpers
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: one of {self.allowed_roles}"
            )
        return current_user


# Endpoints
@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if role exists
    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role ID specified"
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        role_id=user_data.role_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Registration Audit logging skipped for lean scope
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        role=role.name,
        is_active=new_user.is_active
    )


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Issue JWT Token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.name}
    )
    
    # Login Audit logging skipped for lean scope
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role.name,
        email=user.email
    )


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active
    )


# Administrator User Control APIs
require_admin = RoleChecker(["Administrator"])

class UserUpdate(BaseModel):
    role_id: int
    is_active: bool

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    users = db.query(User).all()
    return [UserResponse(
        id=u.id,
        email=u.email,
        role=u.role.name,
        is_active=u.is_active
    ) for u in users]


@router.put("/users/{id}", response_model=UserResponse)
def update_user(id: str, update_data: UserUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == update_data.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role ID")
        
    user.role_id = update_data.role_id
    user.is_active = update_data.is_active
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        role=role.name,
        is_active=user.is_active
    )


@router.delete("/users/{id}")
def delete_user(id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted successfully"}

