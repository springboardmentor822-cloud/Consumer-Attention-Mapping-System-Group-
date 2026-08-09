from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access
from app.db.session import get_db
from app.schemas.tracking import (
    TrackingStartRequest,
    TrackingStartResponse,
    TrackingStopRequest,
    TrackingStopResponse,
    TrackingHistoryResponse,
    TrackingHistoryItem,
)
from app.services.tracking_session_manager import TrackingSessionManager
from app.services.tracking_repository import TrackingPersistenceError, TrackingRepository

router = APIRouter(prefix="/api/tracking", tags=["Tracking"])


def _error_response(status_code: int, error: str, details: str, fix: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error,
            "details": details,
            "fix": fix,
        },
    )


@router.post("/start", response_model=TrackingStartResponse)
def start_tracking(
    payload: TrackingStartRequest,
    db: Session = Depends(get_db),
    _: object = Depends(dashboard_access),
):
    try:
        camera_id, zone_id = TrackingRepository(db).resolve_tracking_context(
            payload.camera_id,
            payload.zone_id,
        )
    except TrackingPersistenceError as exc:
        return _error_response(status.HTTP_400_BAD_REQUEST, exc.error, exc.details, exc.fix)

    session = TrackingSessionManager.start(
        camera_id=camera_id,
        zone_id=zone_id
    )
    return TrackingStartResponse(
        session_id=session.session_id,
        camera_id=session.camera_id,
        zone_id=session.zone_id,
        status=session.status,
    )


@router.post("/stop", response_model=TrackingStopResponse)
def stop_tracking(
    payload: TrackingStopRequest,
    db: Session = Depends(get_db),
    _: object = Depends(dashboard_access),
):
    session = TrackingSessionManager.stop(payload.session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking session not found"
        )

    coordinates = []
    for customer_id, points in session.tracker.full_history().items():
        for p in points:
            coordinates.append({
                "customer_id": customer_id,
                "frame": p["frame"],
                "x": p["x"],
                "y": p["y"],
                "confidence": p.get("confidence", 0.0),
                "camera": session.camera_id,
                "zone": session.zone_id,
            })

    try:
        saved = TrackingRepository(db).bulk_save(coordinates)
    except TrackingPersistenceError as exc:
        return _error_response(status.HTTP_400_BAD_REQUEST, exc.error, exc.details, exc.fix)

    return TrackingStopResponse(
        session_id=session.session_id,
        status=session.status,
        unique_customers_tracked=session.tracker.unique_customer_count(),
        records_saved=saved,
    )


@router.get("/status")
def tracking_status(
    session_id: str | None = Query(default=None),
    _: object = Depends(dashboard_access)
):
    if session_id:
        session = TrackingSessionManager.get(session_id)
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tracking session not found"
            )
        return {
            "session_id": session.session_id,
            "camera_id": session.camera_id,
            "zone_id": session.zone_id,
            "status": session.status,
            "frames_processed": session.frames_processed,
            "unique_customers_tracked": session.tracker.unique_customer_count(),
            "started_at": session.started_at,
        }

    active = TrackingSessionManager.all_active()
    return {
        "active_sessions": len(active),
        "sessions": [
            {
                "session_id": s.session_id,
                "camera_id": s.camera_id,
                "zone_id": s.zone_id,
                "status": s.status,
                "frames_processed": s.frames_processed,
            }
            for s in active
        ],
    }


@router.get("/history", response_model=TrackingHistoryResponse)
def tracking_history(
    customer_id: int | None = Query(default=None),
    camera_id: int | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    limit: int = Query(default=200, le=2000),
    db: Session = Depends(get_db),
):
    rows = TrackingRepository(db).get_history(customer_id, camera_id, zone_id, limit)
    records = [
        TrackingHistoryItem(
            customer_id=r.customer_id,
            camera_id=r.camera_id,
            zone_id=r.zone_id,
            frame=r.frame_number,
            x=r.x,
            y=r.y,
            confidence=r.confidence,
            timestamp=r.timestamp,
        )
        for r in rows
    ]
    return TrackingHistoryResponse(total_records=len(records), records=records)
