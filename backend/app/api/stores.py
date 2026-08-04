from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user, get_user_email
from app.schemas.store import StoreCreate, StoreUpdate, StoreResponse
from app.services.store_service import StoreService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("stores_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=StoreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new store",
    description="Registers a new retail store with height, width and address (Store Manager or Administrator access required)."
)
def create_store(store_in: StoreCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Creating store '{store_in.name}' by user '{user_email}'")
    return StoreService.create_store(db, store_in)


@router.get(
    "/",
    response_model=List[StoreResponse],
    summary="List all stores",
    description="Retrieve a paginated list of all stores in the system."
)
def list_stores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return StoreService.list_stores(db, skip, limit)


@router.get(
    "/{store_id}",
    response_model=StoreResponse,
    summary="Get store by ID",
    description="Retrieve detailed configurations and dimensions of a specific store."
)
def get_store(store_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return StoreService.get_store(db, store_id)


@router.put(
    "/{store_id}",
    response_model=StoreResponse,
    summary="Update store",
    description="Modify a store's details or dimension parameters (Store Manager or Administrator access required)."
)
def update_store(store_id: str, store_in: StoreUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Updating store '{store_id}' by user '{user_email}'")
    return StoreService.update_store(db, store_id, store_in)


@router.delete(
    "/{store_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a store",
    description="Remove a store registry and its associated assets (Store Manager or Administrator access required)."
)
def delete_store(store_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Deleting store '{store_id}' by user '{user_email}'")
    StoreService.delete_store(db, store_id)
    return None
