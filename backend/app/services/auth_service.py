from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserRegister
from app.schemas.auth import TokenResponse

class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        existing = UserRepository.get_by_email(db, user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            role_id=user_data.role_id,
            is_active=True
        )
        return UserRepository.create(db, new_user)

    @staticmethod
    def authenticate_user(db: Session, email: str, plain_password: str) -> User:
        user = UserRepository.get_by_email(db, email)
        if not user or not verify_password(plain_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect email or password"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user account"
            )
        return user
