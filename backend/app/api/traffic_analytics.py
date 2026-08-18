import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.db import get_session
from app.core.deps import require_roles
from app.models.camera import Camera
from app.models.store import Store
from app.services.traffic_analytics_service import compute_traffic_over_time, compute_zone_traffic

# Same mount convention as dwell_time.py - prefix="/api/stores" in
# main.py, same store-scoped path shape.
#
# ROLE CHECK ADDED: was get_current_user only. Both endpoints here feed
# both the Store Manager dashboard (Store Traffic section) and the
# Retail Analyst dashboard, so both roles stay allowed.
router = APIRouter()


@router.get("/{store_id}/cameras/{camera_id}/traffic-over-time")
def get_traffic_over_time(
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

    return compute_traffic_over_time(camera_id)


@router.get("/{store_id}/zone-traffic")
def get_zone_traffic(
    store_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    return compute_zone_traffic(store_id)
