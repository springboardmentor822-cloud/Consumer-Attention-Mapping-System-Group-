import queue
import time
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("redis_client")

class MockRedisClient:
    """
    In-memory fallback that emulates basic Redis Streams and Key-Value behavior.
    Allows CAMS to function seamlessly without a running Redis instance.
    """
    def __init__(self):
        logger.warning("Using in-memory fallback for Redis (Redis server not found/connected).")
        self.kv_store: Dict[str, Any] = {}
        # Emulated streams: { stream_name: [ (timestamp_id, {fields}) ] }
        self.streams: Dict[str, List[tuple]] = {}
        # Mutex not strictly needed for Python GIL in basic lists/dicts, but good practice
        self.stream_counters: Dict[str, int] = {}

    def ping(self) -> bool:
        return True

    # --- Key-Value Operations ---
    def get(self, key: str) -> Optional[str]:
        val = self.kv_store.get(key)
        return str(val) if val is not None else None

    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        # Note: TTL expiration logic ignored for simplicity in simulation
        self.kv_store[key] = value
        return True

    def delete(self, *keys: str) -> int:
        count = 0
        for k in keys:
            if k in self.kv_store:
                del self.kv_store[k]
                count += 1
        return count

    def incrby(self, key: str, amount: int = 1) -> int:
        val = self.kv_store.get(key, 0)
        try:
            val = int(val)
        except ValueError:
            val = 0
        val += amount
        self.kv_store[key] = val
        return val

    # --- Hash Operations ---
    def hset(self, name: str, key: str = None, value: Any = None, mapping: dict = None) -> int:
        if name not in self.kv_store or not isinstance(self.kv_store[name], dict):
            self.kv_store[name] = {}
        
        count = 0
        if mapping:
            for k, v in mapping.items():
                self.kv_store[name][k] = str(v)
                count += 1
        elif key is not None:
            self.kv_store[name][key] = str(value)
            count = 1
        return count

    def hget(self, name: str, key: str) -> Optional[str]:
        hash_dict = self.kv_store.get(name)
        if hash_dict and isinstance(hash_dict, dict):
            val = hash_dict.get(key)
            return str(val) if val is not None else None
        return None

    def hgetall(self, name: str) -> Dict[str, str]:
        hash_dict = self.kv_store.get(name)
        if hash_dict and isinstance(hash_dict, dict):
            return {k: str(v) for k, v in hash_dict.items()}
        return {}

    def hdel(self, name: str, *keys: str) -> int:
        hash_dict = self.kv_store.get(name)
        count = 0
        if hash_dict and isinstance(hash_dict, dict):
            for k in keys:
                if k in hash_dict:
                    del hash_dict[k]
                    count += 1
        return count

    # --- Stream Operations ---
    def xadd(self, name: str, fields: dict, id: str = "*", maxlen: Optional[int] = None, approximate: bool = True) -> str:
        if name not in self.streams:
            self.streams[name] = []
            self.stream_counters[name] = 0

        # Generate stream ID: timestamp_ms-seq
        timestamp_ms = int(time.time() * 1000)
        seq = self.stream_counters[name]
        self.stream_counters[name] += 1
        msg_id = f"{timestamp_ms}-{seq}"

        # Clean/convert fields to string values (Redis behavior)
        cleaned_fields = {k: str(v) for k, v in fields.items()}
        self.streams[name].append((msg_id, cleaned_fields))

        # Enforce maxlen if specified to prevent memory leaks
        if maxlen and len(self.streams[name]) > maxlen:
            self.streams[name] = self.streams[name][-maxlen:]

        return msg_id

    def xread(self, streams: Dict[str, str], count: Optional[int] = None, block: Optional[int] = None) -> List[List[Any]]:
        """
        Emulates XREAD.
        streams format: { stream_name: last_read_id }
        Returns: [ [stream_name, [ (msg_id, {fields}) ]] ]
        """
        results = []
        start_time = time.time()

        while True:
            for stream_name, last_id in streams.items():
                stream_data = self.streams.get(stream_name, [])
                msgs = []
                
                # Compare stream IDs
                # last_id might be "0" or "0-0" or a timestamp-seq
                for msg_id, fields in stream_data:
                    if self._is_greater_id(msg_id, last_id):
                        msgs.append((msg_id, fields))

                if msgs:
                    if count:
                        msgs = msgs[:count]
                    results.append([stream_name, msgs])

            if results or not block:
                break

            # Block simulation (sleep brief moments and check again until block timeout)
            elapsed = (time.time() - start_time) * 1000
            if elapsed >= block:
                break
            time.sleep(0.05)

        return results

    def _is_greater_id(self, id1: str, id2: str) -> bool:
        if id2 == "0" or id2 == "$":
            return True
        try:
            t1, s1 = map(int, id1.split("-"))
            t2, s2 = map(int, id2.split("-"))
            if t1 > t2:
                return True
            elif t1 == t2:
                return s1 > s2
        except Exception:
            pass
        return True


class RedisWrapper:
    def __init__(self, host: str = "localhost", port: int = 6379):
        self.host = host
        self.port = port
        self.client = None
        self.is_mock = False
        self._initialize_client()

    def _initialize_client(self):
        try:
            import redis
            client = redis.Redis(host=self.host, port=self.port, decode_responses=True, socket_connect_timeout=1)
            # Try to ping the Redis server to verify connectivity
            client.ping()
            self.client = client
            self.is_mock = False
            logger.info("Connected to Redis server successfully on port %s", self.port)
        except Exception as e:
            logger.warning("Redis server connection failed: %s. Falling back to Mock Redis Client.", e)
            self.client = MockRedisClient()
            self.is_mock = True

    def get_client(self):
        return self.client

# Global Redis Client Wrapper
redis_wrapper = RedisWrapper()
redis_client = redis_wrapper.client
