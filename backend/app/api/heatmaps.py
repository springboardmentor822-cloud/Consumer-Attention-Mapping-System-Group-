# Save as: backend/app/api/heatmaps.py

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.db import engine
from app.core.deps import require_roles
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Shelf
from app.services.heatmap_engine import get_or_generate_heatmap

# ROLE CHECK ADDED: no auth dependency existed at all before - both
# routes were reachable by anyone with the URL. Heatmaps are used by
# both Store Manager (Store Heatmap section) and Retail Analyst
# (Heatmaps section), so both roles stay allowed.
router = APIRouter(prefix="/api/v1/heatmaps", tags=["heatmaps"])


@router.get("/store/{store_id}")
def get_store_heatmaps(
    store_id: uuid.UUID,
    class_name: str | None = Query(
        default=None,
        description="Omit for person/shopper traffic. Pass a real product "
                    "class_name (e.g. 'candy') for product-gaze density instead.",
    ),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    """
    Per M3 doc: '/api/v1/heatmaps/store' with filters by store ID, date
    range, shopper segment. NOTE: shopper-segment filtering is NOT
    implemented yet (needs ShopperSegment joined against track_id, and
    only Camera 1 has been segmented so far) - only store/class/date-range
    filters work right now.
    """
    with Session(engine) as session:
        cameras = session.exec(select(Camera).where(Camera.store_id == store_id)).all()

    if not cameras:
        raise HTTPException(status_code=404, detail=f"No cameras found for store {store_id}")

    results = {}
    errors = {}
    for camera in cameras:
        try:
            results[str(camera.id)] = {
                "camera_name": camera.name,
                **get_or_generate_heatmap(camera.id, class_name, start_time, end_time),
            }
        except ValueError as e:
            # heatmap_engine raises ValueError on <3 points - not every
            # camera/window combo will have enough data, don't let one
            # empty camera 500 the whole store response
            errors[str(camera.id)] = {"camera_name": camera.name, "error": str(e)}

    return {"store_id": str(store_id), "heatmaps": results, "skipped": errors}


@router.get("/shelf/{shelf_id}")
def get_shelf_heatmap(
    shelf_id: uuid.UUID,
    class_name: str | None = Query(default=None),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    """
    Per M3 doc: '/api/v1/heatmaps/shelf' - the pairing endpoint alongside
    /store above. This is deliberately shelf-scoped, not camera-scoped:
    a shelf can be seen by more than one camera (see ShelfCameraView's
    module docstring - Zone 2's cameras 2 & 3 both see the same shelves,
    from different angles). A camera_id-only endpoint would silently
    return an incomplete picture for any shelf with more than one
    camera view. This aggregates every camera that actually has a
    ShelfCameraView row for the shelf, same skip-on-error pattern as
    the /store endpoint above so one thin camera doesn't 500 the rest.
    """
    with Session(engine) as session:
        shelf = session.get(Shelf, shelf_id)
        if shelf is None:
            raise HTTPException(status_code=404, detail=f"Shelf {shelf_id} not found")

        views = session.exec(
            select(ShelfCameraView, Camera)
            .join(Camera, Camera.id == ShelfCameraView.camera_id)
            .where(ShelfCameraView.shelf_id == shelf_id)
        ).all()

    if not views:
        raise HTTPException(
            status_code=404,
            detail=f"No camera is configured to view shelf {shelf_id} (no ShelfCameraView rows).",
        )

    results = {}
    errors = {}
    for _view, camera in views:
        try:
            results[str(camera.id)] = {
                "camera_name": camera.name,
                **get_or_generate_heatmap(camera.id, class_name, start_time, end_time),
            }
        except ValueError as e:
            errors[str(camera.id)] = {"camera_name": camera.name, "error": str(e)}

    return {
        "shelf_id": str(shelf_id),
        "shelf_name": shelf.shelf_name,
        "heatmaps": results,
        "skipped": errors,
    }


@router.get("/camera/{camera_id}")
def get_camera_heatmap(
    camera_id: uuid.UUID,
    class_name: str | None = Query(default=None),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    """Single-camera version - useful for testing one camera without pulling the whole store."""
    try:
        return get_or_generate_heatmap(camera_id, class_name, start_time, end_time)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
