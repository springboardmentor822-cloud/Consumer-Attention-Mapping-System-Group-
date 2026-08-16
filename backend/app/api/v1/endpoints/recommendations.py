from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.analytics import Recommendation
from app.models.user import User
from app.schemas.analytics import RecommendationOut
from app.services.recommendation_service import generate_recommendations_for_store

router = APIRouter()


@router.post("/generate/{store_id}", response_model=list[RecommendationOut], status_code=201)
def generate(
    store_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)
):
    return generate_recommendations_for_store(db, store_id)


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(
    store_id: int | None = None,
    include_dismissed: bool = False,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Recommendation)
    if store_id:
        query = query.filter(Recommendation.store_id == store_id)
    if not include_dismissed:
        query = query.filter(Recommendation.is_dismissed == 0)
    return query.order_by(Recommendation.created_at.desc()).all()


@router.patch("/{recommendation_id}/dismiss", response_model=RecommendationOut)
def dismiss(
    recommendation_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)
):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.is_dismissed = 1
    db.commit()
    db.refresh(rec)
    return rec
