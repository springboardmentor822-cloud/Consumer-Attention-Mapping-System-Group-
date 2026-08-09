"""
Pure rule-check functions for automatic alert generation. Every function
takes already-computed data (the coordinate dicts one video-processing run
produced, or a plain occupancy/queue count) and returns zero or more
AlertDraft objects - no DB access, no side effects, so these are trivially
unit-testable and reusable from anywhere the underlying numbers come from.

A single video-processing run always has ONE camera_id and ONE zone_id for
every coordinate record it produces (see app/api/routers/video.py's
process_video_endpoint / TrackingRepository.resolve_tracking_context) - a
camera physically points at one place. That's why these checks operate on
"this run's zone", not per-point zone lookups.

Deliberately does NOT cover two of the seven trigger types requested for
this feature - "Unknown object" and "Emergency" - because this system's
models don't support them: the person detector (YOLO26) only detects
people, and the product detector (YOLO-World) is a zero-shot detector
prompted with a fixed grocery-product vocabulary. Neither can recognize
an open-ended "unknown object" or classify an "emergency" event (fire,
fall, medical distress). Building either would mean fabricating a
detection capability that doesn't exist, so it's flagged here rather than
faked with a rule that can never actually fire from real detections.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.metrics import MAX_VISIT_GAP_SECONDS

# How long a tracked person must stay in one zone, uninterrupted (no gap
# larger than MAX_VISIT_GAP_SECONDS - the same continuity guard the rest of
# the analytics engine uses), before it counts as loitering rather than
# normal browsing. Set above the existing "Highly Engaged (10min+)" dwell
# bucket used elsewhere in this app, so ordinary engaged shopping alone
# doesn't trip a security alert.
LOITERING_THRESHOLD_SECONDS = 900.0


@dataclass
class AlertDraft:
    alert_type: str
    severity: str
    message: str
    camera_id: int | None = None
    zone_id: int | None = None


def check_occupancy(camera_id: int, camera_name: str, occupancy: int, threshold: int) -> AlertDraft | None:
    if occupancy <= threshold:
        return None
    return AlertDraft(
        alert_type="occupancy",
        severity="warning",
        message=f"{camera_name} occupancy ({occupancy}) is above the alert threshold ({threshold})",
        camera_id=camera_id,
    )


def check_queue(zone_id: int, zone_name: str, queue_length: int, threshold: int) -> AlertDraft | None:
    if queue_length <= threshold:
        return None
    return AlertDraft(
        alert_type="queue",
        severity="warning",
        message=f"Queue at '{zone_name}' has {queue_length} people - above the alert threshold ({threshold})",
        zone_id=zone_id,
    )


def check_camera_status(camera_id: int, camera_name: str, status: str) -> AlertDraft | None:
    if status == "Online":
        return None
    return AlertDraft(
        alert_type="camera",
        severity="critical",
        message=f"{camera_name} is {status.lower()}",
        camera_id=camera_id,
    )


def check_restricted_zone_entry(
    camera_id: int, zone_id: int | None, zone_name: str, is_restricted: bool, distinct_customers: int
) -> AlertDraft | None:
    if not is_restricted or zone_id is None or distinct_customers == 0:
        return None
    who = "1 person was" if distinct_customers == 1 else f"{distinct_customers} people were"
    return AlertDraft(
        alert_type="restricted_zone",
        severity="critical",
        message=f"{who} detected in restricted zone '{zone_name}'",
        camera_id=camera_id,
        zone_id=zone_id,
    )


def check_loitering(
    coordinates: list[dict],
    camera_id: int,
    zone_id: int | None,
    zone_name: str,
    threshold_seconds: float = LOITERING_THRESHOLD_SECONDS,
) -> AlertDraft | None:
    """coordinates are this run's raw records (customer_id/timestamp keys,
    see app/ai/coordinates.py) - all sharing the same camera/zone already,
    so this only needs to group by customer_id."""
    if zone_id is None:
        return None

    by_customer: dict[int, list[float]] = {}
    for row in coordinates:
        ts = row.get("timestamp")
        if ts is None:
            continue
        by_customer.setdefault(row["customer_id"], []).append(ts)

    longest_overall = 0.0
    loitering_customer: int | None = None
    for customer_id, timestamps in by_customer.items():
        ordered = sorted(timestamps)
        run_start = ordered[0]
        run_end = ordered[0]
        longest_run = 0.0
        for prev, curr in zip(ordered, ordered[1:]):
            if curr - prev > MAX_VISIT_GAP_SECONDS:
                longest_run = max(longest_run, run_end - run_start)
                run_start = curr
            run_end = curr
        longest_run = max(longest_run, run_end - run_start)

        if longest_run > longest_overall:
            longest_overall = longest_run
            loitering_customer = customer_id

    if longest_overall < threshold_seconds or loitering_customer is None:
        return None

    return AlertDraft(
        alert_type="loitering",
        severity="warning",
        message=(
            f"Customer #{loitering_customer} stayed in '{zone_name}' for "
            f"{round(longest_overall / 60, 1)} minutes - above the {round(threshold_seconds / 60)}-minute threshold"
        ),
        camera_id=camera_id,
        zone_id=zone_id,
    )
