import asyncio
import logging
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.store import Store
from app.models.product import Product
from app.services.analytics_service import AnalyticsService
from app.ml.scoring import update_product_attractiveness_score

from app.utils.logging import get_structured_logger
from app.ml.models.segmentation_kmeans import KMeansShopperSegmenter

logger = get_structured_logger("analytics_worker")

# Execution statistics tracking (useful for tests and monitoring)
execution_stats = {
    "run_count": 0,
    "success_count": 0,
    "error_count": 0,
    "last_run_time": None,
    "last_error": None,
    "processed_stores": 0,
    "updated_products": 0
}

# Global lock and session tracking to prevent overlapping CPU tasks and redundant training
_kmeans_lock = asyncio.Lock()
_last_session_count = -1

def run_kmeans_training():
    """
    Runs K-Means training synchronously in a background thread with its own database session.
    """
    from app.models.session import Session as ShopperSession
    db = SessionLocal()
    try:
        current_count = db.query(ShopperSession).count()
        global _last_session_count
        if current_count == _last_session_count:
            logger.info("Session count unchanged. Skipping K-Means retraining.")
            return
            
        logger.info(f"Retraining K-Means model on {current_count} sessions...")
        segmenter = KMeansShopperSegmenter()
        res = segmenter.fit_and_profile(db)
        _last_session_count = current_count
        logger.info(f"K-Means clustering completed. Usable sessions: {res['usable_sessions']}")
    except Exception as kme:
        logger.error(f"Error executing K-Means segmentation in background thread: {kme}")
    finally:
        db.close()

def compile_store_analytics(store_id: str):
    """
    Computes store-specific product attractiveness scores and metrics in a background thread.
    """
    db = SessionLocal()
    try:
        # 1. Trigger product attractiveness score updates
        products = db.query(Product).filter(Product.store_id == store_id).all()
        for prod in products:
            try:
                update_product_attractiveness_score(db, prod.id, commit=False)
                execution_stats["updated_products"] += 1
            except Exception as pe:
                logger.error(f"Error updating product {prod.id} score: {pe}")
        db.commit()
        
        # 2. Compute other metrics to verify execution/cache prep
        AnalyticsService.get_heatmap_metrics(db, store_id)
        AnalyticsService.get_dwell_metrics(db, store_id)
        AnalyticsService.get_zone_metrics(db, store_id)
        AnalyticsService.get_journey_metrics(db, store_id)
    except Exception as e:
        logger.error(f"Error compiling store {store_id} analytics in background thread: {e}")
    finally:
        db.close()

async def start_analytics_worker(interval: float = 5.0, max_runs: int = -1):
    """
    Computes heatmaps, user segments, and attractiveness scores at periodic intervals.
    - interval: sleep duration between runs
    - max_runs: limit runs for testing (use -1 for infinite loop)
    """
    logger.info("Initializing Near-Real-Time Analytics Compiler Node...")
    
    run_idx = 0
    while max_runs == -1 or run_idx < max_runs:
        run_idx += 1
        db: Session = None
        try:
            execution_stats["run_count"] += 1
            db = SessionLocal()
            
            # Fetch all stores
            stores = db.query(Store).all()
            execution_stats["processed_stores"] = len(stores)
            execution_stats["updated_products"] = 0
            
            for store in stores:
                # Offload CPU/IO-heavy store metrics and product scoring to thread pool
                await asyncio.to_thread(compile_store_analytics, store.id)

                # Retrain and update K-Means shopper segments in a background thread
                if _kmeans_lock.locked():
                    logger.warning("K-Means training already in progress. Skipping this iteration.")
                else:
                    async def run_in_background():
                        async with _kmeans_lock:
                            await asyncio.to_thread(run_kmeans_training)
                    asyncio.create_task(run_in_background())
            
            execution_stats["success_count"] += 1
            execution_stats["last_run_time"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            logger.info(f"Analytics compile run {run_idx} finished successfully. Processed {len(stores)} stores.")
            
        except Exception as e:
            execution_stats["error_count"] += 1
            execution_stats["last_error"] = str(e)
            logger.error(f"Error in analytics compile run {run_idx}: {e}")
        finally:
            if db:
                db.close()
                
        await asyncio.sleep(interval)
