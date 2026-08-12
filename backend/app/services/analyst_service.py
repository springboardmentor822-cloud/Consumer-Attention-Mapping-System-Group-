from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.store import Store, Zone, Shelf, Product, Camera, AttentionLog
from app.ai.live_analytics import get_all_trackers


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
        "customer_segments_count": 4,
        "repeat_visitors": repeat_visitors,
    }


def get_analyst_journey_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
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
        ]
    }


def get_analyst_segmentation_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    return {
        "segments": [
            {"name": "High-Intent Shoppers", "share": 38, "count": 210, "avg_dwell": "22.5s", "color": "#6366f1"},
            {"name": "Window Browsers", "share": 29, "count": 160, "avg_dwell": "14.2s", "color": "#38bdf8"},
            {"name": "Quick Pickers", "share": 21, "count": 115, "avg_dwell": "6.8s", "color": "#22d3a5"},
            {"name": "Undecided Visitors", "share": 12, "count": 70, "avg_dwell": "11.0s", "color": "#ec4899"},
        ],
        "behaviour_radar": [
            {"subject": "Entrance Engagement", "val": 82},
            {"subject": "Shelf Dwell", "val": 74},
            {"subject": "Product Touch", "val": 65},
            {"subject": "Repeat Traffic", "val": 58},
            {"subject": "Cart Add", "val": 71},
            {"subject": "Checkout Completion", "val": 88},
        ]
    }


def get_analyst_ai_insights_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    return {
        "layout_score": 88.5,
        "recommendations": [
            {
                "id": 1,
                "priority": "HIGH",
                "title": "Optimize Beverages & Cooking Aisle Traffic Bottleneck",
                "finding": "Customer dwell overlap between Beverages Shelf A1 and Cooking Shelf C1 reaches peak at 14:00.",
                "recommendation": "Increase aisle width by 0.8 meters or split promotional endcaps to balance traffic flow.",
                "projected_lift": "+14.2% Conversion Lift"
            },
            {
                "id": 2,
                "priority": "MEDIUM",
                "title": "Bakery Zone Cold Spot Engagement",
                "finding": "Bakery counter records 4.0s average dwell time despite high footfall past Entrance.",
                "recommendation": "Reposition high-margin organic pastries to eye-level shelf positions.",
                "projected_lift": "+8.5% Attention Score"
            },
            {
                "id": 3,
                "priority": "LOW",
                "title": "Billing Counter Queue Time Optimization",
                "finding": "Average checkout dwell is 2.1 minutes during peak 16:00 - 18:00 hours.",
                "recommendation": "Open secondary express register to improve overall customer exit satisfaction.",
                "projected_lift": "-18% Queue Dwell"
            }
        ]
    }
