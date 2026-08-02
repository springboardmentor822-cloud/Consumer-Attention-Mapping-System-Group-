"""
Redis client for the Step 5 ingest queue.

Detection/tracking code (PersonDetector.detect_source / ProductDetector.
detect_source) will push each frame's raw tracking output here via
push_tracking_event(). A separate background worker (not built yet - the
next piece after this) drains this stream in batches and writes to
TimescaleDB, so nothing writes to a database directly on every single
frame.

Uses Redis STREAMS specifically (XADD), not a plain list or pub/sub -
streams keep every event persistently until a consumer explicitly
acknowledges/trims it, so if the background worker crashes or restarts,
nothing pushed before that is lost. A plain list or pub/sub wouldn't give
you that durability guarantee, which matters here since this is meant to
be a "crash-proof" pipeline per the Milestone 2 doc's own wording.
"""

import json

import redis

from app.core.config import settings

# Single shared connection pool for the whole app process - redis-py
# handles pooling internally, so this doesn't need to be recreated per
# request/call the way get_session() recreates a DB Session each time.
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

TRACKING_STREAM_KEY = "tracking_events"


def push_tracking_event(event: dict) -> str:
    """
    Pushes one tracking event (one frame's detection/tracking output) onto
    the Redis stream. Returns the Redis-assigned entry ID.

    event is expected to look like the dicts PersonDetector/ProductDetector
    already yield, e.g.:
        {
            "frame_index": 5,
            "source_id": "<camera uuid>",
            "track_ids": [1.0, 2.0],
            "xyxy": [[...], [...]],
            "class_names": [...],   # ProductDetector only
        }

    Redis streams store flat field:value pairs, not nested JSON natively -
    so nested/list values (track_ids, xyxy, class_names) get JSON-encoded
    into single string fields here, and decoded back out by whatever reads
    the stream later (the background worker). uuid.UUID and numpy floats
    aren't natively JSON-serializable either, hence str()/float() coercion
    below rather than passing them through raw.
    """
    fields = {
        "frame_index": str(event.get("frame_index")),
        "source_id": str(event.get("source_id")),
        "track_ids": json.dumps([float(t) for t in event.get("track_ids", [])]),
        "xyxy": json.dumps(event.get("xyxy", [])),
        "class_names": json.dumps(event.get("class_names", [])),
    }
    return redis_client.xadd(TRACKING_STREAM_KEY, fields)
