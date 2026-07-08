from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
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
    # Store Manager can only list shelves of their assigned store
    if current_user.role.role_name == "Store Manager" and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view shelves of your assigned store."
        )
    return shelf_service.list_shelves_for_store(db, store_id)


@router.post("/stores/{store_id}/shelves", response_model=ShelfRead, status_code=201)
def create_shelf(
    store_id: UUID,
    payload: ShelfCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Store Manager")),
) -> ShelfRead:
    if current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage shelves of your assigned store."
        )
    return shelf_service.create_shelf(db, store_id, payload)


@router.put("/shelves/{shelf_id}", response_model=ShelfRead)
def update_shelf(
    shelf_id: UUID,
    payload: ShelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Store Manager")),
) -> ShelfRead:
    shelf = shelf_service.get_shelf(db, shelf_id)
    if current_user.store_id != shelf.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage shelves of your assigned store."
        )
    return shelf_service.update_shelf(db, shelf_id, payload)


@router.delete("/shelves/{shelf_id}", status_code=204)
def delete_shelf(
    shelf_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Store Manager")),
) -> None:
    shelf = shelf_service.get_shelf(db, shelf_id)
    if current_user.store_id != shelf.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage shelves of your assigned store."
        )
    shelf_service.delete_shelf(db, shelf_id)
