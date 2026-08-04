from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user, get_user_email
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneResponse
from app.services.zone_service import ZoneService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("zones_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=ZoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new zone",
    description="Registers a store floor zone layout mapping (Store Manager or Administrator access required)."
)
def create_zone(zone_in: ZoneCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Creating zone '{zone_in.name}' by user '{user_email}'")
    return ZoneService.create_zone(db, zone_in)


@router.get(
    "/",
    response_model=List[ZoneResponse],
    summary="List all zones",
    description="Retrieve a paginated list of all active floor zones."
)
def list_zones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ZoneService.list_zones(db, skip, limit)


@router.get(
    "/store/{store_id}",
    response_model=List[ZoneResponse],
    summary="List zones by store ID",
    description="Retrieve all zones configured inside a specific store layout."
)
def list_store_zones(store_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ZoneService.list_store_zones(db, store_id, skip, limit)


@router.get(
    "/{zone_id}",
    response_model=ZoneResponse,
    summary="Get zone details",
    description="Retrieve positions, dimensions and metadata of a specific zone layout."
)
def get_zone(zone_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return ZoneService.get_zone(db, zone_id)


@router.put(
    "/{zone_id}",
    response_model=ZoneResponse,
    summary="Update zone configurations",
    description="Modify boundaries, labels or coordinates of a zone (Store Manager or Administrator access required)."
)
def update_zone(zone_id: str, zone_in: ZoneUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Updating zone '{zone_id}' by user '{user_email}'")
    return ZoneService.update_zone(db, zone_id, zone_in)


@router.delete(
    "/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a zone mapping",
    description="Permanently remove a zone mapping layout by ID (Store Manager or Administrator access required)."
)
def delete_zone(zone_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Deleting zone '{zone_id}' by user '{user_email}'")
    ZoneService.delete_zone(db, zone_id)
    return None
