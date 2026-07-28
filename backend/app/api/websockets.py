import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

from backend.app.core.config import settings


router = APIRouter(prefix="/ws", tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # map of store_id -> list of active connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, store_id: str):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)

    def disconnect(self, websocket: WebSocket, store_id: str):
        if store_id in self.active_connections:
            self.active_connections[store_id].remove(websocket)
            if not self.active_connections[store_id]:
                del self.active_connections[store_id]

    async def broadcast_to_store(self, message: str, store_id: str):
        if store_id in self.active_connections:
            for connection in self.active_connections[store_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Ignore failing connections (e.g., client closed abruptly)
                    pass


manager = ConnectionManager()

# Background task to listen to Redis and push to WebSockets
async def listen_to_redis_stream():
    redis = aioredis.from_url(settings.redis_url)
    last_id = "$"  # Only listen to new messages
    while True:
        try:
            # XREAD with block=1000ms
            streams = await redis.xread({"tracking_stream": last_id}, count=100, block=1000)
            for stream, messages in streams:
                for message_id, message_data in messages:
                    last_id = message_id
                    raw_data = message_data.get(b"data")
                    if raw_data:
                        data = json.loads(raw_data.decode("utf-8"))
                        store_id = data.get("store_id")
                        if store_id:
                            await manager.broadcast_to_store(json.dumps(data), store_id)
        except Exception as e:
            await asyncio.sleep(1)


@router.websocket("/tracking/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: UUID):
    store_id_str = str(store_id)
    await manager.connect(websocket, store_id_str)
    try:
        while True:
            # We don't expect the client to send much, but we must read to keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, store_id_str)
