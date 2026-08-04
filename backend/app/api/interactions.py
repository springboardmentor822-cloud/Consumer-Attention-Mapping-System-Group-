from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.schemas.interaction import InteractionCreate, InteractionUpdate, InteractionResponse
from app.services.interaction_service import InteractionService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("interactions_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=InteractionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record product interaction",
    description="Logs a new product pickup, inspection or purchase interaction (Store Manager or Administrator access required)."
)
def create_interaction(interaction_in: InteractionCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Creating product interaction by user '{current_user.email}'", extra={"session_id": interaction_in.session_id, "product_id": interaction_in.product_id})
    return InteractionService.create_interaction(db, interaction_in)


@router.get(
    "/",
    response_model=List[InteractionResponse],
    summary="List product interactions",
    description="Retrieve interactions optionally filtered by session, product, shelf or interaction type."
)
def list_interactions(
    session_id: Optional[str] = Query(None, description="Optional session filter"),
    product_id: Optional[str] = Query(None, description="Optional product SKU filter"),
    shelf_id: Optional[str] = Query(None, description="Optional shelf ID filter"),
    interaction_type: Optional[str] = Query(None, description="Optional interaction type (e.g. pickup, return, purchase)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return InteractionService.list_interactions(db, session_id, product_id, shelf_id, interaction_type, skip, limit)


@router.get(
    "/{interaction_id}",
    response_model=InteractionResponse,
    summary="Get interaction details",
    description="Retrieve detailed configurations and timestamp logs of a specific interaction."
)
def get_interaction(interaction_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return InteractionService.get_interaction(db, interaction_id)


@router.put(
    "/{interaction_id}",
    response_model=InteractionResponse,
    summary="Update product interaction record",
    description="Modify interaction type or parameters (Store Manager or Administrator access required)."
)
def update_interaction(interaction_id: str, interaction_in: InteractionUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Updating interaction '{interaction_id}' by user '{current_user.email}'")
    return InteractionService.update_interaction(db, interaction_id, interaction_in)


@router.delete(
    "/{interaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product interaction record",
    description="Remove a logged interaction from the repository (Store Manager or Administrator access required)."
)
def delete_interaction(interaction_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Deleting interaction '{interaction_id}' by user '{current_user.email}'")
    InteractionService.delete_interaction(db, interaction_id)
    return None
