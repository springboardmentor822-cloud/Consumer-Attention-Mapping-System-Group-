"""
Tracking stream consumer.

This is the "decoupled ingestion" piece from the brief: a separate
background worker drains the Redis Stream that the (simulated or real)
tracker pipeline writes to, batches the raw points, and bulk-inserts them
into `tracking_data` every couple of seconds instead of hitting Postgres
once per point - exactly the problem the brief describes at 30fps with
many shoppers tracked at once.

Each point is also broadcast immediately over the existing WebSocket
connection manager (see app/core/websocket_manager.py, and the
`/ws/stores/{store_id}` route in main.py) so the dashboard updates in real
time without polling the database.
"""
import asyncio
import datetime as dt
import logging

from app.core.redis_client import get_redis, stream_key
from app.core.websocket_manager import manager
from app.database import SessionLocal
from app.models.tracking import TrackingData

logger = logging.getLogger("tracking_consumer")

BATCH_MAX_SIZE = 50
BATCH_MAX_WAIT_SECONDS = 2.0
BLOCK_MS = 1000


def _parse_point(fields: dict) -> dict:
    return {
        "session_id": int(fields["session_id"]),
        "camera_id": int(fields["camera_id"]),
        "zone_id": int(fields["zone_id"]) if fields.get("zone_id") not in (None, "", "None") else None,
        "track_id": int(fields["track_id"]),
        "timestamp": dt.datetime.fromisoformat(fields["timestamp"]),
        "bbox_x": float(fields["bbox_x"]),
        "bbox_y": float(fields["bbox_y"]),
        "bbox_w": float(fields["bbox_w"]),
        "bbox_h": float(fields["bbox_h"]),
        "detection_confidence": float(fields["detection_confidence"]),
        "floor_x": float(fields["floor_x"]),
        "floor_y": float(fields["floor_y"]),
    }


async def consumer_loop(store_id: int) -> None:
    r = get_redis()
    key = stream_key(store_id)
    last_id = "$"  # only new messages from the moment we start (avoid replaying old demo data)

    logger.info("Started tracking consumer for store %d", store_id)
    try:
        while True:
            batch: list[dict] = []
            raw_batch: list[dict] = []
            deadline = asyncio.get_event_loop().time() + BATCH_MAX_WAIT_SECONDS

            while len(batch) < BATCH_MAX_SIZE and asyncio.get_event_loop().time() < deadline:
                remaining_ms = max(50, int((deadline - asyncio.get_event_loop().time()) * 1000))
                result = await r.xread({key: last_id}, count=BATCH_MAX_SIZE - len(batch), block=min(remaining_ms, BLOCK_MS))
                if not result:
                    continue
                for _stream, messages in result:
                    for msg_id, fields in messages:
                        last_id = msg_id
                        try:
                            batch.append(_parse_point(fields))
                            raw_batch.append({**fields, "zone_index": int(fields.get("zone_index", 0))})
                        except (KeyError, ValueError):
                            logger.warning("Dropped malformed tracking point: %s", fields)

            if batch:
                db = SessionLocal()
                try:
                    db.bulk_insert_mappings(TrackingData, batch)
                    db.commit()
                except Exception:  # noqa: BLE001
                    logger.exception("Failed to bulk-insert tracking batch for store %d", store_id)
                    db.rollback()
                finally:
                    db.close()

                await manager.broadcast(
                    store_id,
                    {
                        "type": "tracking_batch",
                        "store_id": store_id,
                        "count": len(raw_batch),
                        "points": raw_batch,
                    },
                )
    except asyncio.CancelledError:
        logger.info("Stopped tracking consumer for store %d", store_id)
        raise
