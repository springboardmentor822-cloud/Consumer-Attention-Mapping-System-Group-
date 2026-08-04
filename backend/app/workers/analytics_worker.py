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
                # 1. Trigger product attractiveness score updates
                products = db.query(Product).filter(Product.store_id == store.id).all()
                for prod in products:
                    try:
                        update_product_attractiveness_score(db, prod.id)
                        execution_stats["updated_products"] += 1
                    except Exception as pe:
                        logger.error(f"Error updating product {prod.id} score: {pe}")
                
                # 2. Compute other metrics to verify execution
                AnalyticsService.get_heatmap_metrics(db, store.id)
                AnalyticsService.get_dwell_metrics(db, store.id)
                AnalyticsService.get_zone_metrics(db, store.id)
                AnalyticsService.get_journey_metrics(db, store.id)
            
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
