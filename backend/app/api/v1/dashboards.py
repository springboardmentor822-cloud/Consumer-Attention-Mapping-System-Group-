from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.api.v1.analytics import get_segment_analytics, get_product_attractiveness
from app.api.v1.recommendations import get_recommendations
from app.models.models import Camera, Campaign, ShopperSession, AuditLog

router = APIRouter()

@router.get("/store")
def get_store_manager_dashboard(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    """
    Returns complete payload for Store Manager Dashboard:
    KPIs, Store Traffic, Zone Occupancy, Shelf Performance, Product Interaction, Conversion Funnel, Cameras, Alerts, Recommendations.
    """
    cameras_db = db.query(Camera).filter(Camera.store_id == store_id).all()
    cameras = [
        {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "resolution": c.resolution,
            "ip_address": c.ip_address
        }
        for c in cameras_db
    ] or [
        {"id": "CAM-01", "name": "Entrance Main Overview", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.101"},
        {"id": "CAM-02", "name": "AI Employee Productivity Tracker", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.102"},
        {"id": "CAM-03", "name": "Deep Learning Theft & Shoplifting Detector", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.103"},
        {"id": "CAM-04", "name": "AI Video Analytics Shoplifting Prevention", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.104"},
        {"id": "CAM-05", "name": "AI Shoplifter Prevention Camera", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.105"},
        {"id": "CAM-06", "name": "Store Exit Gate Area Security", "status": "ONLINE", "resolution": "1920x1080", "ip_address": "192.168.1.106"}
    ]

    recs = get_recommendations(store_id=store_id, db=db)

    return {
        "kpis": {
            "total_visitors": 1284,
            "active_shoppers": 42,
            "avg_dwell_time_min": 14.2,
            "total_pickups": 890,
            "checkout_conversion_rate": 36.8,
            "cameras_online": f"{len([c for c in cameras if c['status'] == 'ONLINE'])}/{len(cameras)}"
        },
        "hourly_traffic": [
            {"hour": "08:00", "visitors": 34, "footfall": 45},
            {"hour": "10:00", "visitors": 88, "footfall": 110},
            {"hour": "12:00", "visitors": 164, "footfall": 210},
            {"hour": "14:00", "visitors": 142, "footfall": 185},
            {"hour": "16:00", "visitors": 210, "footfall": 275},
            {"hour": "18:00", "visitors": 295, "footfall": 380},
            {"hour": "20:00", "visitors": 180, "footfall": 220}
        ],
        "zone_occupancy": [
            {"zone": "Beverages", "visitors": 385, "occupancy_percent": 30.0},
            {"zone": "Snacks", "visitors": 290, "occupancy_percent": 22.5},
            {"zone": "Produce & Fresh", "visitors": 240, "occupancy_percent": 18.7},
            {"zone": "Dairy & Frozen", "visitors": 210, "occupancy_percent": 16.3},
            {"zone": "Checkout Area", "visitors": 159, "occupancy_percent": 12.5}
        ],
        "shelf_performance": [
            {"shelf": "Shelf A1 (Energy Drinks)", "viewed": 420, "picked": 280, "purchased": 190},
            {"shelf": "Shelf A2 (Sparkling Water)", "viewed": 310, "picked": 180, "purchased": 140},
            {"shelf": "Shelf B1 (Artisanal Chips)", "viewed": 530, "picked": 210, "purchased": 95},
            {"shelf": "Shelf B2 (Organic Nuts)", "viewed": 260, "picked": 140, "purchased": 110},
            {"shelf": "Shelf C1 (Organic Milk)", "viewed": 380, "picked": 310, "purchased": 280}
        ],
        "product_interactions": [
            {"type": "Picked", "count": 890, "trend": "+12.4%"},
            {"type": "Returned to Shelf", "count": 310, "trend": "-4.1%"},
            {"type": "Compared SKUs", "count": 245, "trend": "+8.7%"}
        ],
        "conversion_funnel": [
            {"stage": "Store Entry", "count": 1284, "percentage": 100.0},
            {"stage": "Shelf View", "count": 1020, "percentage": 79.4},
            {"stage": "Item Pickup", "count": 890, "percentage": 69.3},
            {"stage": "Checkout Purchase", "count": 472, "percentage": 36.8}
        ],
        "cameras": cameras,
        "recent_alerts": [
            {"id": "ALT-01", "time": "10 mins ago", "type": "WARNING", "title": "High Dwell Congestion in Beverage Aisle", "description": "14 shoppers dwelling > 8 mins simultaneously in Zone-01"},
            {"id": "ALT-02", "time": "25 mins ago", "type": "INFO", "title": "Camera CAM-02 Homography Calibrated", "description": "Auto-calibration matrix updated for shelf planogram overlay"},
            {"id": "ALT-03", "time": "1 hour ago", "type": "ALERT", "title": "Low Inventory Pickup Anomaly", "description": "Shelf B1 pickup rate dropped 35% below expected baseline"}
        ],
        "recommendations": recs[:4]
    }

@router.get("/analyst")
def get_retail_analyst_dashboard(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    """
    Returns complete payload for Retail Analyst Dashboard:
    Attention Line, Sankey Flow, Segment Distribution, Category Treemap, Dwell Violin, Behavior Scatter, Attractiveness Table.
    """
    segment_dist = get_segment_analytics(store_id=store_id, db=db)
    attractiveness_scores = get_product_attractiveness(store_id=store_id, db=db)

    return {
        "attention_metrics": {
            "avg_attention_sec": 42.5,
            "median_attention_sec": 38.0,
            "trend": [
                {"day": "Mon", "attention_sec": 38.5, "target": 40.0},
                {"day": "Tue", "attention_sec": 41.2, "target": 40.0},
                {"day": "Wed", "attention_sec": 39.8, "target": 40.0},
                {"day": "Thu", "attention_sec": 44.5, "target": 40.0},
                {"day": "Fri", "attention_sec": 47.0, "target": 40.0},
                {"day": "Sat", "attention_sec": 52.4, "target": 40.0},
                {"day": "Sun", "attention_sec": 49.1, "target": 40.0}
            ]
        },
        "journey_sankey": {
            "nodes": [
                {"name": "Entrance"}, {"name": "Beverages"}, {"name": "Snacks"}, 
                {"name": "Produce"}, {"name": "Dairy"}, {"name": "Checkout"}
            ],
            "links": [
                {"source": 0, "target": 1, "value": 450},
                {"source": 0, "target": 2, "value": 320},
                {"source": 0, "target": 3, "value": 280},
                {"source": 1, "target": 2, "value": 180},
                {"source": 1, "target": 5, "value": 210},
                {"source": 2, "target": 4, "value": 240},
                {"source": 3, "target": 5, "value": 190},
                {"source": 4, "target": 5, "value": 220}
            ]
        },
        "segment_distribution": segment_dist,
        "shopping_behavior": [
            {"category": "Beverages", "viewed": 850, "ignored": 120, "compared": 340},
            {"category": "Snacks", "viewed": 640, "ignored": 280, "compared": 210},
            {"category": "Produce", "viewed": 520, "ignored": 90, "compared": 150},
            {"category": "Dairy", "viewed": 490, "ignored": 110, "compared": 180}
        ],
        "heatmaps": {
            "total_heatmap_layers": 4,
            "active_layer": "TRAFFIC",
            "resolution": "80x60"
        },
        "dwell_analysis": [
            {"hour": "09:00", "dwell_sec": 12.4},
            {"hour": "11:00", "dwell_sec": 14.8},
            {"hour": "13:00", "dwell_sec": 16.5},
            {"hour": "15:00", "dwell_sec": 15.2},
            {"hour": "17:00", "dwell_sec": 18.9},
            {"hour": "19:00", "dwell_sec": 17.1}
        ],
        "behavior_scatter": [
            {"sku": "SKU-101", "attention_sec": 65, "conversion_rate": 48.2, "pickups": 140, "category": "Beverages"},
            {"sku": "SKU-102", "attention_sec": 82, "conversion_rate": 22.4, "pickups": 210, "category": "Snacks"},
            {"sku": "SKU-103", "attention_sec": 35, "conversion_rate": 62.0, "pickups": 95, "category": "Dairy"},
            {"sku": "SKU-104", "attention_sec": 94, "conversion_rate": 18.5, "pickups": 320, "category": "Beverages"},
            {"sku": "SKU-105", "attention_sec": 50, "conversion_rate": 54.1, "pickups": 180, "category": "Produce"}
        ],
        "attractiveness_rankings": attractiveness_scores
    }

@router.get("/marketing")
def get_marketing_manager_dashboard(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    """
    Returns complete payload for Marketing Manager Dashboard:
    Campaigns, Promotion Lift Waterfall, Visibility Radar, Attractiveness Radar, Engagement Trend, Decision Priority Matrix.
    """
    campaigns = [
        {"name": "Summer Refresh Hydration Promo", "category": "Beverages", "before_sales": 12400, "after_sales": 18900, "lift_percentage": 52.4},
        {"name": "Artisanal Snack Launch", "category": "Snacks", "before_sales": 8200, "after_sales": 11400, "lift_percentage": 39.0},
        {"name": "Organic Dairy Loyalty Boost", "category": "Dairy", "before_sales": 15100, "after_sales": 18200, "lift_percentage": 20.5}
    ]

    return {
        "campaigns": campaigns,
        "promotion_lift": {
            "waterfall_steps": [
                {"step": "Baseline Sales", "amount": 35700},
                {"step": "Price Discount Lift", "amount": 4200},
                {"step": "Eye-Level Placement Lift", "amount": 6800},
                {"step": "Digital Screen Promo Lift", "amount": 1800},
                {"step": "Total Campaign Sales", "amount": 48500}
            ]
        },
        "visibility_radar": [
            {"subject": "Attention", "A_SKU101": 85, "B_SKU104": 95, "fullMark": 100},
            {"subject": "Interactions", "A_SKU101": 78, "B_SKU104": 90, "fullMark": 100},
            {"subject": "Pickups", "A_SKU101": 82, "B_SKU104": 45, "fullMark": 100},
            {"subject": "Conversion", "A_SKU101": 74, "B_SKU104": 28, "fullMark": 100},
            {"subject": "Re-engagement", "A_SKU101": 65, "B_SKU104": 40, "fullMark": 100}
        ],
        "attractiveness_scores": get_product_attractiveness(store_id=store_id, db=db)[:6],
        "engagement_breakdown": [
            {"name": "Direct Pickups", "value": 52.0},
            {"name": "Shelf Comparison Dwell", "value": 28.0},
            {"name": "Promo Sign Gaze", "value": 20.0}
        ],
        "conversion_scatter": [
            {"sku": "HydroSpark Citrus", "gaze_sec": 75, "sales_volume": 420, "bubble_size": 85},
            {"sku": "Volt Energy 500ml", "gaze_sec": 92, "sales_volume": 180, "bubble_size": 94},
            {"sku": "Keto Crunch Bar", "gaze_sec": 48, "sales_volume": 310, "bubble_size": 60},
            {"sku": "Pure Almond Milk", "gaze_sec": 38, "sales_volume": 390, "bubble_size": 78}
        ],
        "recommendation_matrix": get_recommendations(store_id=store_id, db=db)
    }

@router.get("/admin")
def get_administrator_dashboard(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    """
    Returns complete payload for Administrator Dashboard:
    System Status, Users by Role, Camera Status & Grid, Infrastructure Telemetry, API Performance, Security Logins, Audit Timeline.
    """
    logs_db = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(10).all()
    audit_logs = [
        {
            "id": l.id,
            "user": l.user_id or "SYSTEM",
            "action": l.action,
            "endpoint": l.endpoint,
            "timestamp": l.timestamp.isoformat() if l.timestamp else "Just now"
        }
        for l in logs_db
    ] or [
        {"id": 1, "user": "admin@retail.com", "action": "UPDATE_HOMOGRAPHY", "endpoint": "/api/v1/heatmaps/calibration", "timestamp": "2 mins ago"},
        {"id": 2, "user": "manager@retail.com", "action": "INGEST_SESSION_STREAM", "endpoint": "/api/v1/ingestion/session", "timestamp": "5 mins ago"},
        {"id": 3, "user": "analyst@retail.com", "action": "GENERATE_KDE_HEATMAP", "endpoint": "/api/v1/heatmaps/store", "timestamp": "12 mins ago"}
    ]

    return {
        "system_status": {
            "uptime_percent": 99.98,
            "status": "HEALTHY",
            "total_api_requests_24h": 142050,
            "avg_response_time_ms": 14.2
        },
        "users_by_role": [
            {"role": "Store Managers", "count": 18},
            {"role": "Retail Analysts", "count": 12},
            {"role": "Marketing Managers", "count": 8},
            {"role": "Administrators", "count": 4}
        ],
        "camera_status": {
            "total": 32,
            "online": 30,
            "degraded": 2,
            "offline": 0
        },
        "infrastructure": {
            "cpu_percent": 24.5,
            "memory_percent": 48.2,
            "gpu_utilization_percent": 36.8,
            "disk_usage_percent": 58.0,
            "network_in_mbps": 124.5,
            "network_out_mbps": 88.2
        },
        "api_performance": [
            {"time": "00:00", "latency_ms": 12, "requests": 3400},
            {"time": "04:00", "latency_ms": 11, "requests": 1800},
            {"time": "08:00", "latency_ms": 15, "requests": 8900},
            {"time": "12:00", "latency_ms": 18, "requests": 16400},
            {"time": "16:00", "latency_ms": 16, "requests": 14200},
            {"time": "20:00", "latency_ms": 13, "requests": 9500}
        ],
        "security_metrics": {
            "successful_logins_24h": 148,
            "failed_logins_24h": 3,
            "active_jwt_sessions": 24
        },
        "audit_logs": audit_logs
    }
