"""
Aggregate customer analytics for the Retail Analyst dashboard.

Read-only by construction: every endpoint depends on dashboard_access and
none of them writes. Figures are computed from real derived visits
(customer_visits / customer_interactions, built from tracking_data) and real
transactions (purchases). Where the underlying data genuinely doesn't exist
the response says so with a zero/None rather than an estimate - most
visibly revenue, which stays empty until real POS data is loaded because
video cannot observe a payment.
"""

from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope
from app.db.session import get_db
from app.models.customer import Customer, CustomerInteraction, CustomerVisit
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.user import User
from app.models.zone import Zone
from app.schemas.customer import (
    CustomerAnalyticsSummary,
    ProductInteractionStat,
    PurchaseStat,
    VisitsOverTimePoint,
    ZoneVisitStat,
)

router = APIRouter(prefix="/customer-analytics", tags=["Customer Analytics"])


def _scoped_visits(db: Session, store_id: int | None):
    query = db.query(CustomerVisit)
    if store_id is not None:
        query = query.filter(CustomerVisit.store_id == store_id)
    return query


@router.get("/summary", response_model=CustomerAnalyticsSummary)
def summary(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    visits = _scoped_visits(db, effective_store_id).all()

    identified = [v for v in visits if v.customer_id is not None]
    total_seconds = sum(v.total_dwell_seconds for v in visits)

    # "Returning" is only answerable for identified visits: an anonymous
    # ByteTrack id cannot establish that two sessions were the same person
    # (ids restart every processing run), so counting anonymous repeats as
    # returning customers would be fabricated.
    visits_per_customer: dict[int, int] = {}
    for visit in identified:
        visits_per_customer[visit.customer_id] = visits_per_customer.get(visit.customer_id, 0) + 1
    returning = sum(1 for count in visits_per_customer.values() if count > 1)

    purchase_q = db.query(Purchase)
    if effective_store_id is not None:
        purchase_q = purchase_q.filter(Purchase.store_id == effective_store_id)
    purchases = purchase_q.all()
    revenue = sum((p.total_amount for p in purchases), Decimal(0))

    customers_q = db.query(func.count(Customer.id))
    if effective_store_id is not None:
        customers_q = customers_q.filter(Customer.store_id == effective_store_id)
    registered = int(customers_q.scalar() or 0)

    visit_ids = [v.id for v in visits]
    top_zone = top_product = None
    if visit_ids:
        zone_row = (
            db.query(CustomerInteraction.zone_id, func.count(func.distinct(CustomerInteraction.customer_visit_id)))
            .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.zone_id.isnot(None))
            .group_by(CustomerInteraction.zone_id)
            .order_by(func.count(func.distinct(CustomerInteraction.customer_visit_id)).desc())
            .first()
        )
        if zone_row:
            zone = db.get(Zone, zone_row[0])
            top_zone = zone.zone_name if zone else None

        product_row = (
            db.query(CustomerInteraction.product_id, func.count(CustomerInteraction.id))
            .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.product_id.isnot(None))
            .group_by(CustomerInteraction.product_id)
            .order_by(func.count(CustomerInteraction.id).desc())
            .first()
        )
        if product_row:
            product = db.get(Product, product_row[0])
            top_product = product.product_name if product else None

    return CustomerAnalyticsSummary(
        store_id=effective_store_id,
        total_visits=len(visits),
        identified_visits=len(identified),
        anonymous_visits=len(visits) - len(identified),
        registered_customers=registered,
        returning_customers=returning,
        average_visit_seconds=round(total_seconds / len(visits), 2) if visits else 0.0,
        total_revenue=revenue,
        average_purchase_value=(revenue / len(purchases)) if purchases else None,
        purchase_count=len(purchases),
        most_visited_zone=top_zone,
        most_interacted_product=top_product,
    )


