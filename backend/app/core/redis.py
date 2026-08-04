import redis
import logging
from app.core.config import settings

logger = logging.getLogger("redis_wrapper")

class RedisWrapper:
    def __init__(self):
        try:
            self.client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.client.ping()
            self.is_connected = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis at {settings.REDIS_URL}: {e}. Running in Mock Redis mode.")
            self.client = None
            self.is_connected = False
            self.mock_store = {}

    def publish(self, channel: str, message: str):
        if self.is_connected:
            try:
                return self.client.publish(channel, message)
            except Exception as e:
                logger.error(f"Redis publish error: {e}")
        logger.info(f"[Mock Redis Publish] Channel: {channel}, Msg: {message}")
        return 1

    def xadd(self, stream_name: str, fields: dict):
        if self.is_connected:
            try:
                return self.client.xadd(stream_name, fields)
            except Exception as e:
                logger.error(f"Redis XADD error: {e}")
        logger.info(f"[Mock Redis XADD] Stream: {stream_name}, Fields: {fields}")
        return "mock-stream-id"

    def get_cache(self, key: str):
        if self.is_connected:
            try:
                return self.client.get(key)
            except Exception as e:
                logger.error(f"Redis get cache error: {e}")
        return self.mock_store.get(key)

    def set_cache(self, key: str, value: str, ex: int = None):
        if self.is_connected:
            try:
                return self.client.set(key, value, ex=ex)
            except Exception as e:
                logger.error(f"Redis set cache error: {e}")
        self.mock_store[key] = value
        return True

redis_client = RedisWrapper()
