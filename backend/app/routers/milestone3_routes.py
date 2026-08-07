from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ShopperTrajectoryMetric, ProductAttractivenessScore, OptimizationRecommendation, ShopperSegment
from app.schemas import (
    ShopperTrajectoryRequest,
    ShopperTrajectoryResponse,
    HomographyCalibrationRequest,
    HomographyCalibrationResponse,
    AttractivenessCalculateRequest,
    AttractivenessScoreResponse,
    OptimizationRecommendationResponse,
)
from app.ml.behavior_engine import calculate_trajectory_metrics, classify_shopper_segment
from app.ml.heatmap_engine import compute_planogram_homography, render_heatmap_layers
from app.services.attractiveness_engine import compute_and_save_sku_attractiveness
from app.services.recommendation_engine import generate_and_save_recommendations

router = APIRouter(prefix="/api/v1", tags=["Milestone 3 - Behavior & Analytics"])


@router.post("/behavior/trajectory", response_model=ShopperTrajectoryResponse)
def process_shopper_trajectory(payload: ShopperTrajectoryRequest, db: Session = Depends(get_db)):
    """
    Ingests continuous shopper trajectory coordinates, applies Kalman filter smoothing,
    extracts total path distance, dwell time, movement velocity, and classifies shopper segment.
    """
    raw_points = [(p[0], p[1]) for p in payload.points]
    metrics = calculate_trajectory_metrics(raw_points, payload.timestamps)

    segment = classify_shopper_segment(
        total_path_distance=metrics["total_path_distance"],
        total_dwell_seconds=metrics["total_dwell_seconds"],
        pickup_count=payload.pickup_count,
        purchase_count=payload.purchase_count,
        distinct_zones_visited=payload.distinct_zones_visited,
    )

    db_record = ShopperTrajectoryMetric(
        store_id=payload.store_id,
        shopper_id=payload.shopper_id,
        total_path_distance=metrics["total_path_distance"],
        avg_movement_velocity=metrics["avg_movement_velocity"],
        total_dwell_seconds=metrics["total_dwell_seconds"],
        zone_dwell_times=metrics["zone_dwell_times"],
        smoothed_trajectory_points=[[p[0], p[1]] for p in metrics["smoothed_points"]],
        segment=ShopperSegment(segment),
        pickup_count=payload.pickup_count,
        purchase_count=payload.purchase_count,
    )
    db.add(db_record)
    db.commit()

    return ShopperTrajectoryResponse(
        store_id=payload.store_id,
        shopper_id=payload.shopper_id,
        total_path_distance=metrics["total_path_distance"],
        avg_movement_velocity=metrics["avg_movement_velocity"],
        total_dwell_seconds=metrics["total_dwell_seconds"],
        segment=segment,
        smoothed_points=metrics["smoothed_points"],
    )


@router.get("/behavior/segmentation")
def get_shopper_segmentation_breakdown(store_id: int = Query(1), db: Session = Depends(get_db)):
    """
    Returns shopper segment breakdown and counts across Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, and Brand Loyal Customers.
    """
    records = db.query(ShopperTrajectoryMetric).filter(ShopperTrajectoryMetric.store_id == store_id).all()

    counts = {
        "explorers": 0,
        "quick_buyers": 0,
        "comparison_shoppers": 0,
        "impulse_buyers": 0,
        "brand_loyal": 0,
    }

    for r in records:
        seg = r.segment.value if hasattr(r.segment, "value") else str(r.segment)
        if seg in counts:
            counts[seg] += 1

    total = sum(counts.values()) or 1
    percentages = {k: round((v / total) * 100.0, 1) for k, v in counts.items()}

    return {
        "store_id": store_id,
        "total_sessions_analyzed": total,
        "segment_counts": counts,
        "segment_percentages": percentages,
    }


