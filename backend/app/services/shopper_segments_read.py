"""
Read-path for ShopperSegment data - compute_shopper_segments.py only
writes; nothing has ever served it back over the API until this.

RUN ISOLATION: unlike TrackingEvent (which has a frame_index reset to
detect a fresh run) or ProductAttractivenessScore (one clean row per
shelf per scheduler cycle), ShopperSegment has no run marker at all. If
compute_and_persist_segments() is ever re-run for the same camera, old
rows stay in place and new ones get added alongside them - nothing
dedupes.

Fix here: all rows from one script run share a near-identical computed_at
(each ShopperSegment() call evaluates datetime.now(UTC) independently,
but all inserts happen in a single tight loop before one commit() - the
spread is milliseconds, not seconds). So "the latest run" = every row
within LATEST_RUN_WINDOW_SECONDS of the camera's most recent computed_at.
This is a heuristic, not a guarantee - flagging it here rather than
presenting it as exact.
"""

import uuid
from datetime import timedelta
from collections import Counter

from sqlmodel import Session, select

from app.core.db import engine
from app.models.shopper_segment import ShopperSegment

LATEST_RUN_WINDOW_SECONDS = 10


def get_segment_distribution(camera_id: uuid.UUID) -> dict:
    """
    Returns:
      {
        "segment_counts": [{"segment_label": str, "count": int}, ...],
        "dwell_time_buckets": [{"bucket": str, "count": int}, ...],
        "total_sessions": int,
      }
    Empty/zeroed structure (not an error) if no segments have been
    computed for this camera yet - compute_shopper_segments.py hasn't
    been run against it.
    """
    with Session(engine) as session:
        rows = session.exec(
            select(ShopperSegment)
            .where(ShopperSegment.camera_id == camera_id)
            .order_by(ShopperSegment.computed_at.desc())
        ).all()

    if not rows:
        return {"segment_counts": [], "dwell_time_buckets": [], "total_sessions": 0}

    latest_ts = rows[0].computed_at
    cutoff = latest_ts - timedelta(seconds=LATEST_RUN_WINDOW_SECONDS)
    latest_run_rows = [r for r in rows if r.computed_at >= cutoff]

    label_counts = Counter(r.segment_label for r in latest_run_rows)
    segment_counts = [{"segment_label": label, "count": count} for label, count in label_counts.items()]

    # Same buckets as the reference mockup's dwell-time-distribution donut
    # (0-10s / 10-30s / 30-60s / 60s+) - built from the same per-track
    # dwell_time_seconds ShopperSegment already stores, no new data needed.
    buckets = {"0-10s": 0, "10-30s": 0, "30-60s": 0, "60s+": 0}
    for r in latest_run_rows:
        d = r.dwell_time_seconds
        if d < 10:
            buckets["0-10s"] += 1
        elif d < 30:
            buckets["10-30s"] += 1
        elif d < 60:
            buckets["30-60s"] += 1
        else:
            buckets["60s+"] += 1
    dwell_time_buckets = [{"bucket": k, "count": v} for k, v in buckets.items()]

    return {
        "segment_counts": segment_counts,
        "dwell_time_buckets": dwell_time_buckets,
        "total_sessions": len(latest_run_rows),
    }
