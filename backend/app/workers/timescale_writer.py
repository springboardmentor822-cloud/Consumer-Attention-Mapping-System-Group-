"""
Standalone background worker - Step 5 (decoupled ingestion), Redis -> TimescaleDB leg.

Run as its OWN process, separate from uvicorn:
    python -m app.workers.timescale_writer

Deliberately not a FastAPI background task - `uvicorn --reload` restarts the
app process on every code change, which would kill/restart this worker
constantly during dev and make crash-recovery indistinguishable from normal
dev iteration. Running it standalone also matches how this would actually
deploy (a separate worker process/container next to the API process).

Design decisions locked in for this worker:
  1. Redis CONSUMER GROUPS (XREADGROUP / XACK), not plain XREAD - this is
     what makes the pipeline actually crash-proof. A stream entry is only
     ACKed after every TrackingEvent row derived from it has been
     successfully written to TimescaleDB. If this process dies mid-batch,
     the unacked entries stay in the group's Pending Entries List (PEL)
     and get reclaimed on the next startup instead of being silently lost.
  2. Batch flush trigger is COUNT-OR-TIMEOUT: flush at 100 TrackingEvent
     ROWS (not 100 stream entries - see below), or every 2 seconds,
     whichever comes first.
  3. Runs forever in a loop until killed (Ctrl+C), matching a real deployed
     worker process rather than a run-once script.

IMPORTANT - one stream entry fans out into MULTIPLE rows:
push_tracking_event() (app/core/redis_client.py) pushes ONE Redis entry per
FRAME, and that entry's fields are JSON-encoded LISTS - track_ids, xyxy,
class_names - one item per tracked object detected in that frame. So a
single stream entry with 5 tracked objects must become 5 separate
TrackingEvent rows here, not 1. class_names is [] for PersonDetector
frames (person has no class distinction) and populated, index-matched
against track_ids, for ProductDetector frames.

Also note: the pushed event has NO event_time field and NO camera_id field
- it's called source_id in the pushed dict. event_time is set HERE, at
persistence time (per TrackingEvent's own docstring - that's the axis
TimescaleDB queries against, not whenever the frame was originally
processed).

Confirmed against actual project files:
  - STREAM_NAME "tracking_events" matches TRACKING_STREAM_KEY in
    redis_client.py.
  - settings.REDIS_URL / settings.TIMESCALE_DATABASE_URL both confirmed
    real (used identically in redis_client.py and timescale_db.py).
  - timescale_engine (timescale_db.py) is a plain sync SQLModel/SQLAlchemy
    engine via create_engine() - this worker's sync Session usage is
    correct, no async adjustment needed.
"""

import json
import time
import uuid
from datetime import datetime, UTC

import redis
from sqlmodel import Session

from app.core.config import settings
from app.core.timescale_db import timescale_engine
from app.models.tracking_event import TrackingEvent

STREAM_NAME = "tracking_events"
GROUP_NAME = "timescale_writer_group"
CONSUMER_NAME = "timescale_writer_1"  # bump this if you ever run >1 worker

BATCH_SIZE = 100          # counts TrackingEvent ROWS, not raw stream entries
FLUSH_INTERVAL_SECONDS = 2.0
READ_COUNT = 50           # how many raw stream ENTRIES (frames) to pull per XREADGROUP call
BLOCK_MS = 500             # how long a single XREADGROUP call waits for new entries


def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def ensure_consumer_group(r: redis.Redis) -> None:
    """
    Create the consumer group if it doesn't exist yet. mkstream=True so this
    also creates the stream itself if nothing has ever been pushed to it -
    without that flag, XGROUP CREATE fails on a stream that doesn't exist.
    """
    try:
        r.xgroup_create(STREAM_NAME, GROUP_NAME, id="0", mkstream=True)
        print(f"Created consumer group '{GROUP_NAME}' on stream '{STREAM_NAME}'")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            # Group already exists from a previous run - expected on restart.
            pass
        else:
            raise


def parse_stream_entry(entry_id: str, fields: dict) -> list[TrackingEvent]:
    """
    One Redis stream entry = one frame = potentially MULTIPLE tracked
    objects. Fan out into one TrackingEvent per tracked object.
    """
    track_ids = json.loads(fields.get("track_ids", "[]"))
    xyxy = json.loads(fields.get("xyxy", "[]"))
    class_names = json.loads(fields.get("class_names", "[]"))
    source_id = fields.get("source_id")
    frame_index = int(fields.get("frame_index", 0))

    if len(track_ids) != len(xyxy):
        # Defensive: if these ever disagree in length, something upstream
        # is broken (a detector emitting mismatched lists) - skip this
        # entry rather than guess at pairing indices wrong, and log it
        # loudly so it doesn't fail silently.
        print(
            f"WARNING: entry {entry_id} has {len(track_ids)} track_ids but "
            f"{len(xyxy)} boxes - skipping this frame's events."
        )
        return []

    events: list[TrackingEvent] = []
    now = datetime.now(UTC)
    for i, (track_id, box) in enumerate(zip(track_ids, xyxy)):
        x1, y1, x2, y2 = box
        class_name = class_names[i] if i < len(class_names) else None
        events.append(
            TrackingEvent(
                id=uuid.uuid4(),
                event_time=now,
                camera_id=source_id,
                frame_index=frame_index,
                track_id=float(track_id),
                x1=float(x1),
                y1=float(y1),
                x2=float(x2),
                y2=float(y2),
                class_name=class_name,
            )
        )
    return events


