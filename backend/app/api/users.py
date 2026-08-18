import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.deps import require_roles
from app.models.user import User, Role
from app.models.event_log import EventCategory
from app.services.audit import log_event
from pydantic import BaseModel

router = APIRouter()


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role_name: str | None
    is_active: bool


class RoleUpdate(BaseModel):
    role_name: str


class ActiveUpdate(BaseModel):
    is_active: bool


def _to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        role_name=user.role.name if user.role else None,
        is_active=user.is_active,
    )


@router.get("", response_model=list[UserOut])
def list_users(
    session: Session = Depends(get_session),
    _=Depends(require_roles("SuperAdmin")),
):
    # No pagination - fine for a handful of test accounts, will need one
    # the moment this project has real user volume. Flagging rather than
    # building it now since it's not needed yet.
    users = session.exec(select(User)).all()
    return [_to_out(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: uuid.UUID,
    payload: RoleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles("SuperAdmin")),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = session.exec(select(Role).where(Role.name == payload.role_name)).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Unknown role: {payload.role_name}")

    # Guard: a SuperAdmin demoting themselves is a real self-lockout risk
    # if they're the only SuperAdmin account that exists - worse than the
    # earlier StoreManager owner_id gap, since that only hid a store,
    # this could lock the last admin out of the whole system. Block it
    # outright rather than relying on the frontend to prevent it.
    if user.id == current_user.id and payload.role_name != "SuperAdmin":
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role away from SuperAdmin",
        )

    previous_role = user.role.name if user.role else None
    user.role_id = role.id
    session.add(user)
    session.commit()
    session.refresh(user)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="role_changed",
        description=f"Role changed for {user.email}: {previous_role} -> {role.name}",
        actor_user_id=current_user.id,
        target_type="user",
        target_id=user.id,
        metadata={"old_role": previous_role, "new_role": role.name},
    )
    return _to_out(user)


@router.patch("/{user_id}/active", response_model=UserOut)
def set_user_active(
    user_id: uuid.UUID,
    payload: ActiveUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_roles("SuperAdmin")),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Same self-lockout concern as the role guard above - deactivating
    # your own only SuperAdmin account would need a second SuperAdmin to
    # ever undo it. Block it.
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    previous_active = user.is_active
    user.is_active = payload.is_active
    session.add(user)
    session.commit()
    session.refresh(user)

    log_event(
        session=session,
        category=EventCategory.security,
        event_type="permission_change",
        description=f"Account active status changed for {user.email}: {previous_active} -> {user.is_active}",
        actor_user_id=current_user.id,
        target_type="user",
        target_id=user.id,
        metadata={"old_is_active": previous_active, "new_is_active": user.is_active},
    )
    return _to_out(user)
