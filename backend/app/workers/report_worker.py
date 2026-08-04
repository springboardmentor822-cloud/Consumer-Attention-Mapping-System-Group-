import os
import csv
import json
import asyncio
import logging
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.store import Store
from app.services.analytics_service import AnalyticsService

from app.utils.logging import get_structured_logger

logger = get_structured_logger("report_worker")

def write_csv(filepath: str, data: list, headers: list):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in data:
            if isinstance(row, dict):
                writer.writerow([row.get(h, "") for h in headers])
            elif isinstance(row, (list, tuple)):
                writer.writerow(row)
            else:
                writer.writerow([row])

def write_json(filepath: str, data: any):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str)

def generate_daily_reports(db: Session, store_id: str, base_dir: str = "reports"):
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    daily_dir = os.path.join(base_dir, "daily")
    
    # 1. Traffic Report
    # Distinct shoppers today
    dwell_data = AnalyticsService.get_dwell_metrics(db, store_id)
    traffic_metrics = [{"metric": "total_sessions", "value": dwell_data.get("total_sessions", 0)}]
    write_json(os.path.join(daily_dir, f"{store_id}_traffic_{timestamp}.json"), traffic_metrics)
    write_csv(os.path.join(daily_dir, f"{store_id}_traffic_{timestamp}.csv"), traffic_metrics, ["metric", "value"])
    
    # 2. Dwell Report
    dwell_metrics = [
        {"metric": "average_duration_seconds", "value": dwell_data.get("average_duration_seconds", 0.0)},
        {"metric": "longest_session", "value": dwell_data.get("longest_session", 0.0)},
        {"metric": "shortest_session", "value": dwell_data.get("shortest_session", 0.0)}
    ]
    write_json(os.path.join(daily_dir, f"{store_id}_dwell_{timestamp}.json"), dwell_metrics)
    write_csv(os.path.join(daily_dir, f"{store_id}_dwell_{timestamp}.csv"), dwell_metrics, ["metric", "value"])
    
    # 3. Heatmap Summary
    heatmap_data = AnalyticsService.get_heatmap_metrics(db, store_id).get("points", [])
    write_json(os.path.join(daily_dir, f"{store_id}_heatmap_{timestamp}.json"), heatmap_data)
    write_csv(os.path.join(daily_dir, f"{store_id}_heatmap_{timestamp}.csv"), heatmap_data, ["zone_id", "x", "y", "attention_count", "average_attention_score", "intensity"])
    
    logger.info(f"Daily reports generated for store {store_id} at {daily_dir}")

def generate_weekly_reports(db: Session, store_id: str, base_dir: str = "reports"):
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    weekly_dir = os.path.join(base_dir, "weekly")
    
    # 1. Zone Performance
    zone_data = AnalyticsService.get_zone_metrics(db, store_id)
    write_json(os.path.join(weekly_dir, f"{store_id}_zone_performance_{timestamp}.json"), zone_data)
    write_csv(os.path.join(weekly_dir, f"{store_id}_zone_performance_{timestamp}.csv"), zone_data, ["zone_id", "zone_name", "zone_visits", "unique_sessions", "average_attention_score", "normalized_traffic", "zone_attractiveness_score"])
    
    # 2. Shopper Journeys
    journey_data = AnalyticsService.get_journey_metrics(db, store_id)
    write_json(os.path.join(weekly_dir, f"{store_id}_shopper_journeys_{timestamp}.json"), journey_data)
    write_csv(os.path.join(weekly_dir, f"{store_id}_shopper_journeys_{timestamp}.csv"), journey_data, ["source_zone", "target_zone", "transition_count"])
    
    # 3. Product Engagement
    product_data = AnalyticsService.get_product_metrics(db, store_id)
    write_json(os.path.join(weekly_dir, f"{store_id}_product_engagement_{timestamp}.json"), product_data)
    write_csv(os.path.join(weekly_dir, f"{store_id}_product_engagement_{timestamp}.csv"), product_data, ["product_id", "product_name", "views", "pickups", "compares", "returns", "purchases", "conversion_rate"])
    
    logger.info(f"Weekly reports generated for store {store_id} at {weekly_dir}")

async def start_report_worker(interval: float = 3600.0, base_dir: str = "reports", max_runs: int = -1):
    """
    Recurring scheduler to compile store performance reports.
    """
    logger.info("Initializing Marketing and Sales Report Compiler Node...")
    
    run_idx = 0
    while max_runs == -1 or run_idx < max_runs:
        run_idx += 1
        db = None
        try:
            db = SessionLocal()
            stores = db.query(Store).all()
            for store in stores:
                generate_daily_reports(db, store.id, base_dir)
                generate_weekly_reports(db, store.id, base_dir)
        except Exception as e:
            logger.error(f"Error in report generation loop: {e}")
        finally:
            if db:
                db.close()
                
        await asyncio.sleep(interval)
