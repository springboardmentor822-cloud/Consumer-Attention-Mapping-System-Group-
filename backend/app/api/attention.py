from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.schemas.attention import AttentionCreate, AttentionUpdate, AttentionResponse
from app.services.attention_service import AttentionService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("attention_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=AttentionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record customer attention event",
    description="Registers a new customer gaze, fixation, or facial orientation attention log (Store Manager or Administrator access required)."
)
def create_attention_event(event_in: AttentionCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Creating attention event by user '{current_user.email}'", extra={"session_id": event_in.session_id, "camera_id": event_in.camera_id})
    return AttentionService.create_attention_event(db, event_in)


@router.get(
    "/",
    response_model=List[AttentionResponse],
    summary="List attention events",
    description="Retrieve logged attention events filtered by session, camera, zone or score thresholds."
)
def list_attention_events(
    session_id: Optional[str] = Query(None, description="Optional session filter"),
    camera_id: Optional[str] = Query(None, description="Optional camera ID filter"),
    zone_id: Optional[str] = Query(None, description="Optional zone ID filter"),
    min_attention_score: Optional[float] = Query(None, description="Optional minimum attention score filter"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AttentionService.list_attention_events(db, session_id, camera_id, zone_id, min_attention_score, skip, limit)


@router.get(
    "/{event_id}",
    response_model=AttentionResponse,
    summary="Get attention event details",
    description="Retrieve coordinates, gaze vectors and durations of a specific gaze tracking record."
)
def get_attention_event(event_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return AttentionService.get_attention_event(db, event_id)


@router.put(
    "/{event_id}",
    response_model=AttentionResponse,
    summary="Update attention event details",
    description="Modify coordinates, scores, or timestamps of a gaze event (Store Manager or Administrator access required)."
)
def update_attention_event(event_id: str, event_in: AttentionUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Updating attention event '{event_id}' by user '{current_user.email}'")
    return AttentionService.update_attention_event(db, event_id, event_in)


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete attention event",
    description="Permanently remove a gaze event log from the repository (Store Manager or Administrator access required)."
)
def delete_attention_event(event_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Deleting attention event '{event_id}' by user '{current_user.email}'")
    AttentionService.delete_attention_event(db, event_id)
    return None
