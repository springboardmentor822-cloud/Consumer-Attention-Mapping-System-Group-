from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user, get_user_email
from app.schemas.shelf import ShelfCreate, ShelfUpdate, ShelfResponse
from app.services.shelf_service import ShelfService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("shelves_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=ShelfResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new shelf",
    description="Registers a new aisle shelf coordinate mapping in a store (Store Manager or Administrator access required)."
)
def create_shelf(shelf_in: ShelfCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Creating shelf '{shelf_in.name}' by user '{user_email}'")
    return ShelfService.create_shelf(db, shelf_in)


@router.get(
    "/",
    response_model=List[ShelfResponse],
    summary="List all shelves",
    description="Retrieve a paginated list of all active shelf mappings."
)
def list_shelves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ShelfService.list_shelves(db, skip, limit)


@router.get(
    "/store/{store_id}",
    response_model=List[ShelfResponse],
    summary="List shelves by store",
    description="Retrieve all shelves configured under a specific store."
)
def list_store_shelves(store_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ShelfService.list_store_shelves(db, store_id, skip, limit)


@router.get(
    "/{shelf_id}",
    response_model=ShelfResponse,
    summary="Get shelf details",
    description="Retrieve coordinates and dimensional parameters of a specific shelf."
)
def get_shelf(shelf_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ShelfService.get_shelf(db, shelf_id)


@router.put(
    "/{shelf_id}",
    response_model=ShelfResponse,
    summary="Update shelf configurations",
    description="Modify position bounding boxes or names of a shelf (Store Manager or Administrator access required)."
)
def update_shelf(shelf_id: str, shelf_in: ShelfUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Updating shelf '{shelf_id}' by user '{user_email}'")
    return ShelfService.update_shelf(db, shelf_id, shelf_in)


@router.delete(
    "/{shelf_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shelf mapping",
    description="Permanently remove a shelf mapping by ID (Store Manager or Administrator access required)."
)
def delete_shelf(shelf_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Deleting shelf '{shelf_id}' by user '{user_email}'")
    ShelfService.delete_shelf(db, shelf_id)
    return None
