from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.models import Campaign

router = APIRouter()

@router.get("")
def list_campaigns(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).filter(Campaign.store_id == store_id).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "store_id": c.store_id,
            "target_category": c.target_category,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "status": c.status,
            "lift_percentage": c.lift_percentage
        }
        for c in campaigns
    ]
