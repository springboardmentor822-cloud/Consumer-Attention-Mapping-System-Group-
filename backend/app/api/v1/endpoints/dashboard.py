import datetime as dt

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.enums import InteractionTypeEnum
from app.models.interaction import ProductInteraction
from app.models.product import Product
from app.models.session import ShopperSession
from app.models.store import StoreZone
from app.models.user import User

router = APIRouter()


@router.get("/summary")
def store_summary(
    store_id: int,
    period_start: dt.datetime = Query(...),
    period_end: dt.datetime = Query(...),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ShopperSession)
        .filter(
            ShopperSession.store_id == store_id,
            ShopperSession.entry_time >= period_start,
            ShopperSession.entry_time <= period_end,
        )
        .all()
    )

    total_visitors = len(sessions)
    completed = [s for s in sessions if s.total_duration_seconds is not None]
    avg_dwell_time = (
        sum(s.total_duration_seconds for s in completed) / len(completed) if completed else 0.0
    )

    purchases = (
        db.query(func.count(ProductInteraction.id))
        .join(ProductInteraction.session)
        .filter(
            ShopperSession.store_id == store_id,
            ProductInteraction.interaction_type == InteractionTypeEnum.PURCHASED,
            ProductInteraction.timestamp >= period_start,
            ProductInteraction.timestamp <= period_end,
        )
        .scalar()
    )
    conversion_rate = (purchases / total_visitors * 100) if total_visitors else 0.0

    # Peak hour: bucket entry_time by hour-of-day
    hour_counts: dict[int, int] = {}
    for s in sessions:
        hour = s.entry_time.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    peak_hour = max(hour_counts, key=hour_counts.get) if hour_counts else None

    # Zone frequency - counts every zone a shopper passed through (not just
    # their entry zone), so "popular zone" reflects where people actually
    # spend time, not just where they walked in.
    zone_counts: dict[int, int] = {}
    for s in sessions:
        if s.entry_zone_id:
            zone_counts[s.entry_zone_id] = zone_counts.get(s.entry_zone_id, 0) + 1

    popular_zone_id: int | None = None
    popular_zone_name: str | None = None
    if zone_counts:
        popular_zone_id = max(zone_counts, key=zone_counts.get)
        zone = db.query(StoreZone).filter(StoreZone.id == popular_zone_id).first()
        popular_zone_name = zone.name if zone else None

    # Avg walking distance: mean of each session's total tracked path
    # length (total_distance_m, computed by journey_service on session
    # close). Sessions without tracking data (or still in-progress) are
    # excluded rather than counted as 0m.
    distances = [s.total_distance_m for s in sessions if s.total_distance_m is not None]
    avg_walking_distance_m = sum(distances) / len(distances) if distances else 0.0

    return {
        "store_id": store_id,
        "period_start": period_start,
        "period_end": period_end,
        "total_visitors": total_visitors,
        "average_dwell_time_seconds": round(avg_dwell_time, 2),
        "total_purchases": purchases or 0,
        "conversion_rate_percent": round(conversion_rate, 2),
        "peak_hour": peak_hour,
        "frequent_entry_zones": zone_counts,
        "average_walking_distance_m": round(avg_walking_distance_m, 2),
        "popular_zone_id": popular_zone_id,
        "popular_zone_name": popular_zone_name,
    }


@router.get("/product-ranking")
def product_ranking(
    store_id: int,
    period_start: dt.datetime = Query(...),
    period_end: dt.datetime = Query(...),
    limit: int = 20,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    results = (
        db.query(
            Product.id,
            Product.name,
            func.count(ProductInteraction.id).label("interaction_count"),
        )
        .join(ProductInteraction, ProductInteraction.product_id == Product.id)
        .join(ShopperSession, ProductInteraction.session_id == ShopperSession.id)
        .filter(
            ShopperSession.store_id == store_id,
            ProductInteraction.timestamp >= period_start,
            ProductInteraction.timestamp <= period_end,
        )
        .group_by(Product.id, Product.name)
        .order_by(func.count(ProductInteraction.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {"product_id": r.id, "product_name": r.name, "interaction_count": r.interaction_count}
        for r in results
    ]
