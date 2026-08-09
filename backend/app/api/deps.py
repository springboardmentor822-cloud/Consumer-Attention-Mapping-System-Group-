from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.camera import Camera
from app.models.enums import UserRole
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    def checker(current_user: User = Depends(get_current_user)) -> User:
        allowed = [role.value for role in roles]
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return checker


write_access = require_roles(UserRole.admin, UserRole.store_manager)
dashboard_access = require_roles(
    UserRole.admin,
    UserRole.store_manager,
    UserRole.retail_analyst,
    UserRole.marketing_manager,
)
admin_access = require_roles(UserRole.admin)
marketing_access = require_roles(UserRole.admin, UserRole.marketing_manager)


def resolve_store_scope(current_user: User, requested_store_id: int | None) -> int | None:
    """Resolve the effective store_id for a dashboard query.

    A Store Manager is always forced to their own store, regardless of what was
    requested in the query string. Other roles may query any store (or all
    stores, if `requested_store_id` is None).
    """
    if current_user.role == UserRole.store_manager.value:
        if current_user.store_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is not assigned to a store yet",
            )
        return current_user.store_id
    return requested_store_id


def resolve_camera_scope(db: Session, current_user: User, requested_camera_id: int | None) -> list[int] | None:
    """Resolve which camera_ids the current user may see.

    Returns None to mean "no restriction" (any role other than Store Manager).
    A Store Manager is restricted to their own store's cameras; if they asked
    for a specific camera outside that set, that's a 403, not a silent filter.
    """
    if current_user.role != UserRole.store_manager.value:
        return None
    if current_user.store_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not assigned to a store yet",
        )
    allowed = [c.id for c in db.query(Camera.id).filter(Camera.store_id == current_user.store_id).all()]
    if requested_camera_id is not None and requested_camera_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Camera does not belong to your store")
    return allowed
