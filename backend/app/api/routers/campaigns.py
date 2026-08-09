from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import marketing_access
from app.db.session import get_db
from app.models.camera import Camera
from app.models.campaign import Campaign
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreate,
    CampaignPerformanceResponse,
    CampaignResponse,
    CampaignUpdate,
)
from app.schemas.common import Message
from app.services.audit import record_audit_event
from app.services.crud import CRUDService, clean_integrity_error_detail
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/campaigns", tags=["Campaign Management"])
service = CRUDService[Campaign, CampaignCreate, CampaignUpdate](Campaign, "Campaign")


@router.get("", response_model=list[CampaignResponse])
def list_campaigns(_: User = Depends(marketing_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=CampaignResponse)
def create_campaign(
    payload: CampaignCreate, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)
):
    campaign = Campaign(**payload.model_dump(), created_by=current_user.id)
    db.add(campaign)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=clean_integrity_error_detail(exc)
        ) from exc
    db.refresh(campaign)
    record_audit_event(
        db, action="campaign_created", message=f"Campaign #{campaign.id} created",
        actor=current_user, resource="campaign", resource_id=campaign.id,
    )
    return campaign


@router.put("/{item_id}", response_model=CampaignResponse)
def update_campaign(
    item_id: int, payload: CampaignUpdate, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)
):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_campaign(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)


@router.post("/{item_id}/activate", response_model=CampaignResponse)
def activate_campaign(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    campaign = service.get_or_404(db, item_id)
    campaign.status = "Active"
    db.commit()
    db.refresh(campaign)
    record_audit_event(
        db, action="campaign_activated", message=f"Campaign #{campaign.id} activated",
        actor=current_user, resource="campaign", resource_id=campaign.id,
    )
    return campaign


@router.post("/{item_id}/deactivate", response_model=CampaignResponse)
def deactivate_campaign(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    campaign = service.get_or_404(db, item_id)
    campaign.status = "Paused"
    db.commit()
    db.refresh(campaign)
    record_audit_event(
        db, action="campaign_deactivated", message=f"Campaign #{campaign.id} deactivated",
        actor=current_user, resource="campaign", resource_id=campaign.id, severity="warning",
    )
    return campaign


@router.post("/{item_id}/duplicate", response_model=CampaignResponse)
def duplicate_campaign(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    original = service.get_or_404(db, item_id)
    copy = Campaign(
        name=f"{original.name} (Copy)",
        campaign_type=original.campaign_type,
        status="Draft",
        start_date=original.start_date,
        end_date=original.end_date,
        budget=original.budget,
        store_id=original.store_id,
        zone_id=original.zone_id,
        description=original.description,
        created_by=current_user.id,
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
        db, action="campaign_duplicated", message=f"Campaign #{original.id} duplicated as #{copy.id}",
        actor=current_user, resource="campaign", resource_id=copy.id,
    )
    return copy


@router.get("/{item_id}/performance", response_model=CampaignPerformanceResponse)
def campaign_performance(item_id: int, current_user: User = Depends(marketing_access), db: Session = Depends(get_db)):
    """Reach = unique customers tracked at the linked store's cameras since the
    campaign's start date. Engagement = their average dwell time in that window.
    There's no attribution model (no way to prove a visit was caused by the
    campaign) - this is real traffic data in the campaign's window, not a
    causal ROI figure."""
    campaign = service.get_or_404(db, item_id)
    if campaign.store_id is None:
        return CampaignPerformanceResponse(
            campaign_id=campaign.id,
            data_available=False,
            note="No store linked to this campaign - link a store to see real reach and engagement from tracking data.",
        )

    camera_ids = [c.id for c in db.query(Camera.id).filter(Camera.store_id == campaign.store_id).all()]
    repo = TrackingRepository(db)
    since = datetime.combine(campaign.start_date, time.min)
    reach = repo.unique_customers_for_cameras(camera_ids, since=since)
    engagement = round(repo.avg_dwell_seconds(camera_ids, since=since), 1)
    return CampaignPerformanceResponse(
        campaign_id=campaign.id,
        data_available=True,
        reach=reach,
        avg_engagement_seconds=engagement,
        note="Unique visitors and average dwell time at the linked store's cameras since the campaign's start date.",
    )
