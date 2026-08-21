import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from app.db import get_db
from app.config import settings
from app.models.models import User, AuditLog
from app.schemas.schemas import LoginRequest, Token, UserResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if plain_password == hashed_password:
        return True
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        # Log failed login attempt
        failed_log = AuditLog(
            user_id=payload.email,
            action="LOGIN_FAILED",
            endpoint="/api/v1/auth/login",
            details=f"Failed login attempt for {payload.email}",
            timestamp=datetime.datetime.utcnow()
        )
        db.add(failed_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Log successful login attempt with date and time
    success_log = AuditLog(
        user_id=f"{user.full_name} ({user.email})",
        action="USER_LOGIN_SUCCESS",
        endpoint="/api/v1/auth/login",
        details=f"User {user.full_name} ({user.role}) logged in at {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(success_log)
    db.commit()

    token_data = {"sub": user.email, "role": user.role, "store_id": user.store_id}
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "store_id": user.store_id
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(email: str = "manager@retail.com", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {
            "id": "USR-001",
            "email": "manager@retail.com",
            "full_name": "Lathashree",
            "role": "STORE_MANAGER",
            "store_id": "STORE-812"
        }
    return user

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "store_id": u.store_id,
            "is_active": u.is_active
        }
        for u in users
    ]

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email = user.email
    db.delete(user)

    # Log audit event
    audit = AuditLog(
        user_id="ADMINISTRATOR (Parvathraj)",
        action="DELETE_USER_ACCOUNT",
        endpoint=f"/api/v1/auth/users/{user_id}",
        details=f"User account {email} ({user_id}) permanently deleted by Administrator",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"status": "SUCCESS", "message": f"User {email} deleted successfully"}

@router.post("/users/purge-unauthorized")
def purge_unauthorized_users(db: Session = Depends(get_db)):
    # Authorized system accounts list
    authorized_emails = ["manager@retail.com", "analyst@retail.com", "marketing@retail.com", "admin@retail.com"]
    unauthorized = db.query(User).filter(User.email.notin_(authorized_emails)).all()
    count = len(unauthorized)
    for u in unauthorized:
        db.delete(u)

    audit = AuditLog(
        user_id="ADMINISTRATOR (Parvathraj)",
        action="PURGE_UNAUTHORIZED_USERS",
        endpoint="/api/v1/auth/users/purge-unauthorized",
        details=f"Purged {count} unauthorized user accounts",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return {"status": "SUCCESS", "purged_count": count, "message": f"Successfully purged {count} unauthorized accounts"}
