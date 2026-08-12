from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.store import Store, Zone, Shelf, Product, Camera, AttentionLog
from app.ai.live_analytics import get_all_trackers


def get_marketing_overview_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    zones = (db.query(Zone).filter(Zone.store_id == store_id).all() or db.query(Zone).all()) if db else []
    zone_ids = [z.id for z in zones]
    logs = db.query(AttentionLog).filter(AttentionLog.zone_id.in_(zone_ids)).all() if db and zone_ids else []

    total_visitors = len(logs) or 555
    avg_attention = round(sum(l.attention_score for l in logs) / max(1, len(logs)), 1) if logs else 31.9
    avg_dwell = round(sum(l.dwell_time for l in logs) / max(1, len(logs)), 1) if logs else 17.8

    returning_customers = int(total_visitors * 0.38)
    new_customers = total_visitors - returning_customers
    products_viewed = int(total_visitors * 1.85)
    products_picked = int(products_viewed * 0.42)
    sales_generated = int(products_picked * 48.5)  # $ sales
    conversion_rate = round((products_picked / max(1, products_viewed)) * 100, 1)

    # Top zone calculation
    zone_visit_map = defaultdict(int)
    for l in logs:
        if l.zone:
            zone_visit_map[l.zone.name] += 1
    top_zone = max(zone_visit_map, key=zone_visit_map.get) if zone_visit_map else "Entrance"

    return {
        "today_visitors": total_visitors,
        "returning_customers": returning_customers,
        "new_customers": new_customers,
        "average_dwell_time": avg_dwell,
        "average_attention_score": avg_attention,
        "products_viewed": products_viewed,
        "products_picked": products_picked,
        "conversion_rate": conversion_rate,
        "sales_generated": f"${sales_generated:,}",
        "campaign_roi": "384%",
        "top_performing_zone": top_zone,
    }


def get_campaign_analytics_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    return {
        "top_campaign": "Summer Beverage Blitz '26",
        "active_campaigns": [
            {
                "name": "Summer Beverage Blitz '26",
                "duration": "Jul 15 - Aug 15",
                "promoted_products": "Cold Brew, Energy Drinks, Fresh Juices",
                "reach": 14250,
                "attention_score": 84.5,
                "visitors": 4820,
                "product_engagement": "78.2%",
                "sales_lift": "+34.5%",
                "roi": "412%"
            },
            {
                "name": "Organic Bakery Fresh Promo",
                "duration": "Jul 20 - Jul 31",
                "promoted_products": "Artisan Breads, Croissants, Pastries",
                "reach": 8900,
                "attention_score": 76.2,
                "visitors": 2940,
                "product_engagement": "64.0%",
                "sales_lift": "+22.1%",
                "roi": "285%"
            },
            {
                "name": "Chef Cooking Essentials",
                "duration": "Jul 01 - Jul 31",
                "promoted_products": "Olive Oil, Gourmet Spices, Pasta Sauces",
                "reach": 11400,
                "attention_score": 81.0,
                "visitors": 3650,
                "product_engagement": "71.5%",
                "sales_lift": "+28.4%",
                "roi": "350%"
            }
        ],
        "performance_trend": [
            {"week": "Week 1", "reach": 3200, "engagement": 65, "sales_lift": 18},
            {"week": "Week 2", "reach": 5400, "engagement": 72, "sales_lift": 26},
            {"week": "Week 3", "reach": 8900, "engagement": 79, "sales_lift": 31},
            {"week": "Week 4", "reach": 14250, "engagement": 84, "sales_lift": 35}
        ]
    }


def get_sales_insights_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    logs_cnt = db.query(AttentionLog).count() if db else 555
    total_visitors = max(500, logs_cnt)
    interested = int(total_visitors * 0.72)
    interactions = int(interested * 0.58)
    intent = int(interactions * 0.45)
    conversions = int(intent * 0.82)

    return {
        "estimated_sales": f"${conversions * 54.0:,.2f}",
        "funnel": [
            {"stage": "1. Store Visitors", "count": total_visitors, "percentage": "100%"},
            {"stage": "2. Interested Browsers", "count": interested, "percentage": "72.0%"},
            {"stage": "3. Product Interaction", "count": interactions, "percentage": "41.8%"},
            {"stage": "4. Purchase Intent", "count": intent, "percentage": "18.8%"},
            {"stage": "5. Final Conversion", "count": conversions, "percentage": "15.4%"}
        ],
        "zone_revenue": [
            {"zone": "Beverages", "revenue": 14200, "share": "32.5%"},
            {"zone": "Cooking Products", "revenue": 11800, "share": "27.0%"},
            {"zone": "Bakery", "revenue": 8900, "share": "20.4%"},
            {"zone": "Entrance & Quick Picks", "revenue": 5400, "share": "12.4%"},
            {"zone": "Billing Counter", "revenue": 3400, "share": "7.7%"}
        ]
    }


def get_conversion_analytics_data(db: Session, store_id: int = 1) -> Dict[str, Any]:
    return {
        "overall_conversion": "22.4%",
        "stages": [
            {"name": "Visitor → Product View", "conversion": "72.0%", "dropoff": "28.0%"},
            {"name": "Product View → Shelf Interaction", "conversion": "58.0%", "dropoff": "42.0%"},
            {"name": "Shelf Interaction → Pick", "conversion": "45.0%", "dropoff": "55.0%"},
            {"name": "Pick → Final Purchase", "conversion": "82.0%", "dropoff": "18.0%"}
        ],
        "zone_conversions": [
            {"zone": "Cooking Products", "rate": "28.5%", "status": "Top Performing"},
            {"zone": "Beverages", "rate": "24.2%", "status": "High Performing"},
            {"zone": "Bakery", "rate": "19.8%", "status": "Average"},
            {"zone": "Entrance", "rate": "12.4%", "status": "Opportunity Zone"}
        ]
    }
