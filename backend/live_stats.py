"""
live_stats.py
Maintains independent analytics for each camera.
"""

from copy import deepcopy
from datetime import datetime

# ==========================================================
# DEFAULT STATISTICS
# ==========================================================

DEFAULT_STATS = {
    "current_persons": 0,
    "total_customers": 0,
    "average_dwell": 0,

    "products_detected": 0,
    "product_interactions": 0,

    "attention_score": 0,

    "shelf_a": 0,
    "shelf_b": 0,
    "checkout": 0,

    "peak_zone": "None",
    "peak_zone_count": 0,
    "most_visited_shelf": "None",

    "store_congestion": "Low",
    "customer_flow": "No Activity",

    "shelf_a_percent": 0,
    "shelf_b_percent": 0,
    "checkout_percent": 0,

    "engagement_level": "Low",

    "tracked_paths": 0,
    "path_tracking": False,

    "heatmap_active": False,
    "heatmap_points": 0,

    "frames_processed": 0,

    "male_count": 0,
    "female_count": 0,

    "dominant_emotion": "Neutral",
    "emotion_distribution": {},

    "ai_recommendation": "Monitoring...",

    "dashboard_summary": {},
    # =========================
    # Customer Behaviour
    # =========================

    "customers": {},

    "average_journey": 0,

    "average_zones": 0,

    "behaviour_distribution": {},

    "customer_behaviour": [],

    "behaviour_insights": [],

    
    # =========================
    # Dwell Analytics
    # =========================

    "min_dwell": 0,
    "max_dwell": 0,
    "median_dwell": 0,

    "hourly_dwell": [
        {"hour": "09:00", "value": 0},
        {"hour": "10:00", "value": 0},
        {"hour": "11:00", "value": 0},
        {"hour": "12:00", "value": 0},
        {"hour": "13:00", "value": 0},
        {"hour": "14:00", "value": 0},
        {"hour": "15:00", "value": 0},
    ],

    "dwell_distribution": [
        0,
        0,
        0,
        0,
        0,
    ],

    "q1": 0,
    "q3": 0,

    "system_status": "Running",

    # Store datetime object instead of string
    "last_updated": None,
}

# ==========================================================
# CAMERA-WISE LIVE STATS
# ==========================================================

# Only Camera 1 and Camera 2 are active
live_stats = {
    1: deepcopy(DEFAULT_STATS),
    2: deepcopy(DEFAULT_STATS),
}

# ==========================================================
# GET STATS
# ==========================================================

def get_stats(camera_id: int):
    """
    Return statistics for an active camera.
    """

    if camera_id not in live_stats:
        return None

    return live_stats[camera_id]

# ==========================================================
# RESET STATS
# ==========================================================

def reset_stats(camera_id: int):
    """
    Reset one camera statistics.
    """

    if camera_id in live_stats:
        live_stats[camera_id] = deepcopy(DEFAULT_STATS)

# ==========================================================
# RESET ALL
# ==========================================================

def reset_all():
    """
    Reset all active cameras.
    """

    for cam in live_stats:
        live_stats[cam] = deepcopy(DEFAULT_STATS)

# ==========================================================
# UPDATE AI INSIGHTS
# ==========================================================

def update_ai_insights(camera_id: int):
    """
    Update derived analytics and AI recommendations.
    """

    stats = get_stats(camera_id)

    if stats is None:
        return None

    current = stats["current_persons"]
    dwell = stats["average_dwell"]
    stats["min_dwell"] = max(dwell - 25, 0)
    stats["median_dwell"] = dwell
    stats["max_dwell"] = dwell + 35

    stats["q1"] = max(dwell - 15, 0)
    stats["q3"] = dwell + 15
    attention = stats["attention_score"]
    interactions = stats["product_interactions"]

    # ----------------------------------
    # Engagement Level
    # ----------------------------------

    if attention >= 80:
        stats["engagement_level"] = "Very High"
    elif attention >= 60:
        stats["engagement_level"] = "High"
    elif attention >= 40:
        stats["engagement_level"] = "Moderate"
    else:
        stats["engagement_level"] = "Low"

    # ----------------------------------
    # Store Congestion
    # ----------------------------------

    if current >= 12:
        stats["store_congestion"] = "High"
    elif current >= 6:
        stats["store_congestion"] = "Medium"
    else:
        stats["store_congestion"] = "Low"

    # ----------------------------------
    # Customer Flow
    # ----------------------------------

    if current == 0:
        stats["customer_flow"] = "No Activity"
    elif current < 5:
        stats["customer_flow"] = "Normal"
    elif current < 10:
        stats["customer_flow"] = "Busy"
    else:
        stats["customer_flow"] = "Heavy"

    # ----------------------------------
    # AI Recommendation
    # ----------------------------------

    if current == 0:
        recommendation = (
            f"No customer activity detected on Camera {camera_id}."
        )

    elif attention >= 80:
        recommendation = (
            f"High customer attention detected on Camera {camera_id}."
        )

    elif dwell >= 40:
        recommendation = (
            f"Customers are spending longer than usual in Camera {camera_id}."
        )

    elif interactions >= 10:
        recommendation = (
            f"Frequent customer interactions detected on Camera {camera_id}."
        )

    elif current >= 12:
        recommendation = (
            f"High crowd density detected on Camera {camera_id}."
        )

    else:
        recommendation = (
            f"Customer activity is normal on Camera {camera_id}."
        )

    stats["ai_recommendation"] = recommendation

    # ----------------------------------
    # Dashboard Summary
    # ----------------------------------

    stats["hourly_dwell"] = [
        {"hour": "09:00", "value": max(dwell - 20, 0)},
        {"hour": "10:00", "value": max(dwell - 10, 0)},
        {"hour": "11:00", "value": dwell},
        {"hour": "12:00", "value": dwell + 8},
        {"hour": "13:00", "value": dwell + 5},
        {"hour": "14:00", "value": dwell + 2},
        {"hour": "15:00", "value": dwell},
    ]

    stats["dwell_distribution"] = [
        max(int(dwell * 0.15), 1),
        max(int(dwell * 0.25), 1),
        max(int(dwell * 0.40), 1),
        max(int(dwell * 0.15), 1),
        max(int(dwell * 0.05), 1),
    ]
    stats["dashboard_summary"] = {
        "recommendation": recommendation,
        "engagement_level": stats["engagement_level"],
        "store_congestion": stats["store_congestion"],
        "customer_flow": stats["customer_flow"],
    }

    # Store actual datetime object
    stats["last_updated"] = datetime.now()

    return stats