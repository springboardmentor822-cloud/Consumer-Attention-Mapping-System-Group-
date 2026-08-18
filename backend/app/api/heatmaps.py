# Save as: backend/app/api/heatmaps.py

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.db import engine
from app.core.deps import require_roles
from app.models.camera import Camera
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
