from uuid import UUID

from fastapi import APIRouter, Depends
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
    del current_user
    return store_service.list_stores(db)


@router.get("/{store_id}", response_model=StoreRead)
def get_store(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StoreRead:
    del current_user
    return store_service.get_store(db, store_id)


@router.post(
    "",
    response_model=StoreRead,
    status_code=201,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def create_store(payload: StoreCreate, db: Session = Depends(get_db)) -> StoreRead:
    return store_service.create_store(db, payload)


@router.put(
    "/{store_id}",
    response_model=StoreRead,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def update_store(store_id: UUID, payload: StoreUpdate, db: Session = Depends(get_db)) -> StoreRead:
    return store_service.update_store(db, store_id, payload)


@router.delete(
    "/{store_id}",
    status_code=204,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def delete_store(store_id: UUID, db: Session = Depends(get_db)) -> None:
    store_service.delete_store(db, store_id)
