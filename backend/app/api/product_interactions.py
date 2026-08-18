import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import require_roles
from app.services.product_interactions import get_product_interactions

router = APIRouter()


@router.get("/{store_id}/cameras/{camera_id}/product-interactions")
def product_interactions(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    if start and end and end < start:
        raise HTTPException(
            status_code=400,
            detail="end must be greater than or equal to start",
        )

    return get_product_interactions(
        store_id=store_id,
        camera_id=camera_id,
        start=start,
        end=end,
    )
