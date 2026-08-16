"""
Thin wrapper around a single shared async Redis connection.

Used for two things:
1. Redis Streams (`XADD`/`XREADGROUP`) - the high-speed "waiting room" queue
   that raw tracking points land in before being batched into Postgres.
2. Redis Hashes - live per-zone occupancy counters, read directly by the
   /tracking/occupancy endpoint without ever touching Postgres, so the
   dashboard's "people in store right now" number is instant.
"""
import redis.asyncio as redis

from app.core.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


def stream_key(store_id: int) -> str:
    return f"tracking_stream:{store_id}"


def occupancy_key(store_id: int) -> str:
    return f"occupancy:{store_id}"


def overcrowding_flag_key(store_id: int) -> str:
    """Tracks whether a store is *currently* in an active overcrowding alert,
    so we fire the alert once on crossing the threshold rather than on every
    single tracking point while it stays over."""
    return f"overcrowding_active:{store_id}"


def consumer_group(store_id: int) -> str:
    return f"tracking_consumer_group:{store_id}"
