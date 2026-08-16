"""
Consumer Behaviour Intelligence: classifies a completed shopper session
into one of the spec's five customer segments, using transparent,
auditable rules over the session's own interaction/attention data —
consistent with the rest of this codebase's approach to recommendations
and notifications (rules you can explain to a retail team, not a
black-box model).

Classification is priority-ordered (first matching rule wins), because
the categories aren't mutually exclusive in raw feature space - a fast,
single-product purchase is unambiguously a Quick Buyer even though it
also technically has zero comparisons (which alone might suggest
"nothing interesting to say"). The order below is deliberate:

  1. Quick Buyer       - short visit, purchased, minimal browsing
  2. Impulse Buyer      - purchased without comparing alternatives first
  3. Brand Loyal        - every purchase in the session is the same brand
  4. Comparison Shopper  - explicitly compared products, or picked up
                            several before buying (or not buying at all)
  5. Explorer            - covered a lot of ground, spent real time,
                            didn't necessarily buy
  6. Unclassified        - none of the above confidently applies (e.g.
                            a session with almost no signal)

Thresholds are reasonable defaults, not fitted to real data (this
codebase has no real customer data to fit against) - treat them as
starting points a retail analyst should tune per store.
"""
from __future__ import annotations

import datetime as dt
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.enums import CustomerSegmentEnum, InteractionTypeEnum
from app.models.interaction import ProductInteraction
from app.models.product import Product
from app.models.session import ShopperSession

QUICK_BUYER_MAX_DURATION_SECONDS = 180
QUICK_BUYER_MAX_INTERACTIONS = 3
QUICK_BUYER_MIN_VELOCITY_MPS = 0.5  # a "direct path" shopper doesn't dawdle

EXPLORER_MIN_ZONES = 3
EXPLORER_MIN_DURATION_SECONDS = 300
EXPLORER_MIN_DISTANCE_METERS = 40.0
EXPLORER_MAX_PICKUP_RATE = 0.3  # "low pickup frequency" relative to interactions

COMPARISON_MIN_DISTINCT_PRODUCTS = 3


@dataclass
class SessionFeatures:
    duration_seconds: float
    zones_visited: int
    total_interactions: int
    distinct_products_interacted: int
    purchase_count: int
    compared_count: int
    purchased_brands: set[str]
    pickup_count: int = 0
    total_distance_m: float = 0.0
    avg_velocity_mps: float = 0.0


def _extract_features(db: Session, session: ShopperSession) -> SessionFeatures:
    interactions = (
        db.query(ProductInteraction).filter(ProductInteraction.session_id == session.id).all()
    )

    distinct_products = {i.product_id for i in interactions}
    purchases = [i for i in interactions if i.interaction_type == InteractionTypeEnum.PURCHASED]
    compared = [i for i in interactions if i.interaction_type == InteractionTypeEnum.COMPARED]
    picked_up = [i for i in interactions if i.interaction_type == InteractionTypeEnum.PICKED_UP]

    purchased_product_ids = {i.product_id for i in purchases}
    brands: set[str] = set()
    if purchased_product_ids:
        products = db.query(Product).filter(Product.id.in_(purchased_product_ids)).all()
        brands = {p.brand for p in products if p.brand}

    duration = session.total_duration_seconds
    if duration is None:
        if session.exit_time and session.entry_time:
            duration = (session.exit_time - session.entry_time).total_seconds()
        else:
            duration = 0.0

    return SessionFeatures(
        duration_seconds=duration,
        zones_visited=session.zones_visited_count or 0,
        total_interactions=len(interactions),
        distinct_products_interacted=len(distinct_products),
        purchase_count=len(purchases),
        compared_count=len(compared),
        pickup_count=len(picked_up),
        purchased_brands=brands,
        total_distance_m=session.total_distance_m or 0.0,
        avg_velocity_mps=session.avg_velocity_mps or 0.0,
    )


def classify_session_features(f: SessionFeatures) -> CustomerSegmentEnum:
    if (
        f.purchase_count > 0
        and f.duration_seconds <= QUICK_BUYER_MAX_DURATION_SECONDS
        and f.total_interactions <= QUICK_BUYER_MAX_INTERACTIONS
    ):
        return CustomerSegmentEnum.QUICK_BUYER

    # Corroborating signal even outside the tight time/interaction window:
    # a session covering little ground quickly, that still converts, reads
    # as "direct path to a single zone, immediate pickup and checkout".
    if (
        f.purchase_count > 0
        and f.avg_velocity_mps >= QUICK_BUYER_MIN_VELOCITY_MPS
        and f.zones_visited <= 1
    ):
        return CustomerSegmentEnum.QUICK_BUYER

    if f.purchase_count > 0 and f.compared_count == 0 and f.distinct_products_interacted <= 2:
        return CustomerSegmentEnum.IMPULSE_BUYER

    if f.purchase_count >= 2 and len(f.purchased_brands) == 1:
        return CustomerSegmentEnum.BRAND_LOYAL

    if f.compared_count > 0 or f.distinct_products_interacted >= COMPARISON_MIN_DISTINCT_PRODUCTS:
        return CustomerSegmentEnum.COMPARISON_SHOPPER

    pickup_rate = (f.pickup_count / f.total_interactions) if f.total_interactions else 0.0
    if (
        f.zones_visited >= EXPLORER_MIN_ZONES
        and f.duration_seconds >= EXPLORER_MIN_DURATION_SECONDS
        and pickup_rate <= EXPLORER_MAX_PICKUP_RATE
    ):
        return CustomerSegmentEnum.EXPLORER

    # High ground covered even without hitting the zone-count threshold
    # (e.g. one very large zone) still reads as an Explorer.
    if f.total_distance_m >= EXPLORER_MIN_DISTANCE_METERS and f.duration_seconds >= EXPLORER_MIN_DURATION_SECONDS:
        return CustomerSegmentEnum.EXPLORER

    return CustomerSegmentEnum.UNCLASSIFIED


def classify_session(db: Session, session: ShopperSession) -> CustomerSegmentEnum:
    features = _extract_features(db, session)
    return classify_session_features(features)


def classify_sessions_for_store(
    db: Session, store_id: int, only_completed: bool = True
) -> list[ShopperSession]:
    query = db.query(ShopperSession).filter(ShopperSession.store_id == store_id)
    if only_completed:
        query = query.filter(ShopperSession.exit_time.isnot(None))

    sessions = query.all()
    for session in sessions:
        session.segment = classify_session(db, session)
    db.commit()
    for session in sessions:
        db.refresh(session)
    return sessions
