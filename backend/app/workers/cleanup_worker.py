import asyncio
import logging

from app.utils.logging import get_structured_logger

logger = get_structured_logger("cleanup_worker")

async def start_cleanup_worker():
    """
    Cleans up old video files, raw frame indexes, and expired reports
    """
    import os
    import time
    logger.info("Initializing Log Pruning & Storage Cleanup Node...")
    while True:
        try:
            reports_dir = "reports"
            if os.path.exists(reports_dir):
                now = time.time()
                for root, dirs, files in os.walk(reports_dir):
                    for f in files:
                        fp = os.path.join(root, f)
                        if os.stat(fp).st_mtime < now - 30 * 86400:
                            os.remove(fp)
                            logger.info(f"Pruned expired report: {f}")
        except Exception as e:
            logger.error(f"Error in cleanup worker: {e}")
            
        await asyncio.sleep(86400)
