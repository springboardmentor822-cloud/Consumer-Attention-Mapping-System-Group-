"""
Milestone 3 behavioural intelligence: shopper segmentation and the weighted
Product Attractiveness Score.

Deliberately a NEW router rather than edits to analytics_dashboard.py. The
existing /dashboard/analyst/segmentation endpoint returns dwell-time buckets
("Quick Glance", "Browsing", ...) that the Analyst dashboard already renders;
changing its shape in place would have broken that panel. These are added
under /behavior/* so both coexist and nothing that currently works changes.

Read-only by construction: every endpoint depends on dashboard_access and
none of them writes, so a Retail Analyst can read all of it and modify none
of it, enforced by the same dependency every other router uses.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.analytics.dwell_time import segment_all_sessions
from app.analytics.product_attractiveness import (
    COMPONENT_AVAILABILITY,
    WEIGHTS,
    ProductSignals,
    score_products,
)
from app.analytics.segmentation import METHOD, classify, describe_visit, summarize
from app.api.deps import dashboard_access, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.customer import CustomerInteraction, CustomerVisit
from app.models.product import Product
from app.models.purchase import PurchaseItem
from app.models.shelf import Shelf
from app.models.tracking_data import TrackingData
from app.models.user import User
from app.models.zone import Zone
from app.schemas.behavior_intelligence import (
    AttractivenessComponentInfo,
    ProductAttractivenessResponse,
    ProductScoreItem,
    SegmentAssignmentItem,
    SegmentationBreakdown,
    SegmentSummaryItem,
)

router = APIRouter(prefix="/behavior", tags=["Behavior Intelligence"])

# Cap on tracking rows pulled per request. Segmentation is O(points) and runs
# synchronously; without a bound a large date range would tie up a worker.
MAX_TRACKING_ROWS = 40000


def _window_start(days: int | None) -> datetime | None:
    if days is None:
        return None
    return datetime.now(timezone.utc) - timedelta(days=days)


@router.get("/segments", response_model=SegmentationBreakdown)
def shopper_segments(
    store_id: int | None = Query(default=None),
    days: int | None = Query(default=None, ge=1, le=365, description="Look-back window; omit for all data"),
    include_assignments: bool = Query(default=False, description="Return per-visit detail as well as totals"),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Classify visit sessions into the five Milestone 3 shopper segments.

    RULE-BASED, not machine-learned - there is no labelled ground truth in
    this project to train or validate a classifier against, so the response
    carries method="rule_based" and each assignment includes the exact
    measurements that triggered it. See app/analytics/segmentation.py.

    A segment describes ONE VISIT, not a person over time: ByteTrack ids
    restart every processing run, so the same shopper is not recognised
    across days.
    """
    effective_store_id = resolve_store_scope(current_user, store_id)

    camera_q = db.query(Camera.id)
    if effective_store_id is not None:
        camera_q = camera_q.filter(Camera.store_id == effective_store_id)
    camera_ids = [c.id for c in camera_q.all()]
    if not camera_ids:
        return SegmentationBreakdown(
            store_id=effective_store_id, method=METHOD, total_visits=0, classified_visits=0, segments=[], assignments=[]
        )

    tracking_q = db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
    since = _window_start(days)
    if since is not None:
        tracking_q = tracking_q.filter(TrackingData.timestamp >= since)
    rows = tracking_q.order_by(TrackingData.timestamp.asc()).limit(MAX_TRACKING_ROWS).all()
    if not rows:
        return SegmentationBreakdown(
            store_id=effective_store_id, method=METHOD, total_visits=0, classified_visits=0, segments=[], assignments=[]
        )

    zone_names = {z.id: z.zone_name for z in db.query(Zone.id, Zone.zone_name).all()}
    sessions = segment_all_sessions(rows)
    assignments = [classify(describe_visit(s, zone_names)) for s in sessions]
    summaries = summarize(assignments)

    return SegmentationBreakdown(
        store_id=effective_store_id,
        method=METHOD,
        total_visits=len(assignments),
        classified_visits=sum(1 for a in assignments if a.segment != "Unclassified"),
        segments=[
            SegmentSummaryItem(
                segment=s.segment,
                count=s.count,
                share=s.share,
                average_dwell_seconds=s.average_dwell_seconds,
                average_zones=s.average_zones,
                examples=s.examples,
            )
            for s in summaries
        ],
        assignments=(
            [
                SegmentAssignmentItem(
                    tracking_id=a.tracking_id,
                    segment=a.segment,
                    reason=a.reason,
                    distinct_zones=a.behaviour.distinct_zones,
                    zone_revisits=a.behaviour.zone_revisits,
                    total_seconds=a.behaviour.total_seconds,
                    interaction_count=a.behaviour.interaction_count,
                    promo_dwell_share=a.behaviour.promo_dwell_share,
                    dominant_zone=a.behaviour.dominant_zone,
                )
                for a in assignments[:200]
            ]
            if include_assignments
            else []
        ),
    )


