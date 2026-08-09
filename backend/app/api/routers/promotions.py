from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import marketing_access
from app.db.session import get_db
from app.models.product import Product
from app.models.promotion import Promotion
from app.models.shelf import Shelf
from app.models.user import User
from app.schemas.common import Message
from app.schemas.promotion import (
    PromotionCreate,
    PromotionPerformanceResponse,
    PromotionResponse,
    PromotionUpdate,
)
from app.services.audit import record_audit_event
from app.services.crud import CRUDService, clean_integrity_error_detail
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/promotions", tags=["Promotion Management"])
service = CRUDService[Promotion, PromotionCreate, PromotionUpdate](Promotion, "Promotion")


@router.get("", response_model=list[PromotionResponse])
def list_promotions(_: User = Depends(marketing_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=PromotionResponse)
def create_promotion(
    payload: PromotionCreate, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)
):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=PromotionResponse)
def update_promotion(
    item_id: int, payload: PromotionUpdate, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)
):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_promotion(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)


@router.post("/{item_id}/activate", response_model=PromotionResponse)
def activate_promotion(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    promotion = service.get_or_404(db, item_id)
    promotion.status = "Active"
    db.commit()
    db.refresh(promotion)
    record_audit_event(
        db, action="promotion_activated", message=f"Promotion #{promotion.id} activated",
        actor=current_user, resource="promotion", resource_id=promotion.id,
    )
    return promotion


@router.post("/{item_id}/expire", response_model=PromotionResponse)
def expire_promotion(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    promotion = service.get_or_404(db, item_id)
    promotion.status = "Expired"
    db.commit()
    db.refresh(promotion)
    record_audit_event(
        db, action="promotion_expired", message=f"Promotion #{promotion.id} expired",
        actor=current_user, resource="promotion", resource_id=promotion.id, severity="warning",
    )
    return promotion


@router.post("/{item_id}/duplicate", response_model=PromotionResponse)
def duplicate_promotion(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    original = service.get_or_404(db, item_id)
    copy = Promotion(
        name=f"{original.name} (Copy)",
        promotion_type=original.promotion_type,
        status="Scheduled",
        campaign_id=original.campaign_id,
        product_id=original.product_id,
        discount_percent=original.discount_percent,
        start_date=original.start_date,
        end_date=original.end_date,
    )
    db.add(copy)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=clean_integrity_error_detail(exc)
        ) from exc
    db.refresh(copy)
    record_audit_event(
        db, action="promotion_duplicated", message=f"Promotion #{original.id} duplicated as #{copy.id}",
        actor=current_user, resource="promotion", resource_id=copy.id,
    )
    return copy


@router.get("/{item_id}/performance", response_model=PromotionPerformanceResponse)
def promotion_performance(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    """Reach = unique customers tracked at the promoted product's shelf camera
    since the promotion's start date. Engagement = their average dwell time
    at that shelf in the same window. Mirrors campaign_performance's approach
    exactly (same repo methods, same "since start date" convention) so the
    two numbers mean the same thing when compared. Same caveat applies: no
    attribution model, no sales/POS data, so this is real traffic in the
    promotion's window, not a causal conversion or ROI figure."""
    promotion = service.get_or_404(db, item_id)
    if promotion.product_id is None:
        return PromotionPerformanceResponse(
            promotion_id=promotion.id,
            data_available=False,
            note="No product linked to this promotion - link a product to see real reach and engagement from tracking data.",
        )

    product = db.get(Product, promotion.product_id)
    shelf = db.get(Shelf, product.shelf_id) if product else None
    if shelf is None or shelf.camera_id is None:
        return PromotionPerformanceResponse(
            promotion_id=promotion.id,
            data_available=False,
            note="The promoted product's shelf has no camera assigned - nothing to measure yet.",
        )

    repo = TrackingRepository(db)
    since = datetime.combine(promotion.start_date, time.min)
    reach = repo.unique_customers_for_cameras([shelf.camera_id], since=since)
    engagement = round(repo.avg_dwell_seconds([shelf.camera_id], since=since), 1)
    return PromotionPerformanceResponse(
        promotion_id=promotion.id,
        data_available=True,
        reach=reach,
        avg_engagement_seconds=engagement,
        note=f"Unique visitors and average dwell time at '{shelf.shelf_name}' since the promotion's start date.",
    )
