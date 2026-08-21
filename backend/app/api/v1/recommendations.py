from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.db import get_db
from app.models.models import Recommendation, Product
from app.api.v1.analytics import get_product_attractiveness
from app.services.analytics.recommendation import generate_merchandising_recommendations

router = APIRouter()

@router.get("")
def get_recommendations(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    # Query database recommendations
    recs_db = db.query(Recommendation).filter(Recommendation.store_id == store_id).all()
    if recs_db:
        return [
            {
                "id": r.id,
                "priority": r.priority,
                "store_id": r.store_id,
                "sku": r.sku,
                "shelf_id": r.shelf_id,
                "action": r.action,
                "reason": r.reason,
                "expected_conversion_uplift": r.expected_conversion_uplift
            }
            for r in recs_db
        ]

    # Dynamically generate recommendations
    scored = get_product_attractiveness(store_id=store_id, db=db)
    shelf_dwell_stats = [
        {"shelf_id": "SHELF-04", "store_id": store_id, "total_dwell": 45.0},
        {"shelf_id": "SHELF-09", "store_id": store_id, "total_dwell": 120.0}
    ]
    generated = generate_merchandising_recommendations(scored, shelf_dwell_stats)
    return generated
