"""SKU-level product visibility analytics derived from real product tracking events.

Database split:
- Main PostgreSQL: Shelf and ShelfCameraView configuration.
- TimescaleDB: TrackingEvent product observations.

What is real:
- Product class labels come from TrackingEvent.class_name.
- Product track observations come from TimescaleDB tracking_events.
- Product visibility is estimated from distinct product track IDs observed
  inside configured ShelfCameraView polygons.

What is intentionally NOT claimed:
- pickup, return, comparison and purchase are not inferred from a product
  box appearing/disappearing. Those require person-product interaction logic
  and, for purchase, a transaction source.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, UTC
import uuid

from sqlmodel import Session, select

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.tracking_event import TrackingEvent
from app.models.store import Shelf
from app.models.shelf_camera_view import ShelfCameraView
from app.models.product_interaction_event import ProductInteractionEvent


MAX_TRACK_GAP_SECONDS = 5.0


def _point_in_polygon(x: float, y: float, polygon: list) -> bool:
    """Ray-casting point-in-polygon. Accepts [[x,y], ...]."""
    if not polygon or len(polygon) < 3:
        return False

    points = []
    for p in polygon:
        if isinstance(p, (list, tuple)) and len(p) >= 2:
            try:
                points.append((float(p[0]), float(p[1])))
            except (TypeError, ValueError):
                continue

    if len(points) < 3:
        return False

    inside = False
    j = len(points) - 1

    for i, (xi, yi) in enumerate(points):
        xj, yj = points[j]
        intersects = ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi
        )
        if intersects:
            inside = not inside
        j = i

    return inside


def _center(row: TrackingEvent) -> tuple[float, float]:
    return ((row.x1 + row.x2) / 2.0, (row.y1 + row.y2) / 2.0)


def _load_views(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    session: Session,
) -> dict[uuid.UUID, tuple[str, list]]:
    """Load shelf/camera polygons from the main PostgreSQL database."""
    shelves = session.exec(
        select(Shelf).where(Shelf.store_id == store_id)
    ).all()

    shelf_map = {s.id: s.shelf_name for s in shelves}

    views = session.exec(
        select(ShelfCameraView).where(
            ShelfCameraView.camera_id == camera_id
        )
    ).all()

    return {
        v.shelf_id: (
            shelf_map.get(v.shelf_id, str(v.shelf_id)),
            v.zone_coordinates or [],
        )
        for v in views
        if v.shelf_id in shelf_map
    }


def get_product_interactions(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    start: datetime | None = None,
    end: datetime | None = None,
) -> dict:
    """Return product/SKU-level visibility with explicit interaction placeholders."""

    if start and start.tzinfo is None:
        start = start.replace(tzinfo=UTC)

    if end and end.tzinfo is None:
        end = end.replace(tzinfo=UTC)

    # IMPORTANT:
    # Shelf and ShelfCameraView are normal application tables in PostgreSQL.
    # They must NOT be queried through timescale_engine.
    with Session(engine) as postgres_session:
        views = _load_views(
            store_id=store_id,
            camera_id=camera_id,
            session=postgres_session,
        )

    if not views:
        return {
            "store_id": str(store_id),
            "camera_id": str(camera_id),
            "window": {
                "start": start.isoformat() if start else None,
                "end": end.isoformat() if end else None,
            },
            "data_quality": {
                "product_visibility": "unavailable",
                "pickup": "placeholder",
                "return": "placeholder",
                "comparison": "placeholder",
                "purchase": "placeholder",
            },
            "products": [],
        }
    # TrackingEvent belongs to TimescaleDB.
    statement = select(TrackingEvent).where(
        TrackingEvent.camera_id == str(camera_id),
        TrackingEvent.class_name.is_not(None),
    )

    if start:
        statement = statement.where(
            TrackingEvent.event_time >= start
        )

    if end:
        statement = statement.where(
            TrackingEvent.event_time <= end
        )

    with Session(timescale_engine) as timescale_session:
        rows = timescale_session.exec(
            statement.order_by(TrackingEvent.event_time.asc())
        ).all()

    # Track only product observations that fall inside a configured shelf view.
    per_product: dict[str, dict] = defaultdict(
        lambda: {
            "track_ids": set(),
            "observations": 0,
            "first_seen": None,
            "last_seen": None,
            "shelves": defaultdict(set),
            "track_last_seen": {},
        }
    )

    for row in rows:
        cx, cy = _center(row)

        matching_shelves = [
            (shelf_id, shelf_name, polygon)
            for shelf_id, (shelf_name, polygon) in views.items()
            if _point_in_polygon(cx, cy, polygon)
        ]

        if not matching_shelves:
            continue

        product_name = row.class_name or "Unknown product"
        bucket = per_product[product_name]

        bucket["track_ids"].add(str(row.track_id))
        bucket["observations"] += 1

        bucket["first_seen"] = (
            row.event_time
            if bucket["first_seen"] is None
            else min(bucket["first_seen"], row.event_time)
        )

        bucket["last_seen"] = (
            row.event_time
            if bucket["last_seen"] is None
            else max(bucket["last_seen"], row.event_time)
        )

        for shelf_id, _shelf_name, _polygon in matching_shelves:
            bucket["shelves"][shelf_id].add(str(row.track_id))

        key = (product_name, str(row.track_id))
        previous = bucket["track_last_seen"].get(key)

        if previous is not None:
            gap = (row.event_time - previous).total_seconds()

            if 0 < gap <= MAX_TRACK_GAP_SECONDS:
                bucket.setdefault("visible_seconds", 0.0)
                bucket["visible_seconds"] += gap

        bucket["track_last_seen"][key] = row.event_time

    # FIXED (was a real gap): pickup_count/return_count/comparison_count used
    # to be hardcoded None on every product, with a comment saying product
    # visibility alone isn't evidence of pickup/return/comparison - true,
    # but app/services/completion_analytics.py's derive_interactions()
    # already computes AND (since the fix above) persists exactly these
    # candidates per product, to ProductInteractionEvent. This queries that
    # real, already-computed data instead of leaving it stranded. Note this
    # is populated only after /api/v1/completion/{store}/{camera}/interactions
    # has been called at least once for this camera - it's a separate
    # persisted table, not computed fresh here.
    with Session(engine) as postgres_session:
        candidate_rows = postgres_session.exec(
            select(ProductInteractionEvent)
            .where(ProductInteractionEvent.camera_id == camera_id)
            .where(ProductInteractionEvent.event_type.in_(["pickup_candidate", "return_candidate", "comparison"]))
        ).all()
        candidates_computed = (
            postgres_session.exec(
                select(ProductInteractionEvent).where(ProductInteractionEvent.camera_id == camera_id).limit(1)
            ).first()
            is not None
        )
    pickup_by_product: dict[str, int] = defaultdict(int)
    return_by_product: dict[str, int] = defaultdict(int)
    comparison_by_product: dict[str, int] = defaultdict(int)
    for row in candidate_rows:
        if row.event_type == "pickup_candidate":
            pickup_by_product[row.product_name] += 1
        elif row.event_type == "return_candidate":
            return_by_product[row.product_name] += 1
        elif row.event_type == "comparison":
            comparison_by_product[row.product_name] += 1

    products = []

    for product_name, bucket in per_product.items():
        products.append(
            {
                "product_name": product_name,
                "observed_track_count": len(bucket["track_ids"]),
                "observation_count": bucket["observations"],
                "estimated_visible_seconds": round(
                    bucket.get("visible_seconds", 0.0),
                    2,
                ),
                "shelves": [
                    {
                        "shelf_id": str(shelf_id),
                        "shelf_name": next(
                            (
                                name
                                for sid, (name, _poly) in views.items()
                                if sid == shelf_id
                            ),
                            str(shelf_id),
                        ),
                        "observed_track_count": len(track_ids),
                    }
                    for shelf_id, track_ids in bucket["shelves"].items()
                ],
                "pickup_count": pickup_by_product.get(product_name, 0) if candidates_computed else None,
                "return_count": return_by_product.get(product_name, 0) if candidates_computed else None,
                "comparison_count": comparison_by_product.get(product_name, 0) if candidates_computed else None,
                "purchase_count": None,
                "interaction_status": "candidate_derived" if candidates_computed else "placeholder",
            }
        )

    products.sort(
        key=lambda p: (
            p["observed_track_count"],
            p["observation_count"],
        ),
        reverse=True,
    )

    return {
        "store_id": str(store_id),
        "camera_id": str(camera_id),
        "window": {
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
        },
        "data_quality": {
            "product_visibility": "real_from_product_tracking",
            "pickup": "candidate_derived_from_shelf_exit_plus_contact" if candidates_computed else "placeholder_run_completion_interactions_first",
            "return": "candidate_derived_from_shelf_entry_plus_contact" if candidates_computed else "placeholder_run_completion_interactions_first",
            "comparison": "derived_from_cross_sku_contact" if candidates_computed else "placeholder_run_completion_interactions_first",
            "purchase": "placeholder",
        },
        "products": products,
    }
