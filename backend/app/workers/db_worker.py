import asyncio
import json
import logging
from datetime import datetime
from uuid import UUID
import redis.asyncio as aioredis
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.tracking import CoordinateLog

logger = logging.getLogger(__name__)

BATCH_SIZE = 100
FLUSH_INTERVAL_SECONDS = 3.0

async def db_worker_task():
    """
    Background worker that reads from Redis 'tracking_stream',
    aggregates coordinates into a batch, and bulk saves them to PostgreSQL (TimescaleDB).
    """
    redis_client = aioredis.from_url(settings.redis_url)
    last_id = "0"  # Read from beginning of unacknowledged, or "$" for new
    
    batch = []
    
    while True:
        try:
            # Block for up to FLUSH_INTERVAL_SECONDS
            streams = await redis_client.xread(
                {"tracking_stream": last_id}, 
                count=BATCH_SIZE, 
                block=int(FLUSH_INTERVAL_SECONDS * 1000)
            )
            
            if not streams:
                # Timeout occurred, flush any existing batch
                if batch:
                    await flush_batch(batch)
                    batch = []
                continue

            for stream, messages in streams:
                for message_id, message_data in messages:
                    last_id = message_id
                    raw_data = message_data.get(b"data")
                    if raw_data:
                        try:
                            data = json.loads(raw_data.decode("utf-8"))
                            
                            # Parse timestamp string to datetime
                            try:
                                timestamp_obj = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
                            except ValueError:
                                timestamp_obj = datetime.now()
                            
                            log_entry = CoordinateLog(
                                store_id=UUID(data["store_id"]),
                                camera_id=data["camera_id"],
                                shopper_id=data["shopper_id"],
                                x=float(data["x"]),
                                y=float(data["y"]),
                                timestamp=timestamp_obj
                            )
                            batch.append(log_entry)
                        except Exception as parse_err:
                            logger.error(f"Error parsing message {message_id}: {parse_err}")
                    
                    # Delete message from stream to prevent memory bloat
                    await redis_client.xdel("tracking_stream", message_id)
            
            # If batch size reached, flush
            if len(batch) >= BATCH_SIZE:
                await flush_batch(batch)
                batch = []
                
        except asyncio.CancelledError:
            # Shutdown signal received
            if batch:
                await flush_batch(batch)
            break
        except Exception as e:
            logger.error(f"Error in db_worker: {e}")
            await asyncio.sleep(1)

async def flush_batch(batch):
    if not batch:
        return
        
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, sync_flush, batch)

def sync_flush(batch):
    db: Session = SessionLocal()
    try:
        db.bulk_save_objects(batch)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error bulk saving coordinates: {e}")
    finally:
        db.close()
