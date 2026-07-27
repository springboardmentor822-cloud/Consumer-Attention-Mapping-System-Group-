"""Decoupled tracking ingestion, batched persistence, and live fan-out.

Redis Streams is used when it is configured and reachable. Local development
falls back to an asyncio queue so the API remains runnable without pretending
that the fallback has Redis durability.
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import WebSocket
from sqlalchemy import func

from app import database, models
from app.config import get_settings


def _utc_naive(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


class TrackingStreamBroker:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.backend = "memory"
        self.last_error: str | None = None
        self._queue: asyncio.Queue[tuple[str, dict[str, Any]]] = asyncio.Queue()
        self._redis: Any = None
        self._consumer = f"{socket.gethostname()}-{os.getpid()}"

    async def connect(self) -> None:
        try:
            from redis.asyncio import Redis

            client = Redis.from_url(self.settings.redis_url, decode_responses=True)
            await asyncio.wait_for(client.ping(), timeout=1.5)
            try:
                await client.xgroup_create(
                    self.settings.redis_stream_key,
                    self.settings.redis_consumer_group,
                    id="0",
                    mkstream=True,
                )
            except Exception as exc:
                if "BUSYGROUP" not in str(exc):
                    raise
            self._redis = client
            self.backend = "redis"
            self.last_error = None
        except Exception as exc:
            self.last_error = f"Redis unavailable; using non-durable memory queue: {exc}"
            self.backend = "memory"
            self._redis = None
            if not self.settings.allow_memory_stream_fallback:
                raise RuntimeError(self.last_error) from exc

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()
            self._redis = None

    async def publish(self, payload: dict[str, Any]) -> str:
        if self._redis is not None:
            message_id = await self._redis.xadd(
                self.settings.redis_stream_key,
                {"payload": json.dumps(payload, separators=(",", ":"))},
                maxlen=1_000_000,
                approximate=True,
            )
            tracker_key = f"attention:occupancy:{payload['store_id']}"
            await self._redis.hset(tracker_key, payload["tracker_id"], payload["observed_at"])
            await self._redis.expire(tracker_key, 300)
            return str(message_id)

        message_id = f"memory-{datetime.utcnow().timestamp():.6f}-{self._queue.qsize() + 1}"
        await self._queue.put((message_id, payload))
        return message_id

    async def read_batch(self, count: int, block_seconds: float) -> list[tuple[str, dict[str, Any]]]:
        if self._redis is not None:
            try:
                claimed = await self._redis.xautoclaim(
                    self.settings.redis_stream_key,
                    self.settings.redis_consumer_group,
                    self._consumer,
                    min_idle_time=30_000,
                    start_id="0-0",
                    count=count,
                )
                claimed_entries = claimed[1] if len(claimed) > 1 else []
                if claimed_entries:
                    return [
                        (str(message_id), json.loads(fields["payload"]))
                        for message_id, fields in claimed_entries
                    ]
            except Exception:
                # Older Redis versions may not support XAUTOCLAIM; new entries
                # still flow through XREADGROUP and remain unacknowledged on error.
                pass
            rows = await self._redis.xreadgroup(
                self.settings.redis_consumer_group,
                self._consumer,
                {self.settings.redis_stream_key: ">"},
                count=count,
                block=max(1, int(block_seconds * 1000)),
            )
            messages: list[tuple[str, dict[str, Any]]] = []
            for _, entries in rows:
                for message_id, fields in entries:
                    messages.append((str(message_id), json.loads(fields["payload"])))
            return messages

        try:
            first = await asyncio.wait_for(self._queue.get(), timeout=block_seconds)
        except TimeoutError:
            return []
        messages = [first]
        while len(messages) < count:
            try:
                messages.append(self._queue.get_nowait())
            except asyncio.QueueEmpty:
                break
        return messages

    async def acknowledge(self, message_ids: list[str]) -> None:
        if not message_ids:
            return
        if self._redis is not None:
            await self._redis.xack(
                self.settings.redis_stream_key,
                self.settings.redis_consumer_group,
                *message_ids,
            )
        else:
            for _ in message_ids:
                self._queue.task_done()

    async def pending_count(self) -> int:
        if self._redis is not None:
            try:
                info = await self._redis.xpending(
                    self.settings.redis_stream_key,
                    self.settings.redis_consumer_group,
                )
                pending = int(info.get("pending", 0) if isinstance(info, dict) else info[0])
                groups = await self._redis.xinfo_groups(self.settings.redis_stream_key)
                group = next(
                    (item for item in groups if item.get("name") == self.settings.redis_consumer_group),
                    {},
                )
                return pending + int(group.get("lag") or 0)
            except Exception:
                return 0
        return self._queue.qsize()


class TrackingStreamRuntime:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.broker = TrackingStreamBroker()
        self.worker_task: asyncio.Task | None = None
        self.connections: dict[int, set[WebSocket]] = defaultdict(set)
        self.last_error: str | None = None
        self.persisted_total = 0
        self._recent_trackers: dict[int, dict[str, datetime]] = defaultdict(dict)
        self._recent_zone_trackers: dict[int, dict[int, dict[str, datetime]]] = defaultdict(
            lambda: defaultdict(dict)
        )
        self._checkout_zones: dict[int, set[int]] = defaultdict(set)
        self._checkout_alerts: set[tuple[int, int]] = set()

    async def start(self) -> None:
        if self.worker_task is not None and not self.worker_task.done():
            return
        await self.broker.connect()
        self._load_checkout_zones()
        self.worker_task = asyncio.create_task(self._worker_loop(), name="tracking-stream-worker")

    async def stop(self) -> None:
        if self.worker_task is not None:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
            self.worker_task = None
        await self.broker.close()

    async def publish(self, payload: dict[str, Any]) -> str:
        payload.setdefault("id", str(uuid4()))
        message_id = await self.broker.publish(payload)
        observed_at = _utc_naive(payload["observed_at"])
        store_id = int(payload["store_id"])
        self._recent_trackers[store_id][payload["tracker_id"]] = observed_at
        zone_id = payload.get("zone_id")
        if zone_id is not None:
            zone_id = int(zone_id)
            self._recent_zone_trackers[store_id][zone_id][payload["tracker_id"]] = observed_at
        await self.broadcast(store_id, {"type": "tracking", "data": payload})
        if zone_id is not None and zone_id in self._checkout_zones.get(store_id, set()):
            queue_length = self.zone_occupancy(store_id, zone_id)
            alert_key = (store_id, zone_id)
            if queue_length >= self.settings.checkout_queue_threshold and alert_key not in self._checkout_alerts:
                self._checkout_alerts.add(alert_key)
                await self.broadcast(
                    store_id,
                    {
                        "type": "checkout_overcrowding",
                        "zone_id": zone_id,
                        "queue_length": queue_length,
                        "threshold": self.settings.checkout_queue_threshold,
                        "overcrowded": True,
                    },
                )
            elif queue_length < self.settings.checkout_queue_threshold and alert_key in self._checkout_alerts:
                self._checkout_alerts.discard(alert_key)
                await self.broadcast(
                    store_id,
                    {
                        "type": "checkout_overcrowding_cleared",
                        "zone_id": zone_id,
                        "queue_length": queue_length,
                        "threshold": self.settings.checkout_queue_threshold,
                        "overcrowded": False,
                    },
                )
        return message_id

    async def connect_websocket(self, store_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[store_id].add(websocket)
        await websocket.send_json(
            {
                "type": "connected",
                "store_id": store_id,
                "stream_backend": self.broker.backend,
                "occupancy": self.occupancy(store_id),
            }
        )

    def disconnect_websocket(self, store_id: int, websocket: WebSocket) -> None:
        self.connections[store_id].discard(websocket)
        if not self.connections[store_id]:
            self.connections.pop(store_id, None)

    async def broadcast(self, store_id: int, message: dict[str, Any]) -> None:
        dead: list[WebSocket] = []
        enriched = {**message, "occupancy": self.occupancy(store_id)}
        for websocket in list(self.connections.get(store_id, ())):
            try:
                await websocket.send_json(enriched)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect_websocket(store_id, websocket)

    def occupancy(self, store_id: int, active_seconds: int = 30) -> int:
        cutoff = datetime.utcnow() - timedelta(seconds=active_seconds)
        recent = self._recent_trackers[store_id]
        stale = [tracker_id for tracker_id, seen_at in recent.items() if seen_at < cutoff]
        for tracker_id in stale:
            recent.pop(tracker_id, None)
        return len(recent)

    def zone_occupancy(self, store_id: int, zone_id: int, active_seconds: int = 30) -> int:
        cutoff = datetime.utcnow() - timedelta(seconds=active_seconds)
        recent = self._recent_zone_trackers[store_id][zone_id]
        stale = [tracker_id for tracker_id, seen_at in recent.items() if seen_at < cutoff]
        for tracker_id in stale:
            recent.pop(tracker_id, None)
        return len(recent)

    def _load_checkout_zones(self) -> None:
        with database.SessionLocal() as db:
            for zone in db.query(models.Zone).all():
                label = f"{zone.name} {zone.category_focus}".lower()
                if "checkout" in label or "queue" in label:
                    self._checkout_zones[zone.store_id].add(zone.id)

    async def _worker_loop(self) -> None:
        while True:
            try:
                messages = await self.broker.read_batch(
                    self.settings.tracking_batch_size,
                    self.settings.tracking_flush_seconds,
                )
                if not messages:
                    continue
                await asyncio.to_thread(self._persist_batch, [payload for _, payload in messages])
                await self.broker.acknowledge([message_id for message_id, _ in messages])
                self.persisted_total += len(messages)
                self.last_error = None
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                self.last_error = str(exc)
                await asyncio.sleep(0.5)

    @staticmethod
    def _persist_batch(payloads: list[dict[str, Any]]) -> None:
        values = []
        for payload in payloads:
            row = dict(payload)
            row["observed_at"] = _utc_naive(row["observed_at"])
            values.append(row)
        with database.SessionLocal() as db:
            if db.bind.dialect.name == "postgresql":
                from sqlalchemy.dialects.postgresql import insert

                statement = insert(models.TrackingObservation).values(values)
                statement = statement.on_conflict_do_nothing(index_elements=["id", "observed_at"])
                db.execute(statement)
            elif db.bind.dialect.name == "sqlite":
                from sqlalchemy.dialects.sqlite import insert

                statement = insert(models.TrackingObservation).values(values)
                statement = statement.on_conflict_do_nothing(index_elements=["id", "observed_at"])
                db.execute(statement)
            else:
                db.add_all(models.TrackingObservation(**row) for row in values)
            db.commit()

    async def status(self, store_id: int) -> dict[str, Any]:
        with database.SessionLocal() as db:
            persisted = (
                db.query(func.count(models.TrackingObservation.id))
                .filter(models.TrackingObservation.store_id == store_id)
                .scalar()
            )
        return {
            "store_id": store_id,
            "backend": self.broker.backend,
            "pending_messages": await self.broker.pending_count(),
            "persisted_observations": int(persisted or 0),
            "connected_clients": len(self.connections.get(store_id, ())),
            "worker_running": self.worker_task is not None and not self.worker_task.done(),
            "last_error": self.last_error or self.broker.last_error,
        }


tracking_stream = TrackingStreamRuntime()
