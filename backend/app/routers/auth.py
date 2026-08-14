from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserOut, Token, LoginRequest, ProfileUpdate, ChangePasswordRequest, AdminUserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    target_role = payload.role
    if isinstance(target_role, str):
        role_str = target_role.strip().lower().replace(" ", "_")
        for r in UserRole:
            if r.value == role_str or r.name.lower() == role_str:
                target_role = r
                break

    user = User(
        full_name=payload.full_name,
        email=clean_email,
        hashed_password=hash_password(payload.password),
        role=target_role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user



@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_input = payload.email.strip().lower()
    
    # Match full email OR username prefix (e.g. "admin" or "market" or full email)
    user = db.query(User).filter(
        or_(
            func.lower(User.email) == clean_input,
            func.lower(User.email).like(f"{clean_input}@%")
        )
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled. Please contact Administrator.")

    token = create_access_token({"sub": user.email, "role": user.role.value})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_email = payload.email.strip().lower()
    if clean_email != current_user.email.lower():
        existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use by another user")

    current_user.full_name = payload.full_name
    current_user.email = clean_email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_role(UserRole.STORE_MANAGER, UserRole.ADMINISTRATOR))):
    return db.query(User).all()


@router.put("/users/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMINISTRATOR))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        clean_email = payload.email.strip().lower()
        existing = db.query(User).filter(func.lower(User.email) == clean_email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = clean_email
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/status", response_model=UserOut)
def admin_toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.ADMINISTRATOR))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user

