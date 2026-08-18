import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles
from app.models.camera import Camera
from app.models.store import Store
from app.services.compute_dwell_time import compute_dwell_time_data, DwellTimeUnavailable

# Mirrors shelves.py's mount convention - same router pattern, same
# get_session dep, same store-scoped path shape (/{store_id}/...).
# Confirmed against main.py: mount this with
# app.include_router(dwell_time.router, prefix="/api/stores", tags=["dwell-time"]),
# same prefix as shelves/cameras/zones - NOT the /api/shelves prefix
# shelf_camera_views.router uses, since this endpoint is scoped by
# store_id + camera_id, not shelf_id.
#
# ROLE CHECK ADDED: was get_current_user only (any authenticated user,
# any role) - upgraded to require_roles so a plain "logged in" account
# can't read dwell-time for a store it has no business seeing. Allowed
# roles: dwell-time is consumed by both the Store Manager dashboard
# (Shelf Performance section) and the Retail Analyst dashboard
# (Attention Analytics section), so both roles are legitimate here.
router = APIRouter()


@router.get("/{store_id}/cameras/{camera_id}/dwell-time")
def get_dwell_time(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    camera = session.get(Camera, camera_id)
    if not camera or camera.store_id != store_id:
        raise HTTPException(status_code=404, detail="Camera not found for this store")

    try:
        # Reuses compute_dwell_time.py's own logic (run-isolation, x-range
        # proxy, FPS-based elapsed time) rather than re-deriving it here -
        # see that file's module docstring for why each of those choices
        # was made.
        return compute_dwell_time_data(camera_id)
    except DwellTimeUnavailable:
        # Not a server error - just means no ShelfCameraView configured
        # yet, or tracking_runner hasn't been run against this camera
        # yet. Empty list lets the frontend show its own "no data yet"
        # message instead of surfacing an error banner for an expected
        # state.
        return []
