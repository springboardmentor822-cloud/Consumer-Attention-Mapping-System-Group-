import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_roles
from app.services.recommendation_engine import (
    compute_and_persist_recommendations,
    RecommendationEngineUnavailable,
)

# ROLE CHECK ADDED: no auth dependency existed at all before. Shown on
# the general /dashboard live-view page as well as the role-specific
# ones, so this stays open to all three real app roles rather than
# scoped to one dashboard.
router = APIRouter()


@router.get("/{store_id}/recommendations")
def get_recommendations(
    store_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    try:
        return compute_and_persist_recommendations(store_id)
    except RecommendationEngineUnavailable as e:
        raise HTTPException(status_code=404, detail=str(e))
