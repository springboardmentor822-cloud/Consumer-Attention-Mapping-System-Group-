"""
Retail Analyst + Marketing Manager dashboard endpoints.

Both roles look across the whole business rather than one store, so unlike
store_manager.py these endpoints treat store_id=None as "all stores" instead
of requiring one - resolve_store_scope already returns None for that case
for any non-Store-Manager role.

Campaign ROI is deliberately not here: there's no revenue/attribution data in
this schema to compute a real return on a campaign, and the frontend keeps
that as an honest placeholder rather than this router faking a number for it.

Attractiveness scoring and recommendations (bottom of this file) WERE flagged
the same way for a while, but both are now buildable honestly on top of the
real dwell/engagement/traffic data the analytics engine produces - see
app/analytics/attractiveness.py and app/analytics/recommendations.py for what
they do and don't claim (notably: no real sales/conversion data exists here,
so neither ever uses "sales" language - only traffic, dwell, engagement, and
real stock levels).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.ai.inference import detect_products_on_latest_snapshot
from app.analytics.attractiveness import AttractivenessInput, score_shelves
from app.analytics.recommendations import generate_recommendations
from app.api.deps import dashboard_access, marketing_access, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.campaign import Campaign
from app.models.product import Product
from app.models.promotion import Promotion
from app.models.shelf import Shelf
from app.models.store import Store
from app.models.user import User
from app.models.zone import Zone
from app.schemas.campaign import CampaignSummaryResponse
from app.schemas.analytics_dashboard import (
    AttractivenessItem,
    AttractivenessResponse,
    CategorySummaryItem,
    ConversionFunnelResponse,
    FunnelStage,
    InsightItem,
    InsightsResponse,
    InventorySummaryResponse,
    JourneyFlowResponse,
    ProductAnalysisResponse,
    ProductStockItem,
    ProductVisibilityItem,
    ProductVisibilityResponse,
    RecommendationItem,
    RecommendationsResponse,
    SegmentationResponse,
    SegmentItem,
    ShelfAnalysisItem,
    ShelfAnalysisResponse,
    StoreComparisonItem,
    StoreComparisonResponse,
    ZoneTransition,
)
from app.services.tracking_repository import TrackingRepository

router = APIRouter(prefix="/dashboard", tags=["Analytics Dashboard"])

DWELL_SEGMENTS = [
    ("Quick Glance (<30s)", 0, 30),
    ("Browsing (30s-3min)", 30, 180),
    ("Engaged (3-10min)", 180, 600),
    ("Highly Engaged (10min+)", 600, None),
]

# No real sales/inventory-transaction data exists in this schema - these are
# fixed thresholds against the one thing that IS real (Product.stock_quantity),
# not fabricated numbers. Documented here the same way OCCUPANCY_ALERT_THRESHOLD
# is documented in store_manager.py.
LOW_STOCK_THRESHOLD = 10
FULL_SHELF_THRESHOLD = 15
# YOLO-World's per-frame product count on a real shelf is naturally noisy
# (see the tracking-stability finding in tracker.py - a lot of raw detections
# don't persist across frames), so this deliberately isn't "detected < DB
# count" - it's a large-shortfall ratio, tuned to survive normal detection
# noise while still catching a shelf that's actually gone empty or is mostly
# bare compared to what's on record.
RESTOCK_DETECTION_RATIO = 0.34


def _zone_ids_for_store(db: Session, store_id: int | None) -> list[int]:
    query = db.query(Zone.id)
    if store_id is not None:
        query = query.filter(Zone.store_id == store_id)
    return [z.id for z in query.all()]


def _camera_ids_for_store(db: Session, store_id: int | None) -> list[int]:
    query = db.query(Camera.id)
    if store_id is not None:
        query = query.filter(Camera.store_id == store_id)
    return [c.id for c in query.all()]


@router.get("/analyst/journey-flow", response_model=JourneyFlowResponse)
def journey_flow(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=15, le=50),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    zone_ids = _zone_ids_for_store(db, effective_store_id)
    zone_names = {z.id: z.zone_name for z in db.query(Zone).filter(Zone.id.in_(zone_ids)).all()} if zone_ids else {}

    raw = TrackingRepository(db).zone_transitions(zone_ids)
    raw.sort(key=lambda t: t[2], reverse=True)

    transitions = [
        ZoneTransition(
            from_zone_id=f,
            from_zone_name=zone_names.get(f, f"Zone {f}"),
            to_zone_id=t,
            to_zone_name=zone_names.get(t, f"Zone {t}"),
            count=c,
        )
        for f, t, c in raw[:limit]
    ]
    return JourneyFlowResponse(store_id=effective_store_id, transitions=transitions)


@router.get("/analyst/segmentation", response_model=SegmentationResponse)
def segmentation(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    camera_ids = _camera_ids_for_store(db, effective_store_id)
    engagement = TrackingRepository(db).customer_engagement(camera_ids)

    segments: list[SegmentItem] = []
    for label, lo, hi in DWELL_SEGMENTS:
        bucket = [
            e for e in engagement if e["dwell_seconds"] >= lo and (hi is None or e["dwell_seconds"] < hi)
        ]
        avg_dwell = sum(e["dwell_seconds"] for e in bucket) / len(bucket) if bucket else 0.0
        segments.append(SegmentItem(segment=label, count=len(bucket), avg_dwell_seconds=round(avg_dwell, 1)))

    total = len(engagement)
    multi_zone = sum(1 for e in engagement if e["zones_visited"] > 1)
    multi_zone_pct = round(multi_zone / total * 100, 1) if total else 0.0

    return SegmentationResponse(
        store_id=effective_store_id,
        total_customers=total,
        segments=segments,
        multi_zone_visitor_pct=multi_zone_pct,
    )


@router.get("/analyst/store-comparison", response_model=StoreComparisonResponse)
def store_comparison(
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    repo = TrackingRepository(db)
    stores = db.query(Store).all()
    items = []
    for store in stores:
        camera_ids = _camera_ids_for_store(db, store.id)
        items.append(
            StoreComparisonItem(
                store_id=store.id,
                store_name=store.store_name,
                visitors=repo.unique_customers_for_cameras(camera_ids),
                avg_dwell_seconds=round(repo.avg_dwell_seconds(camera_ids), 1),
                peak_hour=repo.peak_hour(camera_ids),
            )
        )
    items.sort(key=lambda i: i.visitors, reverse=True)
    return StoreComparisonResponse(stores=items)


@router.get("/analyst/insights", response_model=InsightsResponse)
def insights(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)
    camera_ids = _camera_ids_for_store(db, effective_store_id)
    zone_ids = _zone_ids_for_store(db, effective_store_id)

    generated: list[InsightItem] = []

    zone_counts = repo.counts_by_zone(zone_ids)
    if zone_counts:
        zone_names = {z.id: z.zone_name for z in db.query(Zone).filter(Zone.id.in_(zone_ids)).all()}
        busiest_id = max(zone_counts, key=zone_counts.get)
        generated.append(
            InsightItem(
                severity="info",
                message=f"'{zone_names.get(busiest_id, busiest_id)}' has the highest traffic: "
                f"{zone_counts[busiest_id]} unique visitors.",
            )
        )

    peak = repo.peak_hour(camera_ids)
    if peak is not None:
        generated.append(InsightItem(severity="info", message=f"Peak activity hour is {peak:02d}:00."))

    engagement = repo.customer_engagement(camera_ids)
    if engagement:
        multi_zone = sum(1 for e in engagement if e["zones_visited"] > 1)
        pct = round(multi_zone / len(engagement) * 100, 1)
        generated.append(
            InsightItem(
                severity="info" if pct < 50 else "notable",
                message=f"{pct}% of tracked customers visited more than one zone.",
            )
        )
        avg_dwell = sum(e["dwell_seconds"] for e in engagement) / len(engagement)
        generated.append(
            InsightItem(severity="info", message=f"Average customer dwell time is {avg_dwell / 60:.1f} minutes.")
        )

    if not generated:
        generated.append(InsightItem(severity="info", message="Not enough tracking data yet to generate insights."))

    return InsightsResponse(store_id=effective_store_id, insights=generated)


def _category_summary(products: list[Product]) -> list[CategorySummaryItem]:
    by_category: dict[str, list[Product]] = {}
    for p in products:
        by_category.setdefault(p.category, []).append(p)

    summary = []
    for category, items in by_category.items():
        total_stock = sum(p.stock_quantity for p in items)
        avg_price = sum(float(p.price) for p in items) / len(items)
        inventory_value = sum(float(p.price) * p.stock_quantity for p in items)
        summary.append(
            CategorySummaryItem(
                category=category,
                product_count=len(items),
                total_stock=total_stock,
                avg_price=round(avg_price, 2),
                inventory_value=round(inventory_value, 2),
            )
        )
    summary.sort(key=lambda c: c.inventory_value, reverse=True)
    return summary


def _products_for_store(db: Session, store_id: int | None) -> list[Product]:
    query = db.query(Product).join(Shelf, Product.shelf_id == Shelf.id)
    if store_id is not None:
        query = query.filter(Shelf.store_id == store_id)
    return query.all()


@router.get("/analyst/inventory-summary", response_model=InventorySummaryResponse)
def inventory_summary(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Real KPIs derived from Product.price/stock_quantity - the only
    inventory-shaped data that actually exists in this schema. There is no
    sales/POS data, so nothing here is a sales or revenue figure."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    products = _products_for_store(db, effective_store_id)

    total_inventory_items = sum(p.stock_quantity for p in products)
    inventory_value = sum(float(p.price) * p.stock_quantity for p in products)
    low_stock = sum(1 for p in products if p.stock_quantity < LOW_STOCK_THRESHOLD)

    return InventorySummaryResponse(
        store_id=effective_store_id,
        total_products=len(products),
        total_inventory_items=total_inventory_items,
        inventory_value=round(inventory_value, 2),
        low_stock_products=low_stock,
        categories=_category_summary(products),
    )


@router.get("/analyst/product-analysis", response_model=ProductAnalysisResponse)
def product_analysis(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    products = _products_for_store(db, effective_store_id)
    shelf_names = {s.id: s.shelf_name for s in db.query(Shelf).all()}

    def to_item(p: Product) -> ProductStockItem:
        return ProductStockItem(
            product_id=p.id,
            product_name=p.product_name,
            sku=p.sku,
            category=p.category,
            stock_quantity=p.stock_quantity,
            price=float(p.price),
            shelf_name=shelf_names.get(p.shelf_id, f"Shelf {p.shelf_id}"),
        )

    by_stock_desc = sorted(products, key=lambda p: p.stock_quantity, reverse=True)
    by_stock_asc = sorted(products, key=lambda p: p.stock_quantity)
    to_restock = [p for p in by_stock_asc if p.stock_quantity < LOW_STOCK_THRESHOLD]

    return ProductAnalysisResponse(
        store_id=effective_store_id,
        highest_stock=[to_item(p) for p in by_stock_desc[:limit]],
        lowest_stock=[to_item(p) for p in by_stock_asc[:limit]],
        to_restock=[to_item(p) for p in to_restock[:limit]],
        categories=_category_summary(products),
    )


@router.get("/analyst/shelf-analysis", response_model=ShelfAnalysisResponse)
def shelf_analysis(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)

    query = db.query(Shelf).join(Store, Shelf.store_id == Store.id)
    if effective_store_id is not None:
        query = query.filter(Shelf.store_id == effective_store_id)
    shelves = query.all()
    store_names = {s.id: s.store_name for s in db.query(Store).all()}
    product_counts: dict[int, int] = {}
    for p in db.query(Product).all():
        product_counts[p.shelf_id] = product_counts.get(p.shelf_id, 0) + 1

    items = []
    for shelf in shelves:
        product_count = product_counts.get(shelf.id, 0)
        visit_count = repo.unique_customers_for_cameras([shelf.camera_id]) if shelf.camera_id else 0
        status = "Empty" if product_count == 0 else "Full" if product_count >= FULL_SHELF_THRESHOLD else "Normal"

        # Real cross-check: re-run detection on this shelf camera's latest
        # processed (raw, unannotated) snapshot and compare against the DB's
        # expected stock count. A real, large shortfall - not the DB record
        # count alone - is what actually flags restocking, since the DB
        # count only says what SHOULD be there, not what a camera currently
        # sees. Skipped (None) if the camera has never been processed yet.
        detected_product_count = (
            detect_products_on_latest_snapshot(shelf.camera_id) if shelf.camera_id else None
        )
        restocking_needed = (
            detected_product_count is not None
            and product_count > 0
            and detected_product_count < product_count * RESTOCK_DETECTION_RATIO
        )

        items.append(
            ShelfAnalysisItem(
                shelf_id=shelf.id,
                shelf_name=shelf.shelf_name,
                store_name=store_names.get(shelf.store_id, f"Store {shelf.store_id}"),
                zone=shelf.zone,
                product_count=product_count,
                visit_count=visit_count,
                status=status,
                detected_product_count=detected_product_count,
                restocking_needed=restocking_needed,
            )
        )

    ranked_by_visits = sorted(items, key=lambda i: i.visit_count, reverse=True)
    most_visited = ranked_by_visits[0] if ranked_by_visits else None
    least_visited = ranked_by_visits[-1] if ranked_by_visits else None

    return ShelfAnalysisResponse(
        store_id=effective_store_id,
        shelves=items,
        most_visited=most_visited,
        least_visited=least_visited,
        empty_count=sum(1 for i in items if i.status == "Empty"),
        full_count=sum(1 for i in items if i.status == "Full"),
    )


def _attractiveness_inputs(db: Session, repo: TrackingRepository, store_id: int | None) -> list[AttractivenessInput]:
    """Shared shelf-level data gathering for both /attractiveness and
    /recommendations - one real dataset feeding two different views of it."""
    query = db.query(Shelf).join(Store, Shelf.store_id == Store.id)
    if store_id is not None:
        query = query.filter(Shelf.store_id == store_id)
    shelves = [s for s in query.all() if s.camera_id is not None]
    if not shelves:
        return []

    store_names = {s.id: s.store_name for s in db.query(Store).all()}
    product_counts: dict[int, int] = {}
    low_stock_counts: dict[int, int] = {}
    for p in db.query(Product).all():
        product_counts[p.shelf_id] = product_counts.get(p.shelf_id, 0) + 1
        if p.stock_quantity < LOW_STOCK_THRESHOLD:
            low_stock_counts[p.shelf_id] = low_stock_counts.get(p.shelf_id, 0) + 1

    camera_ids = [s.camera_id for s in shelves]
    behavior = repo.shelf_behavior_metrics(camera_ids)

    inputs: list[AttractivenessInput] = []
    for shelf in shelves:
        metrics = behavior.get(shelf.camera_id)
        product_count = product_counts.get(shelf.id, 0)
        stockout_ratio = (low_stock_counts.get(shelf.id, 0) / product_count) if product_count > 0 else 0.0
        # Traffic is unique visitors, not behavior.visit_count (segmented
        # Visit count - one customer can produce several short visits if
        # they drift in and out of frame). Shelf Analysis and Product
        # Visibility both already show unique-visitor counts as "traffic" -
        # using segmented visit count here instead produced a real, visible
        # contradiction: Grocery Shelf (36 unique visitors) ranked BELOW
        # Snacks Shelf (35 unique visitors, but 88 segmented visits) on this
        # same page's traffic signal.
        traffic = repo.unique_customers_for_cameras([shelf.camera_id])
        inputs.append(
            AttractivenessInput(
                shelf_id=shelf.id,
                shelf_name=shelf.shelf_name,
                store_name=store_names.get(shelf.store_id, f"Store {shelf.store_id}"),
                zone=shelf.zone,
                traffic=traffic,
                dwell_seconds=metrics["avg_dwell_seconds"] if metrics else 0.0,
                engagement_score=metrics["avg_engagement_score"] if metrics else 0.0,
                stockout_ratio=stockout_ratio,
                has_behavior_data=metrics is not None,
            )
        )
    return inputs


@router.get("/attractiveness", response_model=AttractivenessResponse)
def attractiveness(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)
    inputs = _attractiveness_inputs(db, repo, effective_store_id)
    results = score_shelves(inputs)

    return AttractivenessResponse(
        store_id=effective_store_id,
        shelves=[
            AttractivenessItem(
                shelf_id=r.shelf_id,
                shelf_name=r.shelf_name,
                store_name=r.store_name,
                zone=r.zone,
                score=r.score,
                traffic_score=r.traffic_score,
                dwell_score=r.dwell_score,
                interaction_score=r.interaction_score,
                stockout_penalty=r.stockout_penalty,
                rank=r.rank,
                has_behavior_data=r.has_behavior_data,
            )
            for r in results
        ],
    )


@router.get("/recommendations", response_model=RecommendationsResponse)
def recommendations(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)
    inputs = _attractiveness_inputs(db, repo, effective_store_id)
    generated = generate_recommendations(inputs)

    return RecommendationsResponse(
        store_id=effective_store_id,
        recommendations=[
            RecommendationItem(
                severity=r.severity,
                shelf_id=r.shelf_id,
                shelf_name=r.shelf_name,
                zone=r.zone,
                issue=r.issue,
                action=r.action,
            )
            for r in generated
        ],
        shelves_considered=sum(1 for i in inputs if i.has_behavior_data),
    )


@router.get("/marketing/product-visibility", response_model=ProductVisibilityResponse)
def product_visibility(
    store_id: int | None = Query(default=None),
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Same shelf-engagement proxy as the Store Manager dashboard
    (unique-customer dwell near a shelf's camera), generalized across
    stores instead of scoped to one."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)

    query = db.query(Shelf, Store.store_name).join(Store, Shelf.store_id == Store.id)
    if effective_store_id is not None:
        query = query.filter(Shelf.store_id == effective_store_id)
    rows = query.all()

    items = [
        ProductVisibilityItem(
            shelf_id=shelf.id,
            shelf_name=shelf.shelf_name,
            store_name=store_name,
            zone=shelf.zone,
            visibility_score=repo.unique_customers_for_cameras([shelf.camera_id]) if shelf.camera_id else 0,
        )
        for shelf, store_name in rows
    ]
    items.sort(key=lambda i: i.visibility_score, reverse=True)
    return ProductVisibilityResponse(shelves=items[:limit])


@router.get("/marketing/conversion-funnel", response_model=ConversionFunnelResponse)
def conversion_funnel(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Same checkout-zone proximity proxy as the Store Manager dashboard's
    conversion_rate, expressed as a 2-stage funnel and generalized across
    stores."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    repo = TrackingRepository(db)
    camera_ids = _camera_ids_for_store(db, effective_store_id)

    total_visitors = repo.unique_customers_for_cameras(camera_ids)

    checkout_zone_query = db.query(Zone.id).filter(Zone.zone_name.ilike("%checkout%"))
    if effective_store_id is not None:
        checkout_zone_query = checkout_zone_query.filter(Zone.store_id == effective_store_id)
    checkout_zone_ids = [z.id for z in checkout_zone_query.all()]

    checkout_visitors = repo.unique_customers_for_zones(checkout_zone_ids) if checkout_zone_ids else 0

    conversion_rate = round(checkout_visitors / total_visitors, 4) if total_visitors else None

    return ConversionFunnelResponse(
        store_id=effective_store_id,
        stages=[
            FunnelStage(stage="Total Visitors", count=total_visitors),
            FunnelStage(stage="Reached Checkout Zone", count=checkout_visitors),
        ],
        conversion_rate=conversion_rate,
    )


@router.get("/marketing/campaign-summary", response_model=CampaignSummaryResponse)
def campaign_summary(
    current_user: User = Depends(marketing_access),
    db: Session = Depends(get_db),
):
    """Real counts from the campaigns/promotions tables, plus a genuine
    attention-time figure from tracking data. No revenue/ROI/conversion here -
    those need real sales data that doesn't exist in this schema."""
    campaigns = db.query(Campaign).all()
    promotions = db.query(Promotion).all()
    all_camera_ids = [c.id for c in db.query(Camera.id).all()]

    return CampaignSummaryResponse(
        total_campaigns=len(campaigns),
        active_campaigns=sum(1 for c in campaigns if c.status == "Active"),
        completed_campaigns=sum(1 for c in campaigns if c.status == "Completed"),
        draft_campaigns=sum(1 for c in campaigns if c.status == "Draft"),
        total_budget=round(sum(float(c.budget) for c in campaigns), 2),
        total_promotions=len(promotions),
        active_promotions=sum(1 for p in promotions if p.status == "Active"),
        avg_attention_seconds=round(TrackingRepository(db).avg_dwell_seconds(all_camera_ids), 1),
    )
