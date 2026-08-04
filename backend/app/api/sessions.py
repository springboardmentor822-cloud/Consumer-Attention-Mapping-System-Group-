from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
import datetime
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.services.session_service import SessionService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("sessions_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create tracking session",
    description="Initializes a customer tracking session (Store Manager or Administrator access required)."
)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Creating session for store '{session_in.store_id}' by user '{current_user.email}'")
    return SessionService.create_session(db, session_in)


@router.get(
    "/",
    response_model=List[SessionResponse],
    summary="List tracking sessions",
    description="Retrieve a list of customer tracking sessions."
)
def list_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return SessionService.list_sessions(db, skip, limit)


@router.get(
    "/store/{store_id}",
    response_model=List[SessionResponse],
    summary="List sessions by store",
    description="Retrieve tracking sessions corresponding to a specific store."
)
def list_store_sessions(store_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return SessionService.list_store_sessions(db, store_id, skip, limit)


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session details",
    description="Retrieve tracking logs and state of a customer session."
)
def get_session(session_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return SessionService.get_session(db, session_id)


@router.put(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Update session data",
    description="Modify entry, exit or status fields of a tracking session (Store Manager or Administrator access required)."
)
def update_session(session_id: str, session_in: SessionUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Updating session '{session_id}' by user '{current_user.email}'")
    return SessionService.update_session(db, session_id, session_in)


@router.post(
    "/{session_id}/close",
    response_model=SessionResponse,
    summary="Close tracking session",
    description="Finalizes and closes a tracking session (Store Manager or Administrator access required)."
)
def close_session(session_id: str, exit_time: Optional[datetime.datetime] = None, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Closing session '{session_id}' by user '{current_user.email}'")
    return SessionService.close_session(db, session_id, exit_time)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete session data",
    description="Remove a tracking session registry (Store Manager or Administrator access required)."
)
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    logger.info(f"Deleting session '{session_id}' by user '{current_user.email}'")
    SessionService.delete_session(db, session_id)
    return None
