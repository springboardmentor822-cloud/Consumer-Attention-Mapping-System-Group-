from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db import get_db
from app.models.models import ShopperSession, TrajectoryPoint, Product, ProductInteraction, Purchase, ProductAttractivenessScore
from app.services.analytics.attractiveness import compute_product_attractiveness_scores

router = APIRouter()

@router.get("/trajectory")
def get_session_trajectory(session_id: str, db: Session = Depends(get_db)):
    pts = db.query(TrajectoryPoint).filter(TrajectoryPoint.session_id == session_id).order_by(TrajectoryPoint.id.asc()).all()
    return [
        {
            "id": p.id,
            "x": p.x,
            "y": p.y,
            "smoothed_x": p.smoothed_x,
            "smoothed_y": p.smoothed_y,
            "velocity": p.velocity,
            "zone_id": p.zone_id,
            "timestamp": p.timestamp.isoformat() if p.timestamp else None
        }
        for p in pts
    ]

@router.get("/segments")
def get_segment_analytics(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).all()
    
    segment_counts = {
        "Explorers": 0,
        "Quick Buyers": 0,
        "Comparison Shoppers": 0,
        "Impulse Buyers": 0,
        "Brand Loyal Customers": 0
    }
    
    for s in sessions:
        if s.segment in segment_counts:
            segment_counts[s.segment] += 1
        else:
            segment_counts["Explorers"] += 1

    total = len(sessions) if sessions else 1

    return [
        {
            "segment_name": name,
            "count": count,
            "percentage": round((count / total) * 100, 1),
            "avg_dwell_sec": 180.0 if name == "Quick Buyers" else (340.0 if name == "Explorers" else 260.0),
            "avg_distance_m": 45.0 if name == "Quick Buyers" else (140.0 if name == "Explorers" else 85.0)
        }
        for name, count in segment_counts.items()
    ]

@router.get("/attractiveness")
def get_product_attractiveness(store_id: str = "STORE-812", category: Optional[str] = None, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    
    raw_data_list = []
    for p in products:
        if category and p.category != category:
            continue
        
        # Calculate/mock raw metrics A, I, P, C, R
        raw_data_list.append({
            "product_id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "shelf_id": p.shelf_id,
            "shelf_level": p.shelf.level if p.shelf else "EYE_LEVEL",
            "store_id": store_id,
            "raw_metrics": {
                "A": 340.0 + (hash(p.id) % 300), # Attention duration
                "I": 45 + (hash(p.id) % 50),     # Interactions
                "P": 0.42 + ((hash(p.id) % 30) / 100.0), # Pickups/views
                "C": 0.28 + ((hash(p.id) % 40) / 100.0), # Conversion
                "R": 0.15 + ((hash(p.id) % 20) / 100.0)  # Re-engagement
            }
        })

    results = compute_product_attractiveness_scores(raw_data_list)
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results
