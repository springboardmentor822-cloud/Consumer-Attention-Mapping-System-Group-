import asyncio
import logging
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.tracking import CoordinateLog
from backend.app.services.spatial_engine import spatial_engine

logger = logging.getLogger(__name__)

BATCH_SIZE = 100
FLUSH_INTERVAL_SECONDS = 3.0

# In-memory queue to bypass Redis for the demo environment
coordinate_queue = asyncio.Queue()

async def db_worker_task():
    """
    Background worker that reads from the coordinate_queue,
    aggregates coordinates into a batch, bulk saves them to PostgreSQL,
    and passes them to the SpatialEngine for live tracking.
    """
    batch = []
    
    last_cleanup = datetime.now().timestamp()
    
    while True:
        try:
            timeout_occurred = False
            # Block for up to FLUSH_INTERVAL_SECONDS
            try:
                data = await asyncio.wait_for(coordinate_queue.get(), timeout=FLUSH_INTERVAL_SECONDS)
                
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
                coordinate_queue.task_done()
            except asyncio.TimeoutError:
                timeout_occurred = True # Timeout occurred, proceed to flush

            # If batch size reached or timeout occurred with items in batch, flush
            if len(batch) >= BATCH_SIZE or (batch and timeout_occurred):
                await flush_batch(batch)
                
                # After saving, pass batch to spatial engine for zone analytics
                await spatial_engine.process_batch(batch)
                batch = []
                
            # Periodically cleanup stale shoppers (every ~5 seconds)
            now_ts = datetime.now().timestamp()
            if now_ts - last_cleanup > 5.0:
                await spatial_engine.cleanup_stale_shoppers()
                last_cleanup = now_ts
                
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
