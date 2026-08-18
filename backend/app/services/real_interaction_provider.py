"""Real/derived interaction metrics from the existing person + product tracks.

These metrics are NOT mock numbers. They are deterministic calculations from
actual TrackingEvent rows and POS PurchaseEvent rows. Pickup/return remain
candidate events because the current detector has no hand/keypoint model;
that limitation is surfaced in the source strings and API data-quality fields.
"""
from __future__ import annotations

import uuid
from collections import defaultdict
from sqlmodel import Session, select

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.purchase_event import PurchaseEvent
from app.models.shelf_camera_view import ShelfCameraView
from app.models.tracking_event import TrackingEvent
from app.services.metrics.base import MetricProvider, MetricResult


def _center(row):
    return ((row.x1 + row.x2) / 2.0, (row.y1 + row.y2) / 2.0)


def _inside(x, y, poly):
    if not poly or len(poly) < 3:
        return False
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i][:2]
        xj, yj = poly[j][:2]
        if ((yi > y) != (yj > y)) and x < (xj-xi) * (y-yi) / ((yj-yi) or 1e-9) + xi:
            inside = not inside
        j = i
    return inside


def _contact_metrics(camera_id, store_id):
    with Session(engine) as db:
        views = db.exec(select(ShelfCameraView).where(ShelfCameraView.camera_id == camera_id)).all()
    with Session(timescale_engine) as ts:
        rows = ts.exec(select(TrackingEvent).where(TrackingEvent.camera_id == str(camera_id)).order_by(TrackingEvent.frame_index)).all()
    if not rows:
        return {v.shelf_id: {"interaction": 0, "pickup": 0, "repeat": 0, "skus": set()} for v in views}, 0

    resets = [i for i, r in enumerate(rows) if r.frame_index == 0]
    if resets:
        rows = rows[resets[-1]:]
    people = defaultdict(list)
    products = defaultdict(list)
    for r in rows:
        if r.class_name is None:
            people[int(r.track_id)].append(r)
        else:
            products[(r.class_name, str(r.track_id))].append(r)

    by_shelf = {v.shelf_id: {"interaction": 0, "pickup": 0, "repeat": 0, "skus": set()} for v in views}
    contact_by_person_sku = defaultdict(list)

    # Pre-index people by frame for fast same-frame matching.
    people_by_frame = defaultdict(list)
    for pid, evs in people.items():
        for e in evs:
            people_by_frame[e.frame_index].append((pid, e))

    for (sku, product_track), evs in products.items():
        evs = sorted(evs, key=lambda r: r.frame_index)
        previous_inside = {v.shelf_id: False for v in views}
        for e in evs:
            px, py = _center(e)
            matching = [v for v in views if _inside(px, py, v.zone_coordinates or [])]
            for v in matching:
                by_shelf[v.shelf_id]["skus"].add(sku)
                if not previous_inside[v.shelf_id]:
                    previous_inside[v.shelf_id] = True
            # same-frame person/product contact; distance to box is zero when
            # the product centre is inside the person bbox.
            for pid, pe in people_by_frame.get(e.frame_index, []):
                if pe.x1 <= px <= pe.x2 and pe.y1 <= py <= pe.y2:
                    for v in matching:
                        by_shelf[v.shelf_id]["interaction"] += 1
                        contact_by_person_sku[(pid, sku)].append(e.frame_index)
                    break

            for v in views:
                inside_now = _inside(px, py, v.zone_coordinates or [])
                if previous_inside[v.shelf_id] and not inside_now:
                    # A product leaving its configured shelf while a shopper
                    # is contacting it is a pickup candidate, not a guaranteed
                    # physical pickup.
                    if any(
                        pe.frame_index == e.frame_index and pe.x1 <= px <= pe.x2 and pe.y1 <= py <= pe.y2
                        for _pid, pe in people_by_frame.get(e.frame_index, [])
                    ):
                        by_shelf[v.shelf_id]["pickup"] += 1
                previous_inside[v.shelf_id] = inside_now

    for (_pid, _sku), frames in contact_by_person_sku.items():
        frames = sorted(set(frames))
        if len(frames) >= 2 and any(b-a >= 5 for a, b in zip(frames, frames[1:])):
            for v in views:
                # Repeat is attributed to shelves where this SKU was observed.
                if _sku in by_shelf[v.shelf_id]["skus"]:
                    by_shelf[v.shelf_id]["repeat"] += 1

    return by_shelf, len(rows)


def _normalize(values, shelf_ids):
    mx = max(values.values(), default=0)
    return {sid: (values.get(sid, 0) / mx if mx else 0.0) for sid in shelf_ids}


class RealInteractionProvider(MetricProvider):
    name = "interaction"
    is_mock = False

    def __init__(self, metric: str):
        self.metric = metric
        self.name = metric

    def get_scores(self, shelf_ids, camera_id, store_id):
        raw, _ = _contact_metrics(camera_id, store_id)
        if self.metric == "interaction":
            values = {sid: raw.get(sid, {}).get("interaction", 0) for sid in shelf_ids}
            source = "derived_person_product_contact"
        elif self.metric == "pickup":
            values = {sid: raw.get(sid, {}).get("pickup", 0) for sid in shelf_ids}
            source = "derived_shelf_exit_pickup_candidate"
        elif self.metric == "repeat":
            values = {sid: raw.get(sid, {}).get("repeat", 0) for sid in shelf_ids}
            source = "derived_repeat_contact"
        else:
            # Purchase conversion proxy: observed transaction quantity for
            # SKUs seen on the shelf divided by candidate pickups on that
            # shelf. This is only marked observed when POS rows exist; when
            # no POS adapter has populated PurchaseEvent, the metric is
            # explicitly flagged as unavailable rather than fabricated.
            with Session(engine) as db:
                purchases = db.exec(select(PurchaseEvent).where(PurchaseEvent.store_id == store_id)).all()
            purchased_qty = defaultdict(float)
            for p in purchases:
                purchased_qty[p.sku] += max(0, p.quantity)
            values = {}
            for sid in shelf_ids:
                skus = raw.get(sid, {}).get("skus", set())
                denominator = max(1, raw.get(sid, {}).get("pickup", 0))
                numerator = sum(purchased_qty.get(sku, 0.0) for sku in skus)
                values[sid] = (numerator / denominator) if purchases else 0.0
            source = "real_pos_purchase_per_pickup_candidate" if purchases else "no_pos_data"
            purchase_is_mock = not bool(purchases)
        if self.metric != "purchase":
            purchase_is_mock = False
        normalized = _normalize(values, shelf_ids)
        return {
            sid: MetricResult(value=round(normalized[sid], 3), is_mock=purchase_is_mock, source=source)
            for sid in shelf_ids
        }