@router.get("/visits", response_model=list[VisitsOverTimePoint])
def visits_over_time(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(
        func.date(CustomerVisit.entry_time).label("day"), func.count(CustomerVisit.id)
    )
    if effective_store_id is not None:
        query = query.filter(CustomerVisit.store_id == effective_store_id)
    rows = query.group_by("day").order_by("day").all()
    return [VisitsOverTimePoint(date=str(day), visits=int(count)) for day, count in rows]


@router.get("/zones", response_model=list[ZoneVisitStat])
def zone_stats(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Visits and average dwell per zone.

    Dwell uses MAX per (visit, zone) rather than SUM: every product in a zone
    carries that zone's dwell time, so summing would multiply the real figure
    by the number of products stocked there.
    """
    effective_store_id = resolve_store_scope(current_user, store_id)
    visit_ids = [v.id for v in _scoped_visits(db, effective_store_id).all()]
    if not visit_ids:
        return []

    per_visit_zone = (
        db.query(
            CustomerInteraction.zone_id.label("zone_id"),
            CustomerInteraction.customer_visit_id.label("visit_id"),
            func.max(CustomerInteraction.duration_seconds).label("seconds"),
        )
        .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.zone_id.isnot(None))
        .group_by(CustomerInteraction.zone_id, CustomerInteraction.customer_visit_id)
        .subquery()
    )
    rows = (
        db.query(
            per_visit_zone.c.zone_id,
            func.count(per_visit_zone.c.visit_id),
            func.avg(per_visit_zone.c.seconds),
        )
        .group_by(per_visit_zone.c.zone_id)
        .all()
    )

    zone_names = {z.id: z.zone_name for z in db.query(Zone.id, Zone.zone_name).all()}
    stats = [
        ZoneVisitStat(
            zone_id=zid,
            zone_name=zone_names.get(zid, f"Zone {zid}"),
            visits=int(visits),
            average_dwell_seconds=round(float(avg or 0), 2),
        )
        for zid, visits, avg in rows
    ]
    return sorted(stats, key=lambda s: s.visits, reverse=True)


@router.get("/products", response_model=list[ProductInteractionStat])
def product_stats(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Most-interacted products.

    "Interaction" here is zone/shelf proximity, not observed handling - this
    system has no pick-detection model. See CustomerInteraction's docstring.
    """
    effective_store_id = resolve_store_scope(current_user, store_id)
    visit_ids = [v.id for v in _scoped_visits(db, effective_store_id).all()]
    if not visit_ids:
        return []

    rows = (
        db.query(
            CustomerInteraction.product_id,
            func.count(CustomerInteraction.id),
            func.sum(CustomerInteraction.duration_seconds),
        )
        .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.product_id.isnot(None))
        .group_by(CustomerInteraction.product_id)
        .order_by(func.count(CustomerInteraction.id).desc())
        .limit(limit)
        .all()
    )
    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    return [
        ProductInteractionStat(
            product_id=pid,
            product_name=product_names.get(pid, f"Product {pid}"),
            interactions=int(count),
            total_seconds=round(float(seconds or 0), 2),
        )
        for pid, count, seconds in rows
    ]


@router.get("/purchases", response_model=list[PurchaseStat])
def purchase_stats(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Top purchased products by real revenue. Empty until POS data exists."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = (
        db.query(
            PurchaseItem.product_id,
            func.sum(PurchaseItem.quantity),
            func.sum(PurchaseItem.total_price),
        )
        .join(Purchase, Purchase.id == PurchaseItem.purchase_id)
    )
    if effective_store_id is not None:
        query = query.filter(Purchase.store_id == effective_store_id)
    rows = (
        query.group_by(PurchaseItem.product_id)
        .order_by(func.sum(PurchaseItem.total_price).desc())
        .limit(limit)
        .all()
    )
    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    return [
        PurchaseStat(
            product_id=pid,
            product_name=product_names.get(pid, f"Product {pid}"),
            quantity=int(qty or 0),
            revenue=Decimal(revenue or 0),
        )
        for pid, qty, revenue in rows
    ]
