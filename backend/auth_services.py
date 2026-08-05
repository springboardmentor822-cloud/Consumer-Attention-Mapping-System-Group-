from sqlalchemy.orm import Session

import models
import schemas

from utils.security import hash_password, verify_password
from utils.jwt_handler import create_access_token


# =====================================================
# REGISTER USER
# =====================================================

def register_user(db: Session, user: schemas.UserCreate):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        return None

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        role=user.role if user.role else "Store Manager",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =====================================================
# LOGIN USER
# =====================================================

def login_user(db: Session, email: str, password: str):

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if user is None:
        return None

    if not verify_password(password, user.password):
        return None

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "id": user.id,
            "username": user.username,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }


# =====================================================
# GET USER BY EMAIL
# =====================================================

def get_user_by_email(db: Session, email: str):

    return db.query(models.User).filter(
        models.User.email == email
    ).first()


# =====================================================
# GET USER BY ID
# =====================================================

def get_user_by_id(db: Session, user_id: int):

    return db.query(models.User).filter(
        models.User.id == user_id
    ).first()


# =====================================================
# GET ALL USERS
# =====================================================

def get_all_users(db: Session):

    return db.query(models.User).all()


# =====================================================
# DELETE USER
# =====================================================

def delete_user(db: Session, user_id: int):

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        return False

    db.delete(user)
    db.commit()

    return True


# =====================================================
# UPDATE USER ROLE
# =====================================================

def update_user_role(db: Session, user_id: int, role: str):

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        return None

    user.role = role

    db.commit()

    db.refresh(user)

    return user