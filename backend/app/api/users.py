from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.schemas.user import UserRead


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SuperAdmin")),
) -> list[UserRead]:
    del current_user
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.put("/{user_id}/status", response_model=UserRead)
def toggle_user_status(
    user_id: UUID,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SuperAdmin")),
) -> UserRead:
    del current_user
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent self-deactivation of default super admin to prevent lockouts
    if user.email == "admin@consumerattention.com" and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default Super Admin account cannot be deactivated."
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SuperAdmin")),
) -> None:
    del current_user
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent self-deletion of default super admin
    if user.email == "admin@consumerattention.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default Super Admin account cannot be deleted."
        )

    db.delete(user)
    db.commit()
