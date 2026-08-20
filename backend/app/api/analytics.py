from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import math
import time

router = APIRouter(prefix="/api/v1/analytics", tags=["Behavior Intelligence & Analytics"])

class AttractivenessQuery(BaseModel):
    product_id: str
    shelf_id: str
    dwell_time: float
    gaze_duration: float
    total_foot_traffic: int

@router.get("/kde-heatmap/{store_id}")
def get_kde_heatmap(store_id: str):
    """2D Kernel Density Estimation (KDE) spatial density coordinates for floor plan heatmaps"""
    # Sample KDE density points mapped to store planogram
    heatmap_points = [
        {"x": 120, "y": 80, "density": 0.95, "zone": "Entrance Foyer"},
        {"x": 350, "y": 140, "density": 0.88, "zone": "Beverages & Snacks"},
        {"x": 420, "y": 190, "density": 0.92, "zone": "Eye-Level Shelf Slot 1"},
        {"x": 580, "y": 310, "density": 0.74, "zone": "Checkout Lanes"},
        {"x": 220, "y": 280, "density": 0.61, "zone": "Promotional Endcap"}
    ]
    return {
        "store_id": store_id,
        "algorithm": "2D Kernel Density Estimation (Gaussian Kernel)",
        "bandwidth": 25.0,
        "total_sample_points": 1420,
        "heatmap_matrix": heatmap_points
    }

@router.get("/dwell-time/{store_id}")
def get_dwell_time_analytics(store_id: str):
    """Dwell time metrics per customer and per zone"""
    return {
        "store_id": store_id,
        "average_dwell_time_seconds": 48.5,
        "zone_metrics": [
          {"zone": "Zone 1: Entrance Foyer", "avg_dwell_sec": 18.2, "traffic_count": 340},
          {"zone": "Zone 2: Main Grocery Aisle", "avg_dwell_sec": 64.8, "traffic_count": 520},
          {"zone": "Zone 3: Checkout Lanes", "avg_dwell_sec": 42.1, "traffic_count": 290}
        ]
    }

@router.get("/gaze-engagement/{store_id}")
def get_gaze_engagement(store_id: str):
    """Head pose estimation & red gaze direction vector telemetry"""
    return {
        "store_id": store_id,
        "total_gaze_events": 890,
        "gaze_hotspots": [
            {"shelf_slot": "Shelf 1 - Eye Level", "gaze_percentage": 68.4, "status": "HIGH ATTENTION"},
            {"shelf_slot": "Shelf 2 - Middle Slot", "gaze_percentage": 24.1, "status": "MODERATE ATTENTION"},
            {"shelf_slot": "Shelf 3 - Bottom Slot", "gaze_percentage": 7.5, "status": "LOW ATTENTION"}
        ]
    }

@router.post("/attractiveness-score")
def calculate_attractiveness_score(query: AttractivenessQuery):
    """
    Product Attractiveness Score Formula:
    Score = (Gaze Duration / Dwell Time * 50) + (Dwell Time / 60 * 30) + (Conversion Weight * 20)
    """
    gaze_ratio = (query.gaze_duration / query.dwell_time) if query.dwell_time > 0 else 0
    dwell_weight = min(query.dwell_time / 60.0, 1.0)
    
    score = round(min(max((gaze_ratio * 50) + (dwell_weight * 30) + 20, 0), 100), 1)
    
    tier = "HOT" if score >= 80 else ("WARM" if score >= 50 else "COLD")
    
    return {
        "product_id": query.product_id,
        "shelf_id": query.shelf_id,
        "attractiveness_score": score,
        "tier": tier,
        "gaze_conversion_rate": f"{round(gaze_ratio * 100, 1)}%",
        "diagnostic": f"Product shows {tier} engagement level based on {query.dwell_time}s dwell and {query.gaze_duration}s eye gaze focus."
    }

@router.get("/recommendations/{store_id}")
def get_ai_recommendations(store_id: str):
    """Rule-based diagnostic recommendation engine"""
    return {
        "store_id": store_id,
        "recommendations": [
            {
                "id": "REC_01",
                "type": "PLANOGRAM_OPTIMIZATION",
                "priority": "HIGH",
                "title": "Reposition Low-Gaze Items to Eye-Level",
                "description": "Bottom shelf items have <8% gaze engagement. Move high-margin snacks to Shelf 1 Eye-Level to increase lift by +42%."
            },
            {
                "id": "REC_02",
                "type": "PROMO_DISPLACEMENT",
                "priority": "MEDIUM",
                "title": "Extend Endcap Promotional Duration",
                "description": "Camera 4 Endcap display achieved 88/100 attractiveness score with avg 75s dwell time."
            }
        ]
    }
