from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import admin_access, get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit import record_audit_event


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if payload.store_id is not None and not db.get(Store, payload.store_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password=get_password_hash(payload.password),
        role=payload.role.value,
        store_id=payload.store_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    record_audit_event(
        db, action="user_registered", message=f"New user registered: {user.email} ({user.role})",
        actor=user, resource="user", resource_id=user.id,
    )
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # Email is case-insensitive for login (Aniket@gmail.com and
    # aniket@gmail.com are the same account) - matched by lowercasing both
    # sides, not by fuzzy/typo matching, so aniket@gmai.com still correctly
    # fails to match. Registration's uniqueness check and stored casing are
    # untouched.
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user or not verify_password(payload.password, user.password):
        record_audit_event(
            db, action="login_failed", message=f"Failed login attempt for {payload.email}", severity="warning",
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        record_audit_event(
            db, action="login_blocked", message=f"Login blocked for inactive account {user.email}",
            actor=user, severity="warning",
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    record_audit_event(db, action="login_success", message=f"{user.email} logged in", actor=user)
    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(access_token=token)


@router.get("/profile", response_model=UserResponse)
def profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/users", response_model=list[UserResponse])
def users(_: User = Depends(admin_access), db: Session = Depends(get_db)) -> list[User]:
    return db.query(User).order_by(User.id.desc()).all()