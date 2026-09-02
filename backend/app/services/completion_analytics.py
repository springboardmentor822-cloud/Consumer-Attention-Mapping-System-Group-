"""Milestone completion analytics.

This module closes the biggest remaining dashboard gaps using the data that
actually exists in the project.  It intentionally separates:

* REAL: observations directly present in tracking_events or POS purchases.
* DERIVED: deterministic calculations from those observations.
* HEURISTIC: person/product spatial-contact candidates. These are useful for
  a demo and for model bootstrapping, but are not presented as hand-level CV.

Cross-camera shopper re-identification is not available in the current event
schema, so journey output is marked as camera-scoped/proxy rather than being
mislabelled as exact end-to-end shopper journeys.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, UTC
import math
import uuid

from sqlmodel import Session, select
from sqlalchemy import delete

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Shelf, Store
from app.models.zone import Zone, ZoneType
from app.models.purchase_event import PurchaseEvent
from app.models.product_interaction_event import ProductInteractionEvent
from app.models.tracking_event import TrackingEvent
from app.services.tracking_query_utils import get_latest_run_person_events


def _center(row):
    return ((row.x1 + row.x2) / 2.0, (row.y1 + row.y2) / 2.0)


def _distance_to_box(px, py, row):
    dx = max(row.x1 - px, 0, px - row.x2)
    dy = max(row.y1 - py, 0, py - row.y2)
    return math.hypot(dx, dy)


def _load_events(camera_id: uuid.UUID):
    with Session(timescale_engine) as s:
        rows = s.exec(
            select(TrackingEvent)
            .where(TrackingEvent.camera_id == str(camera_id))
            .order_by(TrackingEvent.frame_index, TrackingEvent.event_time)
        ).all()
    # Isolate latest run by the final frame reset, same convention as the
    # existing dwell/segmentation pipeline.
    if not rows:
        return []
    reset_indexes = [i for i, r in enumerate(rows) if r.frame_index == 0]
    return rows[reset_indexes[-1]:] if reset_indexes else rows


def derive_interactions(store_id: uuid.UUID, camera_id: uuid.UUID) -> dict:
    rows = _load_events(camera_id)
    people = defaultdict(list)
    products = defaultdict(list)
    for r in rows:
        if r.class_name is None:
            people[int(r.track_id)].append(r)
        else:
            products[(r.class_name, str(r.track_id))].append(r)

    contacts = []
    by_person = defaultdict(list)
    by_product = defaultdict(list)
    for (sku, product_track), prows in products.items():
        for pr in prows:
            best = None
            best_dist = float("inf")
            px, py = _center(pr)
            # Compare only people observed in the same frame. This avoids
            # using wall-clock processing latency as a false temporal match.
            for person_id, prows_person in people.items():
                # Small local search; cameras in the demo have manageable
                # numbers of tracks.  Choose nearest person box.
                for pe in prows_person:
                    if pe.frame_index != pr.frame_index:
                        continue
                    d = _distance_to_box(px, py, pe) if not (pe.x1 <= px <= pe.x2 and pe.y1 <= py <= pe.y2) else 0.0
                    if d < best_dist:
                        best_dist = d
                        best = (person_id, pe)
            if best is None or best_dist > 55:
                continue
            person_id, pe = best
            confidence = max(0.0, 1.0 - best_dist / 55.0)
            contacts.append((person_id, sku, product_track, pr.frame_index, pr.event_time, confidence))
            by_person[person_id].append((sku, product_track, pr.frame_index, pr.event_time, confidence))
            by_product[(sku, product_track)].append((person_id, pr.frame_index, pr.event_time, confidence))

    # Collapse contact frames into interaction events.
    interaction_events = []
    for key, vals in by_product.items():
        vals.sort(key=lambda x: x[1])
        runs = []
        current = []
        for v in vals:
            if not current or v[1] - current[-1][1] <= 3:
                current.append(v)
            else:
                if len(current) >= 3:
                    runs.append(current)
                current = [v]
        if len(current) >= 3:
            runs.append(current)
        for run in runs:
            person_ids = Counter(v[0] for v in run)
            person_id, _ = person_ids.most_common(1)[0]
            avg_conf = sum(v[3] for v in run) / len(run)
            interaction_events.append({
                "person_track_id": int(person_id),
                "product_track_id": key[1],
                "product_name": key[0],
                "event_type": "contact",
                "event_time": run[0][2],
                "confidence": round(avg_conf, 3),
            })

    # Comparison = one tracked shopper making contact with two or more SKUs
    # in a short window. This is a derived behavioural signal, not purchase.
    comparison_count = 0
    comparison_events = []
    for person_id, vals in by_person.items():
        vals.sort(key=lambda x: x[3])
        for i in range(len(vals)):
            seen = {vals[i][0]}
            for j in range(i + 1, len(vals)):
                dt = (vals[j][3] - vals[i][3]).total_seconds()
                if dt > 15:
                    break
                seen.add(vals[j][0])
                if len(seen) >= 2:
                    comparison_count += 1
                    comparison_events.append({
                        "person_track_id": int(person_id),
                        "product_track_id": vals[j][1],
                        "product_name": vals[j][0],
                        "event_type": "comparison",
                        "event_time": vals[j][3],
                        "confidence": round(min(vals[i][4], vals[j][4]), 3),
                    })
                    break

    # Pickup/return candidates: product leaves its configured shelf view
    # during a contact episode. Without hand/keypoint/occlusion evidence this
    # remains a candidate, not an observed pickup/return.
    with Session(engine) as db:
        views = db.exec(select(ShelfCameraView).where(ShelfCameraView.camera_id == camera_id)).all()
    polygons = [(v.shelf_id, v.zone_coordinates or []) for v in views]

    def inside(x, y, poly):
        if len(poly) < 3:
            return False
        inside_flag = False
        j = len(poly) - 1
        for i in range(len(poly)):
            xi, yi = poly[i][:2]
            xj, yj = poly[j][:2]
            if ((yi > y) != (yj > y)) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
                inside_flag = not inside_flag
            j = i
        return inside_flag

    pickup_candidates = 0
    return_candidates = 0
    pickup_events = []
    return_events = []
    for (sku, track_id), prows in products.items():
        if not polygons:
            continue
        prows = sorted(prows, key=lambda r: r.frame_index)
        shelf_state = [any(inside(*_center(r), poly) for _, poly in polygons) for r in prows]
        for idx in range(1, len(prows)):
            if shelf_state[idx - 1] and not shelf_state[idx]:
                # Require a nearby contact within a small frame neighbourhood.
                match = next(
                    (c for c in contacts if abs(c[3] - prows[idx].frame_index) <= 3 and c[1] == sku and c[2] == track_id),
                    None,
                )
                if match is not None:
                    pickup_candidates += 1
                    pickup_events.append({
                        "person_track_id": int(match[0]),
                        "product_track_id": track_id,
                        "product_name": sku,
                        "event_type": "pickup_candidate",
                        "event_time": prows[idx].event_time,
                        "confidence": round(match[5], 3),
                    })
            if not shelf_state[idx - 1] and shelf_state[idx]:
                match = next(
                    (c for c in contacts if abs(c[3] - prows[idx].frame_index) <= 3 and c[1] == sku and c[2] == track_id),
                    None,
                )
                if match is not None:
                    return_candidates += 1
                    return_events.append({
                        "person_track_id": int(match[0]),
                        "product_track_id": track_id,
                        "product_name": sku,
                        "event_type": "return_candidate",
                        "event_time": prows[idx].event_time,
                        "confidence": round(match[5], 3),
                    })

    # Persist contact/comparison/pickup/return candidates; duplicate-safe enough for a
    # dashboard run because the API deletes the current camera's derived rows
    # before re-inserting the latest run.
    # FIXED (was a real gap): pickup_candidates/return_candidates used to only
    # ever be returned as aggregate counts - the per-product detail computed
    # above (which product, which shopper, when) was thrown away instead of
    # persisted, even though ProductInteractionEvent.event_type's own
    # docstring already listed "pickup_candidate / return_candidate" as
    # values it expected to hold. Nothing downstream could ever answer
    # "which products get picked up most" from this - now it can, via
    # get_product_interactions() in product_interactions.py.
    with Session(engine) as db:
        db.exec(delete(ProductInteractionEvent).where(ProductInteractionEvent.camera_id == camera_id))
        for event in interaction_events + comparison_events + pickup_events + return_events:
            db.add(ProductInteractionEvent(
                store_id=store_id,
                camera_id=camera_id,
                person_track_id=event["person_track_id"],
                product_track_id=event["product_track_id"],
                product_name=event["product_name"],
                event_type=event["event_type"],
                event_time=event["event_time"],
                confidence=event["confidence"],
            ))
        db.commit()

    return {
        "store_id": str(store_id),
        "camera_id": str(camera_id),
        "interaction_events": len(interaction_events),
        "comparison_events": len(comparison_events),
        "pickup_candidates": pickup_candidates,
        "return_candidates": return_candidates,
        "data_quality": {
            "interaction": "derived_from_person_product_spatial_contact",
            "comparison": "derived_from_cross_sku_contact",
            "pickup": "heuristic_candidate_not_hand_level_detection",
            "return": "heuristic_candidate_not_hand_level_detection",
        },
        "events": interaction_events + comparison_events,
    }


def journey_data(store_id: uuid.UUID) -> dict:
    """
    Build a real Sankey-ready journey dataset from actual TrackingEvent
    timestamps, linked with a timing-proximity heuristic across cameras.

    FIXED (was a real bug): this used to sort sessions from DIFFERENT
    cameras by frame_index and treat adjacency in that sort as a "flow".
    frame_index is camera-local (each camera's own video starts at frame
    0) - comparing frame numbers across two different cameras' videos is
    comparing incomparable numbers, not a real chronology. event_time is
    a real wall-clock timestamp (set by the background worker at persist
    time - see tracking_query_utils.py), the same field already trusted
    elsewhere in this codebase for run-boundary detection. This function
    now uses event_time throughout instead.

    The heuristic itself: a track's session END in one zone is linked to
    a DIFFERENT track's session START in a zone the store's own ZoneType
    ordering (Entrance -> Aisle -> Checkout) says is a plausible next
    step, if that start happens within TRANSITION_WINDOW_SECONDS of the
    end. Each source session contributes to at most one outgoing link
    (its closest-in-time match), so one long session can't fan out into
    many inflated links. This is still NOT visual re-identification -
    two different real people could plausibly satisfy "left zone A right
    when someone entered zone B" - which is exactly why every response
    here discloses it as a timing heuristic, not confirmed identity.
    """
    TRANSITION_WINDOW_SECONDS = 120

    with Session(engine) as db:
        cameras = db.exec(select(Camera).where(Camera.store_id == store_id)).all()
        zones = db.exec(select(Zone).where(Zone.store_id == store_id)).all()
    zone_map = {str(z.id): z for z in zones}
    zone_order = {ZoneType.ENTRANCE: 0, ZoneType.AISLE: 1, ZoneType.CHECKOUT: 2}
    camera_zone = {str(c.id): zone_map.get(str(c.zone_id)) for c in cameras}
    camera_name = {str(c.id): c.name for c in cameras}

    sessions = []
    for cam in cameras:
        zone = camera_zone.get(str(cam.id))
        if zone is None:
            continue
        events = get_latest_run_person_events(cam.id)
        by_track = defaultdict(list)
        for e in events:
            by_track[int(e.track_id)].append(e)
        for track_id, evs in by_track.items():
            evs.sort(key=lambda x: x.event_time)
            sessions.append({
                "camera_id": str(cam.id),
                "track_id": track_id,
                "camera": camera_name[str(cam.id)],
                "zone": zone.name,
                "zone_order": zone_order.get(zone.zone_type, 99),
                "start_time": evs[0].event_time,
                "end_time": evs[-1].event_time,
            })

    counts = Counter(s["zone"] for s in sessions)

    # Greedy nearest-in-time forward match: for each session, find the
    # closest-starting session in a later zone within the transition
    # window. Sort candidates by start_time so "closest" is a simple
    # first-match-after-end scan, not an O(n^2) argmin.
    by_zone_order = defaultdict(list)
    for s in sessions:
        by_zone_order[s["zone_order"]].append(s)
    for bucket in by_zone_order.values():
        bucket.sort(key=lambda s: s["start_time"])

    link_counts: Counter = Counter()
    matched_pairs = 0
    for s in sessions:
        best = None
        best_gap = None
        for order in sorted(by_zone_order.keys()):
            if order <= s["zone_order"]:
                continue
            for candidate in by_zone_order[order]:
                if candidate["camera_id"] == s["camera_id"] and candidate["track_id"] == s["track_id"]:
                    continue
                gap = (candidate["start_time"] - s["end_time"]).total_seconds()
                if 0 <= gap <= TRANSITION_WINDOW_SECONDS:
                    if best_gap is None or gap < best_gap:
                        best, best_gap = candidate, gap
            if best is not None:
                break  # nearest zone tier first; don't skip ahead to a farther tier
        if best is not None:
            link_counts[(s["zone"], best["zone"])] += 1
            matched_pairs += 1

    links = [
        {"source": source, "target": target, "value": value}
        for (source, target), value in link_counts.items()
    ]

    return {
        "store_id": str(store_id),
        "sessions": len(sessions),
        "matched_transitions": matched_pairs,
        "nodes": [{"name": z} for z in counts],
        "links": links,
        "zone_observations": [{"zone": z, "count": c} for z, c in counts.items()],
        "data_quality": "timing_proximity_heuristic_no_visual_reidentification",
        "disclosure": (
            f"Links connect a session ending in one zone to a DIFFERENT track's session "
            f"starting in a later zone (by store layout order) within "
            f"{TRANSITION_WINDOW_SECONDS}s - a timing-proximity heuristic computed from "
            f"real event timestamps, not confirmed same-person visual re-identification. "
            f"Two different shoppers could coincidentally satisfy this. "
            f"{matched_pairs} of {len(sessions)} sessions matched a plausible next-zone session."
        ),
    }


def purchase_summary(store_id: uuid.UUID) -> dict:
    with Session(engine) as db:
        rows = db.exec(select(PurchaseEvent).where(PurchaseEvent.store_id == store_id)).all()
    by_sku = defaultdict(lambda: {"quantity": 0, "revenue": 0.0})
    for r in rows:
        by_sku[r.sku]["quantity"] += r.quantity
        by_sku[r.sku]["revenue"] += r.amount
    return {
        "store_id": str(store_id),
        "transactions": len({r.transaction_id for r in rows}),
        "items": sum(r.quantity for r in rows),
        "revenue": round(sum(r.amount for r in rows), 2),
        "by_sku": [{"sku": sku, **vals} for sku, vals in by_sku.items()],
        "data_quality": "real_pos_events" if rows else "unavailable_no_pos_events",
    }


def conversion_summary(store_id: uuid.UUID, camera_id: uuid.UUID | None = None) -> dict:
    purchase = purchase_summary(store_id)
    interactions = []
    if camera_id:
        interactions = derive_interactions(store_id, camera_id)["events"]
    return {
        "attention_events": len(interactions),
        "purchase": purchase,
        "conversion_available": purchase["data_quality"] == "real_pos_events",
        "note": "Purchase conversion is only calculated when POS PurchaseEvent rows exist; camera disappearance is never treated as a purchase.",
    }
