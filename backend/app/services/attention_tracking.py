"""
Product-level attention/dwell tracking - shared by both tracking producers.

What existed before this module: TrackingData/zone dwell only (how long a
shopper was in "Zone B - Main Aisle" as a whole). AttentionEvent already had
the right shape for *product*-level dwell (shelf_id, product_id, duration_
seconds - see models/attention.py) and scoring_service.py/recommendation_
service.py already consume it, but nothing ever created a row: neither
producer looked at shelves at all, so every score came out zero and the
"Compute scores + recommendations" button never had real signal to work with.

This module is the missing link, and it's deliberately producer-agnostic:
while a tracked person (simulated OR a real YOLOv8+ByteTrack detection) is in
the aisle zone, treat whichever *placed* shelf they're closest to (within
SHELF_ATTENTION_RADIUS_M) as the one they're looking at, and time it. Long
enough dwell has a chance of becoming a pickup, and a pickup has a chance of
becoming a purchase - feeding all five components of the attractiveness
score (attention, interaction frequency, pickup rate, conversion rate,
repeat engagement), not just attention.

tracking_simulator.py and detection_pipeline.py both call into this with
their own per-track state; the dwell/pickup/purchase logic itself is
identical either way; only *where the (x, y) came from* differs (a random
walk vs. a real detected bounding box).
"""
from __future__ import annotations

import datetime as dt
import json
import logging
import math
import random
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.attention import AttentionEvent
from app.models.enums import InteractionTypeEnum
from app.models.interaction import ProductInteraction
from app.models.product import Product
from app.models.shelf import Shelf

logger = logging.getLogger("attention_tracking")

SHELF_ATTENTION_RADIUS_M = 1.6
MIN_ATTENTION_SECONDS = 1.5
PICKUP_CHANCE_PER_SECOND = 0.045  # long dwell -> meaningfully higher pickup odds
PURCHASE_CHANCE_AFTER_PICKUP = 0.4


@dataclass
class AttentionState:
    """Per-tracked-person attention state. One of these lives alongside
    each simulated shopper or each real ByteTrack ID for the lifetime of
    their session."""
    session_id: int
    attending_shelf_id: int | None = None
    attending_product_id: int | None = None
    attention_start: dt.datetime | None = None
    attention_camera_id: int | None = None


def _shelf_centroid(shelf: Shelf) -> tuple[float, float] | None:
    """Mirrors the frontend's centroid() over the same rectangle polygon
    Store Layout saves to position_coordinates, so "what the shopper is
    near" always agrees with where the shelf visually sits on the floor
    plan."""
    if not shelf.position_coordinates:
        return None
    try:
        points = json.loads(shelf.position_coordinates)
        if not isinstance(points, list) or len(points) < 3:
            return None
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return (sum(xs) / len(xs), sum(ys) / len(ys))
    except (ValueError, TypeError, IndexError):
        return None


def load_shelf_targets(db: Session, store_id: int) -> list[dict]:
    """Placed shelves for a store, with their floor centroid and the ids of
    products stocked on them - only shelves a manager has actually
    positioned on Store Layout count, since an unplaced shelf has no real
    (x, y) a shopper could be "near"."""
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    targets = []
    for shelf in shelves:
        centroid = _shelf_centroid(shelf)
        if centroid is None:
            continue
        product_ids = [row[0] for row in db.query(Product.id).filter(Product.shelf_id == shelf.id).all()]
        targets.append({"shelf_id": shelf.id, "cx": centroid[0], "cy": centroid[1], "product_ids": product_ids})
    return targets


def _nearest_shelf(fx: float, fy: float, targets: list[dict]) -> dict | None:
    best = None
    best_dist = SHELF_ATTENTION_RADIUS_M
    for t in targets:
        dist = math.hypot(fx - t["cx"], fy - t["cy"])
        if dist <= best_dist:
            best = t
            best_dist = dist
    return best


