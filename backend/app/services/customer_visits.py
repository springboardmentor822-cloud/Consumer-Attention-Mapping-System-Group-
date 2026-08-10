"""
Turns real tracking data into CustomerVisit / CustomerInteraction rows.

This is the video -> customer-analytics seam. It consumes only what the
existing pipeline genuinely produces (person detections tracked by ByteTrack
and written to tracking_data by app/api/routers/video.py) and derives visit
sessions from it. It invents nothing: no identity, no purchase, no
interaction that isn't backed by a real tracked position.

Session segmentation is delegated to app/analytics/dwell_time.segment_all_sessions
rather than reimplemented, so a "visit" here means exactly what it already
means elsewhere in this codebase - one continuous presence of a tracked id,
split only on a time gap, spanning however many zones the shopper walked
through.

Anonymous labelling: a visit's display id is "customer_%03d" built from the
ByteTrack track number. That label is per-camera and per-run and is NOT an
identity - see the module docstring on app/models/customer.py for why it
cannot be. Real names/phones attach only through CustomerVisit.customer_id.
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy.orm import Session as DbSession

from app.analytics.dwell_time import segment_all_sessions
from app.models.camera import Camera
from app.models.customer import CustomerInteraction, CustomerVisit
from app.models.product import Product
from app.models.shelf import Shelf
from app.models.tracking_data import TrackingData
from app.models.zone import Zone

logger = logging.getLogger("cams.customer_visits")


def anonymous_label(track_number: int) -> str:
    """The UI-facing anonymous id, e.g. 3 -> 'customer_003'."""
    return f"customer_{track_number:03d}"


def _zone_products(db: DbSession, store_id: int) -> dict[int, list[Product]]:
    """Products reachable from each zone, via the shelves standing in it.

    Shelf.zone is a free-text column (not a FK to zones.id), so the join is
    by name, case-insensitively. A shelf whose zone text matches no real zone
    simply contributes nothing rather than being guessed at.
    """
    zones = db.query(Zone).filter(Zone.store_id == store_id).all()
    zone_by_name = {z.zone_name.strip().lower(): z.id for z in zones}

    mapping: dict[int, list[Product]] = {}
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    for shelf in shelves:
        zone_id = zone_by_name.get((shelf.zone or "").strip().lower())
        if zone_id is None:
            continue
        products = db.query(Product).filter(Product.shelf_id == shelf.id).all()
        if products:
            mapping.setdefault(zone_id, []).extend(products)
    return mapping


def rebuild_visits_for_store(db: DbSession, store_id: int, since: datetime | None = None) -> dict:
    """(Re)derive visit sessions for one store from its real tracking data.

    Idempotent: a visit is keyed by (camera_id, tracking_id, entry_time) - the
    same natural key DwellMetric uses - so running this repeatedly over the
    same tracking rows updates existing visits instead of duplicating them.
    That matters because videos get reprocessed often during testing.
    """
    camera_ids = [c.id for c in db.query(Camera.id).filter(Camera.store_id == store_id).all()]
    if not camera_ids:
        return {"store_id": store_id, "visits_created": 0, "visits_updated": 0, "interactions_created": 0}

    query = db.query(TrackingData).filter(TrackingData.camera_id.in_(camera_ids))
    if since is not None:
        query = query.filter(TrackingData.timestamp >= since)
    rows = query.all()
    if not rows:
        return {"store_id": store_id, "visits_created": 0, "visits_updated": 0, "interactions_created": 0}

    sessions = segment_all_sessions(rows)
    zone_products = _zone_products(db, store_id)

    created = updated = interactions_created = 0
    for session in sessions:
        label = anonymous_label(session.customer_id)
        existing = (
            db.query(CustomerVisit)
            .filter(
                CustomerVisit.camera_id == session.camera_id,
                CustomerVisit.tracking_id == label,
                CustomerVisit.entry_time == session.entry_time,
            )
            .first()
        )

        zone_ids_in_session = [p.zone_id for p in session.points if p.zone_id is not None]
        distinct_zones = list(dict.fromkeys(zone_ids_in_session))  # ordered, deduped

        if existing is None:
            visit = CustomerVisit(
                tracking_id=label,
                track_number=session.customer_id,
                store_id=store_id,
                camera_id=session.camera_id,
                entry_time=session.entry_time,
                exit_time=session.exit_time,
                total_dwell_seconds=session.duration_seconds,
                total_zones_visited=len(distinct_zones),
            )
            db.add(visit)
            db.flush()
            created += 1
        else:
            visit = existing
            visit.exit_time = session.exit_time
            visit.total_dwell_seconds = session.duration_seconds
            visit.total_zones_visited = len(distinct_zones)
            updated += 1

        # Interactions are rebuilt wholesale for this visit so a reprocessed
        # video can't accumulate duplicates.
        db.query(CustomerInteraction).filter(CustomerInteraction.customer_visit_id == visit.id).delete(
            synchronize_session=False
        )

        # Time actually spent in each zone during this session, from the real
        # gaps between consecutive tracked points.
        seconds_in_zone: dict[int, float] = {}
        first_seen_in_zone: dict[int, datetime] = {}
        ordered = sorted(session.points, key=lambda p: p.timestamp)
        for prev, curr in zip(ordered, ordered[1:]):
            if prev.zone_id is None:
                continue
            seconds_in_zone[prev.zone_id] = seconds_in_zone.get(prev.zone_id, 0.0) + (
                curr.timestamp - prev.timestamp
            ).total_seconds()
            first_seen_in_zone.setdefault(prev.zone_id, prev.timestamp)

        for zone_id, seconds in seconds_in_zone.items():
            for product in zone_products.get(zone_id, []):
                db.add(
                    CustomerInteraction(
                        customer_visit_id=visit.id,
                        product_id=product.id,
                        zone_id=zone_id,
                        interaction_type="zone_proximity",
                        timestamp=first_seen_in_zone.get(zone_id, visit.entry_time),
                        duration_seconds=round(seconds, 2),
                    )
                )
                interactions_created += 1

    db.commit()
    result = {
        "store_id": store_id,
        "visits_created": created,
        "visits_updated": updated,
        "interactions_created": interactions_created,
    }
    logger.info("Customer visits rebuilt: %s", result)
    return result


def rebuild_visits_after_processing(store_id: int) -> None:
    """Background-task entry point used after a video finishes processing.

    Opens its own session (the request's is gone by then) and swallows
    failures: customer analytics must never be able to break or delay video
    processing, exactly like alert generation in app/services/alert_service.py.
    """
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        rebuild_visits_for_store(db, store_id)
    except Exception:
        logger.exception(
            "Customer visit rebuild failed for store_id=%s - video processing already completed and is unaffected",
            store_id,
        )
    finally:
        db.close()
