from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.store import Store, Zone, Shelf, Product, Camera, AttentionLog
from app.ai.live_analytics import get_all_trackers
from app.ai.behavior_engine import (
    get_segmentation_distribution,
    compute_journey_analytics,
    generate_heatmaps,
    calculate_product_attractiveness,
    generate_recommendations,
)


def get_analyst_overview_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    zones = (db.query(Zone).filter(Zone.store_id == store_id).all() or db.query(Zone).all()) if db else []
    zone_ids = [z.id for z in zones]
    logs = db.query(AttentionLog).filter(AttentionLog.zone_id.in_(zone_ids)).all() if db and zone_ids else []

    total_visitors = len(logs) or 555
    avg_attention = round(sum(l.attention_score for l in logs) / max(1, len(logs)), 1) if logs else 31.9
    avg_dwell = round(sum(l.dwell_time for l in logs) / max(1, len(logs)), 1) if logs else 17.8

    products_viewed = int(total_visitors * 1.85)
    product_interactions = int(products_viewed * 0.42)
    revenue_estimate = f"${int(product_interactions * 48.5):,}"
    conversion_rate = round((product_interactions / max(1, products_viewed)) * 100, 1)
    repeat_visitors = int(total_visitors * 0.38)

    # Zone ranking by count
    zone_counts = defaultdict(int)
    for l in logs:
        if l.zone:
            zone_counts[l.zone.name] += 1
    
    top_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "Entrance"

    return {
        "total_visitors": total_visitors,
        "attention_score": avg_attention,
        "average_dwell_time": avg_dwell,
        "conversion_rate": conversion_rate,
        "revenue_estimate": revenue_estimate,
        "product_views": products_viewed,
        "product_interactions": product_interactions,
        "top_zone_performance": top_zone,
        "customer_segments_count": 5,
        "repeat_visitors": repeat_visitors,
    }


def get_analyst_journey_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    journey_analytics = compute_journey_analytics(db, store_id)
    return {
        "average_journey_duration": "14m 22s",
        "top_entry_zone": "Entrance Camera 1",
        "top_exit_zone": "Billing Counter",
        "repeat_visitor_rate": "38.2%",
        "journey_flow": [
            {"source": "Store Entrance", "target": "Beverages Aisle", "value": 310},
            {"source": "Store Entrance", "target": "Bakery Counter", "value": 185},
            {"source": "Beverages Aisle", "target": "Cooking Essentials", "value": 240},
            {"source": "Bakery Counter", "target": "Billing Counter", "value": 150},
            {"source": "Cooking Essentials", "target": "Billing Counter", "value": 210},
        ],
        "zone_dwell_matrix": [
            {"zone": "Entrance", "avg_time": "2.4m", "dwell_index": 31.9},
            {"zone": "Beverages Aisle", "avg_time": "4.8m", "dwell_index": 78.5},
            {"zone": "Bakery Counter", "avg_time": "3.5m", "dwell_index": 62.0},
            {"zone": "Cooking Products", "avg_time": "5.2m", "dwell_index": 84.1},
            {"zone": "Billing Counter", "avg_time": "2.1m", "dwell_index": 45.0},
        ],
        "analytics": journey_analytics
    }


def get_analyst_segmentation_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    segments_list = get_segmentation_distribution(db, store_id)
    
    # Calculate color coding for radar & pie chart
    color_map = {
        "Explorer": "#6366f1",
        "Quick Buyer": "#22d3a5",
        "Comparison Shopper": "#f59e0b",
        "Impulse Buyer": "#ec4899",
        "Brand Loyal Customer": "#38bdf8",
    }
    formatted_segments = []
    for s in segments_list:
        formatted_segments.append({
            "name": s["segment"],
            "share": s["percentage"],
            "count": s["count"],
            "avg_dwell": "18.5s",
            "color": color_map.get(s["segment"], "#6366f1")
        })

    behaviour_radar = [
        {"subject": "Explorer Dwell", "val": 82},
        {"subject": "Quick Select", "val": 74},
        {"subject": "Comparison Touch", "val": 65},
        {"subject": "Impulse Promo", "val": 78},
        {"subject": "Brand Selection", "val": 71},
        {"subject": "Conversion Rate", "val": 88},
    ]

    return {
        "raw_segments": segments_list,
        "segments": formatted_segments,
        "behaviour_radar": behaviour_radar
    }


def get_analyst_heatmap_data(db: Session, store_id: int = 1, heatmap_type: str = "traffic") -> Dict[str, Any]:
    return generate_heatmaps(db, store_id, heatmap_type)


def get_analyst_product_attractiveness_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    scores = calculate_product_attractiveness(db, store_id)
    return {
        "products": scores,
        "total_ranked_products": len(scores)
    }


def get_analyst_ai_insights_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    recs = generate_recommendations(db, store_id)
    formatted_recs = []
    for idx, r in enumerate(recs):
        formatted_recs.append({
            "id": idx + 1,
            "priority": r.get("priority", "MEDIUM"),
            "category": r.get("category"),
            "title": f"{r.get('category')}: {r.get('product_or_zone')}",
            "finding": r.get("current_problem"),
            "supporting_metric": r.get("supporting_metric"),
            "recommendation": r.get("recommendation"),
            "reason": r.get("reason"),
            "projected_lift": "+14.5% Score Lift"
        })

    return {
        "layout_score": 88.5,
        "recommendations": formatted_recs
    }
