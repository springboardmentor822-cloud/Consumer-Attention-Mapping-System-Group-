from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.user import User
from backend.app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("")
def list_recommendations(
    store_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager", "Retail Analyst", "Marketing Manager")),
):
    """Get stored data-driven recommendations."""
    from backend.app.models.store import Store
    if store_id:
        service = RecommendationService(db)
        return service.get_recommendations(store_id)

    # If no store_id, get recommendations for all stores
    stores = db.query(Store).all()
    all_recs = []
    service = RecommendationService(db)
    for store in stores:
        all_recs.extend(service.get_recommendations(store.id))
    return all_recs
