import json
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active WebSocket connections per store for live dashboard pushes
    (e.g. new tracking points, new notifications, camera status changes)."""

    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, store_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(store_id, []).append(websocket)

    def disconnect(self, store_id: int, websocket: WebSocket) -> None:
        if store_id in self.active_connections:
            self.active_connections[store_id] = [
                ws for ws in self.active_connections[store_id] if ws is not websocket
            ]

    async def broadcast(self, store_id: int, message: dict[str, Any]) -> None:
        for ws in self.active_connections.get(store_id, []):
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:  # noqa: BLE001
                continue


manager = ConnectionManager()
