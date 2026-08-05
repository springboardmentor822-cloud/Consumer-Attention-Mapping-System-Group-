from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

import crud
import schemas

from database import get_db
from live_stats import live_stats

router = APIRouter()

# ==========================================================
# AI DASHBOARD
# ==========================================================

@router.get(
    "/",
    response_model=schemas.AIDashboardResponse
)
def ai_dashboard(
    db: Session = Depends(get_db)
):
    """
    Main AI Dashboard

    Combines:
    - Database Analytics
    - Live AI Statistics
    - Behaviour Intelligence
    """

    dashboard = crud.get_ai_dashboard(db)

    return dashboard


# ==========================================================
# LIVE AI STATUS
# ==========================================================

@router.get("/status")
def ai_status():

    return {

        "system_status": live_stats["system_status"],

        "camera_status": live_stats["camera_status"],

        "heatmap_active": live_stats["heatmap_active"],

        "path_tracking": live_stats["path_tracking"],

        "frames_processed": live_stats["frames_processed"],

        "last_updated": live_stats["last_updated"]

    }


# ==========================================================
# CUSTOMER BEHAVIOUR
# ==========================================================

@router.get("/behaviour")
def customer_behaviour():

    return {

        "attention_score": live_stats["attention_score"],

        "engagement_level": live_stats["engagement_level"],

        "shopping_behavior": live_stats["shopping_behavior"],

        "customer_flow": live_stats["customer_flow"],

        "peak_zone": live_stats["peak_zone"],

        "most_visited_shelf": live_stats["most_visited_shelf"],

        "product_interactions": live_stats["product_interactions"],

        "tracked_paths": live_stats["tracked_paths"],

        "heatmap_points": live_stats["heatmap_points"],

        "current_persons": live_stats["current_persons"],

        "total_customers": live_stats["total_customers"]

    }


# ==========================================================
# AI INSIGHTS
# ==========================================================

@router.get("/insights")
def ai_insights():

    return {

        "recommendation": live_stats["ai_recommendation"],

        "attention_score": live_stats["attention_score"],

        "engagement_level": live_stats["engagement_level"],

        "peak_zone": live_stats["peak_zone"],

        "shopping_behavior": live_stats["shopping_behavior"],

        "customer_flow": live_stats["customer_flow"],

        "system_status": live_stats["system_status"],

        "camera_status": live_stats["camera_status"],

        "last_updated": live_stats["last_updated"]

    }


# ==========================================================
# LIVE HEATMAP
# ==========================================================

@router.get("/heatmap")
def heatmap_status():

    return {

        "heatmap_active": live_stats["heatmap_active"],

        "heatmap_points": live_stats["heatmap_points"],

        "hotspots": live_stats["hotspots"]

    }


# ==========================================================
# CUSTOMER PATHS
# ==========================================================

@router.get("/paths")
def customer_paths():

    return {

        "path_tracking": live_stats["path_tracking"],

        "tracked_paths": live_stats["tracked_paths"]

    }