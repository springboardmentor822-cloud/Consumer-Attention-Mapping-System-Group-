"""
Step 5 - Live WebSocket streaming leg.

This is the FastAPI-side counterpart to app/workers/timescale_writer.py's
broadcast_batch(). The worker runs in a SEPARATE process from this app (by
design - see that file's docstring), so it can't hold a direct reference
to whoever's connected here. Redis Pub/Sub bridges the two processes: the
worker publishes to the "live_tracking_events" channel after every
successful TimescaleDB write, and this endpoint subscribes to that same
channel and relays messages to whichever browsers are connected.

Uses redis.asyncio (a separate async client), not the sync redis_client
in app/core/redis_client.py - that sync client is fine for the worker's
blocking XREADGROUP loop, but this endpoint runs inside FastAPI's async
event loop and needs an async pub/sub listener so it doesn't block other
requests/connections while waiting for messages.

NOTE: this file is a standalone module (app/routers/live_tracking.py) -
you need to wire it into main.py yourself, same as the zones/cameras
routers were wired in earlier this session:

    from app.routers.live_tracking import router as live_tracking_router
    app.include_router(live_tracking_router)

Paste your current main.py if you want me to do that edit directly rather
than doing it by hand, given how the last few router-registration edits
went.
"""

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings

router = APIRouter()

LIVE_CHANNEL = "live_tracking_events"


@router.websocket("/ws/live-tracking")
async def live_tracking_ws(websocket: WebSocket) -> None:
    """
    One WebSocket connection = one Redis Pub/Sub subscription, both
    cleaned up together on disconnect. No camera/zone filtering here yet -
    every connected client receives every event from every camera. If you
    need per-zone dashboards later (Store Manager only caring about
    checkout lanes, say), filter client-side on `camera_id` for now, or
    tell me and I'll add a query-param filter here
    (e.g. /ws/live-tracking?camera_id=...) that only relays matching
    events - straightforward addition, just didn't want to guess you
    wanted it without asking.
    """
    await websocket.accept()

    redis_conn = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe(LIVE_CHANNEL)

    try:
        async for message in pubsub.listen():
            # pubsub.listen() also yields a "subscribe" confirmation
            # message before any real data - skip anything that isn't an
            # actual published message.
            if message["type"] != "message":
                continue
            await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        # Client closed the tab/connection - expected, not an error.
        pass
    finally:
        await pubsub.unsubscribe(LIVE_CHANNEL)
        await pubsub.close()
        await redis_conn.close()
