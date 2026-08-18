"""
Two analytics needed for the dashboard's remaining Step 6 charts -
both derived from the same TrackingEvent rows compute_dwell_time.py
already reads, just aggregated differently.
"""
import uuid
from collections import defaultdict

from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.models.zone import Zone
from app.services.tracking_query_utils import get_latest_run_person_events, get_video_fps


def compute_traffic_over_time(camera_id: uuid.UUID, bucket_seconds: float = 2.0) -> list[dict]:
    """
    Person-tracking-event counts per time bucket, for the most recent
    tracking_runner run against this camera. Bucketed by ELAPSED VIDEO
    TIME (frame_index / fps), NOT event_time - same reasoning as
    compute_dwell_time.py: event_time reflects processing speed (how
    fast detection ran), not real video playback time, so bucketing by
    it would compress/stretch the timeline relative to what's actually
    in the footage.
    Returns [] if the camera doesn't exist or has no person events yet
    (not an error - just means tracking_runner hasn't been run against
    it, same as compute_dwell_time.py's "nothing to compute" case).
    """
    with Session(engine) as session:
        camera = session.get(Camera, camera_id)
        if not camera:
            return []
        source_path = camera.source_path

    events = get_latest_run_person_events(camera_id)
    if not events:
        return []

    fps = get_video_fps(source_path)
    seconds_per_frame = 1.0 / fps

    buckets: dict = defaultdict(int)
    for event in events:
        elapsed = event.frame_index * seconds_per_frame
        bucket_key = int(elapsed // bucket_seconds) * bucket_seconds
        buckets[bucket_key] += 1

    return [
        {"bucket_start_seconds": round(key, 1), "event_count": count}
        for key, count in sorted(buckets.items())
    ]


def compute_zone_traffic(store_id: uuid.UUID) -> list[dict]:
    """
    Per-zone comparison across every camera in the store: total person-
    tracking events (summed across cameras — this is safe, an event
    count has no double-counting concept) and a conservative distinct-
    visitor estimate (see below), each camera using its own most recent
    run.

    FIXED (was a real bug): distinct_visitors used to be the SUM of each
    camera's unique track_id count. Since track_id is only unique WITHIN
    one camera's one run (ByteTrack/DeepSORT restart numbering per run,
    per camera - see compute_dwell_time.py's comment on this same
    point), summing across cameras double-counted every shopper seen by
    more than one camera in the same zone - which became a live issue
    once Camera 2 and Camera 3 both started reporting events for Main
    Product Aisle.

    There is no cross-camera re-identification in this system, so an
    exact dedup isn't possible without new CV work. Until that exists,
    distinct_visitors here is the MAX of any single camera's unique
    count in that zone - a conservative "at least this many distinct
    people" lower bound, which can only ever under-count, never over-
    count. The raw per-camera breakdown is still returned separately
    (distinct_visitors_by_camera) so nothing is hidden - a dashboard
    that wants to reason about the double-counting risk directly can.

    Still a proxy, not a precise headcount - don't present either
    number as exact.
    """
    with Session(engine) as session:
        store_zones = session.exec(select(Zone).where(Zone.store_id == store_id)).all()
        zone_names = {z.id: z.name for z in store_zones}
        cameras = session.exec(select(Camera).where(Camera.store_id == store_id)).all()

    zone_event_counts: dict = defaultdict(int)
    # zone_id -> list of {"camera_id": ..., "camera_name": ..., "distinct_visitors": int}
    zone_visitor_breakdown: dict = defaultdict(list)

    for camera in cameras:
        if camera.zone_id not in zone_names:
            continue  # camera's zone_id doesn't resolve to a zone in this store - skip rather than crash
        events = get_latest_run_person_events(camera.id)
        if not events:
            continue
        zone_event_counts[camera.zone_id] += len(events)
        zone_visitor_breakdown[camera.zone_id].append(
            {
                "camera_id": str(camera.id),
                "camera_name": camera.name,
                "distinct_visitors": len({e.track_id for e in events}),
            }
        )

    return [
        {
            "zone_id": str(zone_id),
            "zone_name": zone_names[zone_id],
            "event_count": zone_event_counts.get(zone_id, 0),
            "distinct_visitors": max(
                (c["distinct_visitors"] for c in zone_visitor_breakdown.get(zone_id, [])),
                default=0,
            ),
            "distinct_visitors_by_camera": zone_visitor_breakdown.get(zone_id, []),
        }
        for zone_id in zone_names
    ]
