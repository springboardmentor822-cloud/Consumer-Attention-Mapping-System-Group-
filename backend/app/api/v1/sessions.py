from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models.models import ShopperSession, TrajectoryPoint, Zone
from app.schemas.schemas import SessionIngestPayload
from app.services.analytics.trajectory import process_raw_trajectory
from app.services.analytics.segmentation import classify_shopper_session

router = APIRouter()

@router.get("")
def list_sessions(store_id: Optional[str] = "STORE-812", limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(ShopperSession)
    if store_id:
        query = query.filter(ShopperSession.store_id == store_id)
    sessions = query.order_by(ShopperSession.start_time.desc()).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "shopper_id": s.shopper_id,
            "store_id": s.store_id,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "total_dwell": s.total_dwell,
            "path_distance": s.path_distance,
            "segment": s.segment
        }
        for s in sessions
    ]

@router.post("/ingestion/session")
def ingest_session_trajectory(payload: SessionIngestPayload, db: Session = Depends(get_db)):
    # Fetch store zones for point-in-polygon mapping
    zones_db = db.query(Zone).filter(Zone.store_id == payload.store_id).all()
    zones = [{"id": z.id, "polygon_coords": z.polygon_coords} for z in zones_db]

    raw_points = [p.dict() for p in payload.points]
    processed_pts, total_dist, total_dwell, zone_dwells = process_raw_trajectory(raw_points, zones)

    # Classify session
    feature_vector = {
        "path_distance": total_dist,
        "total_dwell": total_dwell,
        "zone_count": len(zone_dwells),
        "max_shelf_dwell": max(zone_dwells.values()) if zone_dwells else 0.0,
        "pickups": 2,
        "returns": 0,
        "view_to_pickup_time": 4.5,
        "purchase_conversion": True,
        "brand_zone_targeted": False
    }
    segment_name, confidence = classify_shopper_session(feature_vector)

    # Save session
    session = ShopperSession(
        id=payload.session_id,
        store_id=payload.store_id,
        shopper_id=payload.shopper_id,
        total_dwell=total_dwell,
        path_distance=total_dist,
        segment=segment_name
    )
    db.add(session)
    db.commit()

    # Save points
    for pt in processed_pts:
        t_pt = TrajectoryPoint(
            session_id=payload.session_id,
            x=pt["x"],
            y=pt["y"],
            smoothed_x=pt["smoothed_x"],
            smoothed_y=pt["smoothed_y"],
            velocity=pt["velocity"],
            zone_id=pt["zone_id"]
        )
        db.add(t_pt)
    
    db.commit()

    return {
        "status": "SUCCESS",
        "session_id": payload.session_id,
        "processed_points": len(processed_pts),
        "total_distance": total_dist,
        "total_dwell": total_dwell,
        "assigned_segment": segment_name,
        "confidence": confidence
    }
