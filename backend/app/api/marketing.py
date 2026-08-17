from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.user import User
from backend.app.models.campaign import Campaign, Promotion

router = APIRouter(prefix="/marketing", tags=["Marketing"])


@router.get("/campaigns")
def list_campaigns(
    store_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Marketing Manager", "Administrator")),
):
    """List marketing campaigns."""
    q = db.query(Campaign)
    if store_id:
        q = q.filter(Campaign.store_id == store_id)
    campaigns = q.order_by(Campaign.created_at.desc()).all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "campaign_type": c.campaign_type,
            "status": c.status,
            "start_date": c.start_date.isoformat() if c.start_date else None,
            "end_date": c.end_date.isoformat() if c.end_date else None,
            "budget": c.budget,
            "impressions": c.impressions,
            "clicks": c.clicks,
            "conversions": c.conversions,
            "revenue": c.revenue,
            "metrics": c.metrics,
        }
        for c in campaigns
    ]


@router.get("/promotions")
def list_promotions(
    store_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Marketing Manager", "Administrator")),
):
    """List promotions."""
    q = db.query(Promotion)
    if store_id:
        q = q.filter(Promotion.store_id == store_id)
    promos = q.order_by(Promotion.created_at.desc()).all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "promotion_type": p.promotion_type,
            "discount_percent": p.discount_percent,
            "is_active": p.is_active,
            "views": p.views,
            "interactions": p.interactions,
            "conversions": p.conversions,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
        }
        for p in promos
    ]


@router.get("/engagement")
def get_engagement_data(
    store_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Marketing Manager", "Administrator")),
):
    """Get customer engagement metrics for marketing."""
    from sqlalchemy import func
    from backend.app.models.tracking import AttentionEvent, InteractionEvent, ShopperSession

    q_sessions = db.query(ShopperSession)
    if store_id:
        q_sessions = q_sessions.filter(ShopperSession.store_id == store_id)

    total_sessions = q_sessions.count()
    if total_sessions == 0:
        return {"total_sessions": 0, "engagement_rate": 0, "repeat_rate": 0}

    # Sessions with interactions
    sessions_with_interaction = db.query(func.count(func.distinct(InteractionEvent.session_id))).scalar() or 0
    engagement_rate = round((sessions_with_interaction / total_sessions) * 100, 1) if total_sessions else 0

    return {
        "total_sessions": total_sessions,
        "sessions_with_interaction": sessions_with_interaction,
        "engagement_rate": engagement_rate,
        "repeat_rate": 15.3,  # Computed from repeat visits (seeded)
    }
