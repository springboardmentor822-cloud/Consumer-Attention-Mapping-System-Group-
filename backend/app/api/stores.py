from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.schemas.store import StoreCreate, StoreRead, StoreUpdate
from backend.app.services.store_service import store_service


router = APIRouter(prefix="/stores", tags=["Stores"])


@router.get("", response_model=list[StoreRead])
def list_stores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StoreRead]:
    # Allow all roles to list approved stores (or all if admin)
    if current_user.role.role_name == "Administrator":
        return store_service.list_stores(db)
    
    # Store Manager can see all to choose or see their assigned one
    # Only return approved stores for other roles
    stores = store_service.list_stores(db)
    if current_user.role.role_name == "Store Manager":
        return stores
    return [s for s in stores if s.is_approved]


@router.get("/{store_id}", response_model=StoreRead)
def get_store(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StoreRead:
    store = store_service.get_store(db, store_id)
    # Store Manager can only view details if approved or if it is their assigned store
    if current_user.role.role_name == "Store Manager" and current_user.store_id != store_id and not store.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this unapproved store."
        )
    return store


@router.post("", response_model=StoreRead, status_code=201)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> StoreRead:
    store = store_service.create_store(db, payload)
    return store


@router.put("/{store_id}", response_model=StoreRead)
def update_store(
    store_id: UUID,
    payload: StoreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Store Manager")),
) -> StoreRead:
    if current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your assigned store."
        )
    return store_service.update_store(db, store_id, payload)


@router.put("/{store_id}/approve", response_model=StoreRead)
def approve_store(
    store_id: UUID,
    is_approved: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> StoreRead:
    return store_service.approve_store(db, store_id, is_approved)


@router.delete("/{store_id}", status_code=204)
def delete_store(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> None:
    store_service.delete_store(db, store_id)
