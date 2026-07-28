import asyncio
import json
import logging
from uuid import UUID
from datetime import datetime
import base64
import io
from PIL import Image
import sys
import os
import uuid

import redis.asyncio as aioredis
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.coordinate import TrackingCoordinate
# Assuming there is a tracking model to update store occupancy or similar
# from backend.app.models.tracking import AttentionEvent

# Add ml_engine to path for Inference API
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../ml_engine')))
try:
    from inference import AttentionInference
except ImportError:
    AttentionInference = None
    print("Warning: AttentionInference not found. Inference will be disabled.")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def process_stream():
    """
    Background worker that continuously pulls coordinates and frames from the Redis Stream
    and processes them into PostgreSQL.
    """
    logger.info(f"Starting ingestion worker with Redis URL: {settings.redis_url}")
    redis = aioredis.from_url(settings.redis_url)
    
    # Initialize ML Inference API
    inferencer = AttentionInference() if AttentionInference else None
    
    last_tracking_id = "0-0"
    last_frame_id = "0-0"
    
    batch_size = 50
    
    while True:
        try:
            streams = await redis.xread(
                {"tracking_stream": last_tracking_id, "frame_stream": last_frame_id}, 
                count=batch_size, block=1000
            )
            
            db: Session = SessionLocal()
            batch_objects = []
            
            for stream_name, messages in streams:
                for message_id, message_data in messages:
                    if stream_name == b"tracking_stream":
                        last_tracking_id = message_id
                        raw_data = message_data.get(b"data")
                        if raw_data:
                            try:
                                data = json.loads(raw_data.decode("utf-8"))
                                coord = TrackingCoordinate(
                                    store_id=UUID(data["store_id"]),
                                    camera_id=data["camera_id"],
                                    shopper_id=data["shopper_id"],
                                    x=data["x"],
                                    y=data["y"],
                                    timestamp=datetime.fromisoformat(data["timestamp"])
                                )
                                batch_objects.append(coord)
                            except Exception as e:
                                logger.error(f"Failed to parse tracking stream data: {e}")
                                
                    elif stream_name == b"frame_stream":
                        last_frame_id = message_id
                        raw_data = message_data.get(b"data")
                        if raw_data and inferencer:
                            try:
                                data = json.loads(raw_data.decode("utf-8"))
                                
                                # Decode base64 frame
                                image_data = base64.b64decode(data["frame_base64"])
                                image = Image.open(io.BytesIO(image_data)).convert("RGB")
                                
                                # Run inference
                                results = inferencer.predict(image)
                                logger.info(f"[Inference] Camera {data['camera_id']} - Crowd: {results['crowd_count']}, Retail: {len(results['retail_products'])} products")
                                
                                # Store insights into db if required, for now we log it.
                                # Example: Save a TrackingCoordinate for every person detected (mocked x,y)
                                # This allows the frontend heatmap to reflect ML predictions!
                                for i in range(results["crowd_count"]):
                                    coord = TrackingCoordinate(
                                        store_id=UUID(data["store_id"]),
                                        camera_id=data["camera_id"],
                                        shopper_id=f"ML_Detected_{uuid.uuid4().hex[:6]}",
                                        x=50.0, # Dummy coord for ML detection if exact coord isn't known
                                        y=50.0,
                                        timestamp=datetime.fromisoformat(data["timestamp"])
                                    )
                                    batch_objects.append(coord)
                                    
                            except Exception as e:
                                logger.error(f"Failed to process frame stream data: {e}")
            
            if batch_objects:
                try:
                    db.bulk_save_objects(batch_objects)
                    db.commit()
                    logger.info(f"Bulk inserted {len(batch_objects)} objects to database.")
                    
                    await redis.xtrim("tracking_stream", maxlen=10000, approximate=True)
                    await redis.xtrim("frame_stream", maxlen=1000, approximate=True)
                except Exception as e:
                    db.rollback()
                    logger.error(f"Database insertion failed: {e}")
            
            db.close()
            
            if not streams:
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Ingestion worker error: {e}")
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(process_stream())
