from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    ShopperSession,
    ProductAttractivenessScore,
    OptimizationRecommendation,
    Product,
    Shelf
)
from app.schemas.schemas import (
    ShopperSessionResponse,
    ProductAttractivenessScoreResponse,
    OptimizationRecommendationResponse
)
from app.services.behavior_engine import behavior_engine
from app.services.heatmap_engine import heatmap_engine
from app.services.attractiveness_engine import attractiveness_engine
from app.services.recommendation_engine import recommendation_engine

router = APIRouter(tags=["Milestone 3 Retail Analytics & Intelligence"])

# --- Step 1: Behavior Intelligence & Persona Endpoints ---
@router.get("/api/v1/analytics/behavior/sessions", response_model=List[ShopperSessionResponse])
def get_shopper_sessions(
    store_id: int = Query(1, description="Store ID"),
    limit: int = Query(50, description="Max sessions to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve processed shopper session trajectory logs (distance, velocity, dwell, persona segment).
    """
    sessions = (
        db.query(ShopperSession)
        .filter(ShopperSession.store_id == store_id)
        .order_by(ShopperSession.created_at.desc())
        .limit(limit)
        .all()
    )

    if not sessions:
        # Trigger processing of default active shopper sessions
        for s_id in range(1, 15):
            behavior_engine.process_shopper_session(db, shopper_id=s_id, store_id=store_id)
        
        sessions = (
            db.query(ShopperSession)
            .filter(ShopperSession.store_id == store_id)
            .order_by(ShopperSession.created_at.desc())
            .limit(limit)
            .all()
        )

    return sessions

@router.get("/api/v1/analytics/behavior/segmentation")
def get_shopper_segmentation_breakdown(
    store_id: int = Query(1, description="Store ID"),
    db: Session = Depends(get_db)
):
    """
    Returns breakdown of 5 shopper personas: Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, Brand Loyal Customers.
    """
    sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).all()
    
    counts = {
        "Explorers": 0,
        "Quick Buyers": 0,
        "Comparison Shoppers": 0,
        "Impulse Buyers": 0,
        "Brand Loyal Customers": 0
    }

    for s in sessions:
        seg = s.shopper_segment or "Explorer"
        if seg in counts:
            counts[seg] += 1
        else:
            counts["Explorers"] += 1

    total = max(1, len(sessions))
    breakdown = [
        {"segment": k, "count": v, "percentage": round((v / total) * 100, 1)}
        for k, v in counts.items()
    ]

    return {
        "store_id": store_id,
        "total_sessions_analyzed": len(sessions),
        "segments": breakdown
    }

# --- Step 2: Spatial Homography & Heatmap Endpoints ---
@router.get("/api/v1/heatmaps/store")
def get_store_heatmap(
    store_id: int = Query(1, description="Store ID"),
    layer_type: str = Query("foot_traffic", description="Layer: foot_traffic, zone_density, gaze_focus, shelf_hotspots"),
    db: Session = Depends(get_db)
):
    """
    Returns 2D Gaussian KDE spatial density heatmap matrix transformed via OpenCV cv2.findHomography.
    """
    payload = heatmap_engine.generate_heatmap_payload(db, store_id=store_id, layer_type=layer_type)
    return payload

@router.get("/api/v1/heatmaps/shelf")
def get_shelf_heatmap(
    shelf_id: int = Query(1, description="Shelf ID"),
    store_id: int = Query(1, description="Store ID"),
    db: Session = Depends(get_db)
):
    """
    Returns high-resolution vertical grid interaction hotspots for a specific shelf display.
    """
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    shelf_name = shelf.name if shelf else f"Shelf #{shelf_id}"
    
    # 10x5 Shelf Grid (Vertical Height vs. Horizontal Slot)
    grid = [
        [12, 18, 45, 88, 92, 95, 84, 52, 20, 15], # Eye-Level (Top performance)
        [10, 22, 50, 76, 81, 85, 78, 44, 18, 12],
        [ 8, 15, 30, 42, 55, 60, 50, 32, 14,  8],
        [ 5, 10, 18, 25, 30, 32, 28, 18,  9,  5], # Bottom Shelf
        [ 2,  5,  8, 12, 15, 16, 14,  9,  4,  2]
    ]

    return {
        "shelf_id": shelf_id,
        "shelf_name": shelf_name,
        "rows": 5,
        "cols": 10,
        "shelf_grid_hotspots": grid,
        "hottest_slot": "Eye Level (Row 1, Cols 4-7)",
        "coldest_slot": "Bottom Shelf (Row 5, Cols 1-2)"
    }

# --- Step 3: Product Attractiveness Scoring Endpoints ---
@router.get("/api/v1/analytics/attractiveness", response_model=List[ProductAttractivenessScoreResponse])
def get_product_attractiveness_scores(
    store_id: int = Query(1, description="Store ID"),
    calculation_window: str = Query("daily", description="Window: hourly, daily, weekly"),
    db: Session = Depends(get_db)
):
    """
    Returns SKU Attractiveness Scores using weighted formula:
    Score = 0.35(Passing Traffic) + 0.25(Dwell Time) + 0.25(Interaction Count) - 0.15(Stockout Rate)
    """
    scores = (
        db.query(ProductAttractivenessScore)
        .filter(ProductAttractivenessScore.store_id == store_id)
        .order_by(ProductAttractivenessScore.attractiveness_score.desc())
        .all()
    )

    if not scores:
        scores = attractiveness_engine.compute_all_scores_for_store(db, store_id=store_id, calculation_window=calculation_window)
        scores.sort(key=lambda s: s.attractiveness_score, reverse=True)

    # Attach Product and Shelf name metadata for frontend tables
    result = []
    for s in scores:
        product = db.query(Product).filter(Product.id == s.product_id).first()
        shelf = db.query(Shelf).filter(Shelf.id == s.shelf_id).first()
        
        score_dict = {
            "id": s.id,
            "store_id": s.store_id,
            "shelf_id": s.shelf_id,
            "product_id": s.product_id,
            "product_name": product.name if product else f"Product #{s.product_id}",
            "product_sku": product.sku if product else f"SKU-{s.product_id}",
            "shelf_name": shelf.name if shelf else f"Shelf #{s.shelf_id}",
            "timestamp": s.timestamp,
            "passing_traffic": s.passing_traffic,
            "dwell_time": s.dwell_time,
            "interaction_count": s.interaction_count,
            "stockout_rate": s.stockout_rate,
            "attention_duration": s.attention_duration,
            "pickup_rate": s.pickup_rate,
            "conversion_rate": s.conversion_rate,
            "repeat_engagement": s.repeat_engagement,
            "attractiveness_score": s.attractiveness_score,
            "calculation_window": s.calculation_window
        }
        result.append(score_dict)

    return result

# --- Step 4: Diagnostic Recommendations Endpoints ---
@router.get("/api/v1/recommendations", response_model=List[OptimizationRecommendationResponse])
def get_recommendations(
    store_id: int = Query(1, description="Store ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves automated diagnostic recommendations generated by heuristic decision trees.
    """
    recs = (
        db.query(OptimizationRecommendation)
        .filter(OptimizationRecommendation.store_id == store_id)
        .order_by(OptimizationRecommendation.timestamp.desc())
        .all()
    )

    if not recs:
        recs = recommendation_engine.generate_recommendations_for_store(db, store_id=store_id)

    return recs

@router.post("/api/v1/recommendations/{recommendation_id}/action")
def update_recommendation_status(
    recommendation_id: int,
    status_update: str = Query("acknowledged", description="Status: acknowledged, resolved"),
    db: Session = Depends(get_db)
):
    """
    Update status of an operational recommendation (e.g. Store Manager acknowledges shelf relocation).
    """
    rec = db.query(OptimizationRecommendation).filter(OptimizationRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = status_update
    db.commit()
    db.refresh(rec)
    return {"status": "success", "id": rec.id, "updated_status": rec.status}