@router.get("/product-attractiveness", response_model=ProductAttractivenessResponse)
def product_attractiveness(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Weighted Product Attractiveness Score (Milestone 3 formula).

    0.35 attention + 0.25 interaction + 0.20 pickup + 0.15 conversion
    + 0.05 repeat engagement, each min-max normalized across the scored set
    before weighting, reported 0-100.

    Two components are not directly measurable here and are flagged rather
    than faked: pickup rate is a proximity PROXY (no pick-detection model
    exists) and purchase conversion is PARTIAL (purchases exist only for
    registered customers). Per-component availability is in the response.
    """
    effective_store_id = resolve_store_scope(current_user, store_id)

    product_q = db.query(Product, Shelf).join(Shelf, Shelf.id == Product.shelf_id)
    if effective_store_id is not None:
        product_q = product_q.filter(Shelf.store_id == effective_store_id)
    product_rows = product_q.all()
    if not product_rows:
        return ProductAttractivenessResponse(
            store_id=effective_store_id, method="weighted_formula", products=[], components=[], note="No products found."
        )

    # Interaction/attention per product, from real derived interactions.
    interaction_rows = (
        db.query(
            CustomerInteraction.product_id,
            func.count(CustomerInteraction.id),
            func.sum(CustomerInteraction.duration_seconds),
            func.count(func.distinct(CustomerInteraction.customer_visit_id)),
        )
        .filter(CustomerInteraction.product_id.isnot(None))
        .group_by(CustomerInteraction.product_id)
        .all()
    )
    interactions = {
        pid: {"count": int(count), "seconds": float(seconds or 0), "visits": int(visits)}
        for pid, count, seconds, visits in interaction_rows
    }

    # Repeat engagement: interactions belonging to visits that touched the
    # product's zone more than once during that visit.
    repeat_rows = (
        db.query(CustomerInteraction.product_id, func.count(CustomerInteraction.id))
        .join(CustomerVisit, CustomerVisit.id == CustomerInteraction.customer_visit_id)
        .filter(CustomerInteraction.product_id.isnot(None), CustomerVisit.total_zones_visited > 1)
        .group_by(CustomerInteraction.product_id)
        .all()
    )
    repeats = {pid: int(count) for pid, count in repeat_rows}

    # Real purchased quantities, from purchase_items.
    purchase_rows = (
        db.query(PurchaseItem.product_id, func.sum(PurchaseItem.quantity))
        .filter(PurchaseItem.product_id.isnot(None))
        .group_by(PurchaseItem.product_id)
        .all()
    )
    purchases = {pid: int(qty or 0) for pid, qty in purchase_rows}

    zone_by_name = {z.zone_name.strip().lower(): z.zone_name for z in db.query(Zone).all()}

    signals = []
    for product, shelf in product_rows:
        stats = interactions.get(product.id, {"count": 0, "seconds": 0.0, "visits": 0})
        signals.append(
            ProductSignals(
                product_id=product.id,
                product_name=product.product_name,
                category=product.category,
                zone_name=zone_by_name.get((shelf.zone or "").strip().lower(), shelf.zone),
                attention_seconds=stats["seconds"],
                interaction_count=stats["count"],
                visit_count=stats["visits"],
                purchase_quantity=purchases.get(product.id, 0),
                repeat_interaction_count=repeats.get(product.id, 0),
                has_any_purchase=product.id in purchases,
            )
        )

    scored = score_products(signals)

    return ProductAttractivenessResponse(
        store_id=effective_store_id,
        method="weighted_formula",
        note=(
            "Scores are min-max normalized within this product set, so they rank products "
            "against each other rather than on an absolute scale. Pickup rate is a proximity "
            "proxy (no pick-detection model exists) and purchase conversion is partial "
            "(purchases exist only for registered customers)."
        ),
        components=[
            AttractivenessComponentInfo(name=name, weight=weight, availability=COMPONENT_AVAILABILITY[name])
            for name, weight in WEIGHTS.items()
        ],
        products=[
            ProductScoreItem(
                product_id=p.product_id,
                product_name=p.product_name,
                category=p.category,
                zone_name=p.zone_name,
                score=p.score,
                shelf_visibility_score=p.shelf_visibility_score,
                product_engagement_score=p.product_engagement_score,
                conversion_potential_score=p.conversion_potential_score,
                marketing_effectiveness_score=p.marketing_effectiveness_score,
                data_complete=p.data_complete,
                components={c.name: c.normalized for c in p.components},
            )
            for p in scored
        ],
    )
