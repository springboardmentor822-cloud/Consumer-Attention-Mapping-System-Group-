import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.analytics import ProductAttractivenessScore
from app.models.user import User
from app.schemas.analytics import ProductAttractivenessScoreOut
from app.services.scoring_service import compute_product_scores

router = APIRouter()


@router.post("/compute", response_model=list[ProductAttractivenessScoreOut], status_code=201)
def compute_scores(
    store_id: int,
    period_start: dt.datetime,
    period_end: dt.datetime,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return compute_product_scores(db, store_id, period_start, period_end)


@router.get("", response_model=list[ProductAttractivenessScoreOut])
def list_scores(
    product_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(ProductAttractivenessScore)
    if product_id:
        query = query.filter(ProductAttractivenessScore.product_id == product_id)
    return (
        query.order_by(ProductAttractivenessScore.computed_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