def close_attention(db: Session, state: AttentionState, end_time: dt.datetime) -> None:
    """Persists the attention window a tracked person was just in (if it
    was long enough to count as a real look, not a passing glance), then
    clears their attention state either way."""
    if state.attending_shelf_id is None or state.attention_start is None:
        state.attending_shelf_id = None
        state.attending_product_id = None
        state.attention_start = None
        return

    duration = (end_time - state.attention_start).total_seconds()
    if duration < MIN_ATTENTION_SECONDS:
        state.attending_shelf_id = None
        state.attending_product_id = None
        state.attention_start = None
        return

    try:
        repeat_count = 0
        if state.attending_product_id is not None:
            repeat_count = (
                db.query(AttentionEvent)
                .filter(
                    AttentionEvent.session_id == state.session_id,
                    AttentionEvent.product_id == state.attending_product_id,
                )
                .count()
            )

        event = AttentionEvent(
            session_id=state.session_id,
            shelf_id=state.attending_shelf_id,
            product_id=state.attending_product_id,
            camera_id=state.attention_camera_id,
            start_time=state.attention_start,
            end_time=end_time,
            duration_seconds=round(duration, 1),
            is_repeat_attention=repeat_count,
        )
        db.add(event)
        db.flush()  # need event.id for the interaction FK below

        if state.attending_product_id is not None:
            db.add(
                ProductInteraction(
                    session_id=state.session_id,
                    product_id=state.attending_product_id,
                    attention_event_id=event.id,
                    interaction_type=InteractionTypeEnum.VIEWED,
                    timestamp=end_time,
                )
            )

            # Longer dwell -> higher odds a look turns into a pickup, and a
            # pickup has its own odds of becoming a purchase - this is what
            # feeds the pickup_rate/conversion_rate score components
            # (scoring_service.py), not just attention_duration. For real
            # detections this is still a modeled estimate, not a genuine
            # pickup detection - the pipeline has no hand/product-removal
            # signal to observe directly (see module docstring in
            # detection_pipeline.py for what's real vs. approximated).
            pickup_chance = min(0.75, duration * PICKUP_CHANCE_PER_SECOND)
            if random.random() < pickup_chance:
                pickup_time = end_time + dt.timedelta(seconds=1)
                db.add(
                    ProductInteraction(
                        session_id=state.session_id,
                        product_id=state.attending_product_id,
                        attention_event_id=event.id,
                        interaction_type=InteractionTypeEnum.PICKED_UP,
                        timestamp=pickup_time,
                    )
                )
                if random.random() < PURCHASE_CHANCE_AFTER_PICKUP:
                    db.add(
                        ProductInteraction(
                            session_id=state.session_id,
                            product_id=state.attending_product_id,
                            attention_event_id=event.id,
                            interaction_type=InteractionTypeEnum.PURCHASED,
                            timestamp=pickup_time + dt.timedelta(seconds=2),
                        )
                    )
        db.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to persist attention event for session %d", state.session_id)
        db.rollback()
    finally:
        state.attending_shelf_id = None
        state.attending_product_id = None
        state.attention_start = None
        state.attention_camera_id = None


def update_attention(
    db: Session, state: AttentionState, shelf_targets: list[dict], fx: float, fy: float,
    camera_id: int | None, now: dt.datetime, in_aisle_zone: bool,
) -> None:
    """Called once per tick/frame per tracked person. Figures out which
    shelf (if any) they're currently near and opens/closes attention
    windows as that changes - the product-level analogue of zone dwell,
    but keyed on physical proximity to a *placed* shelf rather than which
    zone band the person is in."""
    nearby = _nearest_shelf(fx, fy, shelf_targets) if in_aisle_zone else None
    nearby_shelf_id = nearby["shelf_id"] if nearby else None

    if nearby_shelf_id == state.attending_shelf_id:
        return  # still looking at the same thing (or still looking at nothing)

    # Shelf changed (including to/from None) - close out whatever window was
    # open, then start a new one if they're now near a shelf.
    close_attention(db, state, now)
    if nearby is not None:
        state.attending_shelf_id = nearby["shelf_id"]
        state.attending_product_id = random.choice(nearby["product_ids"]) if nearby["product_ids"] else None
        state.attention_start = now
        state.attention_camera_id = camera_id
