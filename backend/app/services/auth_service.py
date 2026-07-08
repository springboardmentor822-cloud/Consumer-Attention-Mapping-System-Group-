from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import HTTPException, status

from backend.app.core.security import create_access_token, get_password_hash, verify_password
from backend.app.models.role import Role
from backend.app.models.user import User
from backend.app.schemas.auth import LoginRequest, RegisterRequest


class AuthService:
    def get_user_by_email(self, db: Session, email: str) -> User | None:
        statement = (
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email)
        )
        return db.scalar(statement)

    def get_role_by_name(self, db: Session, role_name: str) -> Role | None:
        return db.scalar(select(Role).where(Role.role_name == role_name))

    def register(self, db: Session, payload: RegisterRequest) -> User:
        if payload.role == "SuperAdmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super Admin accounts cannot be created via public registration.",
            )
        existing_user = self.get_user_by_email(db, payload.email)
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        role = self.get_role_by_name(db, payload.role)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{payload.role}' is invalid or does not exist.",
            )

        user = User(
            email=payload.email,
            hashed_password=get_password_hash(payload.password),
            role_id=role.id,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return self.get_user_by_email(db, user.email) or user

    def authenticate(self, db: Session, payload: LoginRequest) -> User:
        user = self.get_user_by_email(db, payload.email)
        if user is None or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        return user

    def build_auth_response(self, user: User) -> dict[str, object]:
        token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.role_name})
        return {"access_token": token, "token_type": "bearer", "user": user}


auth_service = AuthService()
