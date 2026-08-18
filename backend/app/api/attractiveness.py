import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_roles
from app.services.attractiveness_score import (
    compute_attractiveness_scores,
    get_attractiveness_history,
    AttractivenessScoringUnavailable,
)

# ROLE CHECK ADDED: this router had NO auth dependency at all before -
# not even get_current_user - so both endpoints below were reachable by
# anyone with the URL, no token required. Attractiveness scores feed both
# Store Manager (Shelf Performance) and Retail Analyst (Product
# Attractiveness / trend chart) dashboards, so both roles are allowed.
router = APIRouter()


@router.get("/{store_id}/cameras/{camera_id}/attractiveness")
def get_attractiveness_scores(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    try:
        return compute_attractiveness_scores(camera_id)
    except AttractivenessScoringUnavailable as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{store_id}/cameras/{camera_id}/attractiveness/history")
def get_attractiveness_scores_history(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    # No AttractivenessScoringUnavailable here - an empty history (camera
    # never scored, or all rows aged out of retention) is a normal 200
    # with an empty list, not an error - a trend chart handles "no data
    # yet" fine, unlike the single-snapshot endpoint above which has
    # nothing sensible to return at all if scoring hasn't run once.
    return get_attractiveness_history(camera_id)
