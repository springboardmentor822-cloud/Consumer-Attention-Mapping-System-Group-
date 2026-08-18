import uuid
from datetime import date, datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.db import engine
from app.core.deps import require_roles
from app.models.campaign import Campaign, CampaignStatus


router = APIRouter()


def _sync_status(campaign: Campaign) -> bool:
    """Keep stored campaign status aligned with its calendar dates."""
    today = datetime.now(UTC).date()
    if today < campaign.start_date:
        desired = CampaignStatus.upcoming
    elif today > campaign.end_date:
        desired = CampaignStatus.completed
    else:
        desired = CampaignStatus.active

    if campaign.status != desired:
        campaign.status = desired
        return True
    return False



class CampaignCreate(BaseModel):
    store_id: uuid.UUID
    shelf_id: uuid.UUID
    name: str
    start_date: date
    end_date: date


class CampaignUpdate(BaseModel):
    name: str | None = None
    shelf_id: uuid.UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: CampaignStatus | None = None


@router.get("")
def list_campaigns(
    store_id: uuid.UUID | None = None,
    current_user=Depends(
        require_roles("MarketingManager", "SuperAdmin")
    ),
):
    with Session(engine) as session:
        query = select(Campaign).order_by(Campaign.created_at.desc())

        if store_id:
            query = query.where(Campaign.store_id == store_id)

        campaigns = session.exec(query).all()
        changed = any(_sync_status(campaign) for campaign in campaigns)
        if changed:
            session.commit()
            for campaign in campaigns:
                session.refresh(campaign)
        return campaigns


@router.post("")
def create_campaign(
    payload: CampaignCreate,
    current_user=Depends(
        require_roles("MarketingManager", "SuperAdmin")
    ),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date.",
        )

    with Session(engine) as session:
        campaign = Campaign(
            **payload.model_dump(),
            created_by=current_user.id,
            status=CampaignStatus.upcoming,
            created_at=datetime.now(UTC),
        )
        _sync_status(campaign)

        session.add(campaign)
        session.commit()
        session.refresh(campaign)

        return campaign


@router.get("/{campaign_id}")
def get_campaign(
    campaign_id: uuid.UUID,
    current_user=Depends(
        require_roles("MarketingManager", "SuperAdmin")
    ),
):
    with Session(engine) as session:
        campaign = session.get(Campaign, campaign_id)

        if not campaign:
            raise HTTPException(
                status_code=404,
                detail="Campaign not found.",
            )

        if _sync_status(campaign):
            session.add(campaign)
            session.commit()
            session.refresh(campaign)

        return campaign


@router.patch("/{campaign_id}")
def update_campaign(
    campaign_id: uuid.UUID,
    payload: CampaignUpdate,
    current_user=Depends(
        require_roles("MarketingManager", "SuperAdmin")
    ),
):
    with Session(engine) as session:
        campaign = session.get(Campaign, campaign_id)

        if not campaign:
            raise HTTPException(
                status_code=404,
                detail="Campaign not found.",
            )

        updates = payload.model_dump(exclude_unset=True)

        start_date = updates.get(
            "start_date",
            campaign.start_date,
        )
        end_date = updates.get(
            "end_date",
            campaign.end_date,
        )

        if end_date < start_date:
            raise HTTPException(
                status_code=400,
                detail="End date cannot be before start date.",
            )

        for field, value in updates.items():
            setattr(campaign, field, value)

        _sync_status(campaign)
        session.add(campaign)
        session.commit()
        session.refresh(campaign)

        return campaign


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: uuid.UUID,
    current_user=Depends(
        require_roles("MarketingManager", "SuperAdmin")
    ),
):
    with Session(engine) as session:
        campaign = session.get(Campaign, campaign_id)

        if not campaign:
            raise HTTPException(
                status_code=404,
                detail="Campaign not found.",
            )

        session.delete(campaign)
        session.commit()

        return {"message": "Campaign deleted successfully."}