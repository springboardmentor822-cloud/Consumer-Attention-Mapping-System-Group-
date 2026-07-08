from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.schemas.user import UserRead, UserUpdate, RoleRead


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/roles", response_model=list[RoleRead])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> list[RoleRead]:
    del current_user
    return list(db.scalars(select(Role).order_by(Role.id.asc())).all())


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> list[UserRead]:
    del current_user
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> UserRead:
    del current_user
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Prevent self de-escalation of the default administrator
    if user.email == "admin@consumerattention.com" and payload.role_id is not None:
        # Check if the payload tries to change its role ID to something else
        role_statement = select(Role).where(Role.role_name == "Administrator")
        admin_role = db.scalar(role_statement)
        if admin_role and payload.role_id != admin_role.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The default Administrator account role cannot be changed."
            )

    if payload.role_id is not None:
        user.role_id = payload.role_id
    if payload.store_id is not None:
        # Check if it's set to None or a uuid
        user.store_id = payload.store_id
    if payload.is_active is not None:
        if user.email == "admin@consumerattention.com" and not payload.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The default Administrator account cannot be deactivated."
            )
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}/status", response_model=UserRead)
def toggle_user_status(
    user_id: UUID,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> UserRead:
    del current_user
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent self-deactivation of default admin to prevent lockouts
    if user.email == "admin@consumerattention.com" and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default Administrator account cannot be deactivated."
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> None:
    del current_user
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Prevent self-deletion of default admin
    if user.email == "admin@consumerattention.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default Administrator account cannot be deleted."
        )

    db.delete(user)
    db.commit()