@router.post("/heatmaps/homography-calibrate", response_model=HomographyCalibrationResponse)
def calibrate_homography_matrix(payload: HomographyCalibrationRequest):
    """
    Computes a 3x3 perspective homography matrix using OpenCV (cv2.findHomography)
    to transform camera coordinates to flat planogram coordinates.
    """
    try:
        H = compute_planogram_homography(payload.src_camera_points, payload.dst_planogram_points)
        return HomographyCalibrationResponse(
            success=True,
            homography_matrix=H.tolist(),
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/heatmaps/store")
def get_store_heatmap_layers(
    store_id: int = Query(1),
    date_range: Optional[str] = Query(None),
    segment_type: Optional[str] = Query(None)
):
    """
    Generates multi-layer Gaussian Kernel Density Estimation (KDE) maps across:
    1. Store Traffic Movement
    2. Zone Activity Density
    3. Product Gaze Focus
    4. Grid-level Shelf Hotspots
    """
    # Sample synthetic interaction points for KDE matrix rendering
    traffic_pts = [(20 + i * 3, 30 + (i % 5) * 10) for i in range(40)]
    zone_pts = [(40 + (i % 4) * 15, 50 + i * 2) for i in range(30)]
    gaze_pts = [(60 + i * 2, 40 + i * 3) for i in range(25)]
    shelf_pts = [(30 + i * 4, 70 + (i % 3) * 5) for i in range(35)]

    heatmap_layers = render_heatmap_layers(traffic_pts, zone_pts, gaze_pts, shelf_pts)
    return {
        "store_id": store_id,
        "date_range": date_range or "Last 7 Days",
        "segment_type": segment_type or "all",
        "layers": heatmap_layers,
    }


@router.post("/analytics/attractiveness", response_model=AttractivenessScoreResponse)
def compute_attractiveness_score(payload: AttractivenessCalculateRequest, db: Session = Depends(get_db)):
    """
    Computes Product Attractiveness Score using weighted formula:
    Score = (0.35 * A) + (0.25 * I) + (0.20 * P) + (0.15 * C) + (0.05 * R)
    """
    record = compute_and_save_sku_attractiveness(db, payload.store_id, payload.model_dump())
    return record


@router.get("/analytics/attractiveness", response_model=List[AttractivenessScoreResponse])
def list_attractiveness_scores(
    store_id: int = Query(1),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns calculated Product Attractiveness Scores ranked by highest score.
    """
    query = db.query(ProductAttractivenessScore).filter(ProductAttractivenessScore.store_id == store_id)
    if category:
        query = query.filter(ProductAttractivenessScore.category == category)
    return query.order_by(ProductAttractivenessScore.attractiveness_score.desc()).all()


@router.get("/recommendations", response_model=List[OptimizationRecommendationResponse])
def get_optimization_recommendations(store_id: int = Query(1), db: Session = Depends(get_db)):
    """
    Runs diagnostic rule-based decision trees and returns actionable merchandising recommendation alerts.
    """
    existing = db.query(OptimizationRecommendation).filter(OptimizationRecommendation.store_id == store_id).all()
    if not existing:
        # Generate initial diagnostic recommendations from active SKU scores
        scores = db.query(ProductAttractivenessScore).filter(ProductAttractivenessScore.store_id == store_id).all()
        score_dicts = [
            {
                "product_sku": s.product_sku,
                "product_name": s.product_name,
                "attractiveness_score": s.attractiveness_score,
                "normalized_attention": s.normalized_attention,
                "normalized_pickup": s.normalized_pickup,
                "normalized_conversion": s.normalized_conversion,
                "shelf_location": s.shelf_location,
            }
            for s in scores
        ]
        if not score_dicts:
            # Fallback default seed scores for diagnostic rule evaluation
            score_dicts = [
                {"product_sku": "SKU-HEADSET", "product_name": "Wireless ANC Headset", "attractiveness_score": 88.5, "normalized_attention": 82.0, "normalized_pickup": 25.0, "normalized_conversion": 18.0, "shelf_location": "Shelf A"},
                {"product_sku": "SKU-SMARTTV", "product_name": "4K OLED Smart TV", "attractiveness_score": 79.2, "normalized_attention": 75.0, "normalized_pickup": 70.0, "normalized_conversion": 20.0, "shelf_location": "Shelf E (Bottom)"},
            ]
        existing = generate_and_save_recommendations(db, store_id, score_dicts)

    return existing
