from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: str = "analyst"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password and create user
        hashed = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed,
            full_name=user_data.full_name,
            role=user_data.role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "User created successfully", "id": new_user.id}
        
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not user.is_active:
            raise HTTPException(status_code=401, detail="User account is inactive")
        
        token = create_access_token({"sub": str(user.id)})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "email": user.email,
            "full_name": user.full_name
        }
        
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))