LIVE_CHANNEL = "live_tracking_events"


def broadcast_batch(events: list[TrackingEvent], r: redis.Redis) -> None:
    """
    Publish this batch to a Redis Pub/Sub channel so the FastAPI process
    (a SEPARATE process from this worker - see module docstring) can
    forward it to connected WebSocket clients without needing any direct
    reference into this worker's memory.

    Deliberately Pub/Sub, not Streams: this is fire-and-forget live-view
    data, not something that needs durability/replay/crash-recovery like
    the ingest queue does. If no browser is connected when this publishes,
    the message is simply dropped - that's fine here, a live dashboard
    doesn't need to catch up on history it wasn't open to see.

    Publishes one message per event rather than the whole batch as one
    blob, so the frontend can render points as they "arrive" rather than
    getting one big lump every 2 seconds - closer to the "zero delay" live
    feel the Milestone 2 doc asks for.
    """
    for event in events:
        payload = json.dumps(
            {
                "camera_id": event.camera_id,
                "frame_index": event.frame_index,
                "track_id": event.track_id,
                "x1": event.x1,
                "y1": event.y1,
                "x2": event.x2,
                "y2": event.y2,
                "class_name": event.class_name,
                "event_time": event.event_time.isoformat(),
            }
        )
        r.publish(LIVE_CHANNEL, payload)


def flush_batch(entry_ids: list[str], events: list[TrackingEvent], r: redis.Redis) -> None:
    """
    Bulk-write every TrackingEvent row to TimescaleDB, then ACK the
    underlying stream ENTRIES (frames) - not the individual rows, since
    ACK operates on stream entry IDs. If the insert raises, we deliberately
    do NOT ack - those entries stay pending and get retried on next startup.

    Broadcast to the live WebSocket channel happens AFTER the commit
    succeeds, not before and not in parallel - so nothing gets pushed to a
    live dashboard that isn't actually durably persisted yet. If the write
    fails, we return before broadcasting (same early-return the ack was
    already skipping in that case).
    """
    if not events:
        return

    with Session(timescale_engine, expire_on_commit=False) as session:
        session.add_all(events)
        session.commit()

    if entry_ids:
        r.xack(STREAM_NAME, GROUP_NAME, *entry_ids)

    broadcast_batch(events, r)

    print(f"Flushed {len(events)} rows (from {len(entry_ids)} frames) to TimescaleDB, ACKed, and broadcast.")


def claim_pending_on_startup(r: redis.Redis) -> tuple[list[str], list[TrackingEvent]]:
    """
    On startup, check for stream entries that were read by a previous run
    of this worker but never ACKed (e.g. killed mid-batch). Claim and
    re-parse them first, before reading any new entries. This is the
    actual crash-recovery step - without this, consumer groups only
    prevent loss, they don't automatically retry.
    """
    entry_ids: list[str] = []
    events: list[TrackingEvent] = []

    pending = r.xpending_range(STREAM_NAME, GROUP_NAME, min="-", max="+", count=READ_COUNT)
    if not pending:
        return entry_ids, events

    pending_ids = [p["message_id"] for p in pending]
    claimed = r.xclaim(STREAM_NAME, GROUP_NAME, CONSUMER_NAME, min_idle_time=0, message_ids=pending_ids)
    for entry_id, fields in claimed:
        entry_ids.append(entry_id)
        events.extend(parse_stream_entry(entry_id, fields))

    if entry_ids:
        print(f"Recovered {len(entry_ids)} unacked frames ({len(events)} rows) from a previous run.")
    return entry_ids, events


def run_worker() -> None:
    r = get_redis_client()
    ensure_consumer_group(r)

    pending_entry_ids, pending_events = claim_pending_on_startup(r)
    batch_entry_ids: list[str] = pending_entry_ids
    batch_events: list[TrackingEvent] = pending_events
    last_flush = time.monotonic()

    print("Worker started. Waiting for events... (Ctrl+C to stop)")

    try:
        while True:
            # Flush on timeout even if we haven't hit BATCH_SIZE rows yet.
            if batch_events and (time.monotonic() - last_flush) >= FLUSH_INTERVAL_SECONDS:
                flush_batch(batch_entry_ids, batch_events, r)
                batch_entry_ids, batch_events = [], []
                last_flush = time.monotonic()

            response = r.xreadgroup(
                GROUP_NAME,
                CONSUMER_NAME,
                {STREAM_NAME: ">"},
                count=READ_COUNT,
                block=BLOCK_MS,
            )

            if response:
                for _stream_name, entries in response:
                    for entry_id, fields in entries:
                        new_events = parse_stream_entry(entry_id, fields)
                        batch_entry_ids.append(entry_id)
                        batch_events.extend(new_events)

            if len(batch_events) >= BATCH_SIZE:
                flush_batch(batch_entry_ids, batch_events, r)
                batch_entry_ids, batch_events = [], []
                last_flush = time.monotonic()

    except KeyboardInterrupt:
        print("\nShutting down. Flushing any remaining events...")
        if batch_events:
            flush_batch(batch_entry_ids, batch_events, r)
        print("Done.")


if __name__ == "__main__":
    run_worker()
