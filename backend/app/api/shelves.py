from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.schemas.shelf import ShelfCreate, ShelfRead, ShelfUpdate
from backend.app.services.shelf_service import shelf_service


router = APIRouter(prefix="", tags=["Shelves"])


@router.get("/stores/{store_id}/shelves", response_model=list[ShelfRead])
def list_shelves(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShelfRead]:
    del current_user
    return shelf_service.list_shelves_for_store(db, store_id)


@router.post(
    "/stores/{store_id}/shelves",
    response_model=ShelfRead,
    status_code=201,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def create_shelf(store_id: UUID, payload: ShelfCreate, db: Session = Depends(get_db)) -> ShelfRead:
    return shelf_service.create_shelf(db, store_id, payload)


@router.put(
    "/shelves/{shelf_id}",
    response_model=ShelfRead,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def update_shelf(shelf_id: UUID, payload: ShelfUpdate, db: Session = Depends(get_db)) -> ShelfRead:
    return shelf_service.update_shelf(db, shelf_id, payload)


@router.delete(
    "/shelves/{shelf_id}",
    status_code=204,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def delete_shelf(shelf_id: UUID, db: Session = Depends(get_db)) -> None:
    shelf_service.delete_shelf(db, shelf_id)
