import asyncio
import logging

from app.utils.logging import get_structured_logger

logger = get_structured_logger("notification_worker")

async def start_notification_worker():
    """
    Subscribes to notifications and prints system-level alerts
    """
    logger.info("Initializing Notification Push Worker Node...")
    from app.core.database import SessionLocal
    from app.models.notification import Notification
    
    while True:
        db = None
        try:
            db = SessionLocal()
            unreads = db.query(Notification).filter(Notification.is_read == False).all()
            for notif in unreads:
                logger.info(f"FORWARDING ALERT: [{notif.type}] {notif.message}")
                notif.is_read = True
            db.commit()
        except Exception as e:
            logger.error(f"Error in notification worker: {e}")
        finally:
            if db:
                db.close()
                
        await asyncio.sleep(10)
