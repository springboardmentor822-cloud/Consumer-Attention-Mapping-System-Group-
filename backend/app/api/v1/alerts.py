from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.services import alerts as alert_service

router = APIRouter()

class AlertTriggerRequest(BaseModel):
    store_id: str = "STORE-812"
    type: str  # SHELF_PERFORMANCE, PRODUCT_VISIBILITY, TRAFFIC_ANOMALY, CAMERA_HEALTH
    level: str = "WARNING"  # WARNING, INFO, ALERT, CRITICAL
    title: str
    description: str
    source_id: Optional[str] = None

@router.get("")
def get_alerts(
    store_id: str = "STORE-812",
    type: Optional[str] = Query(None, alias="type"),
    level: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return alert_service.get_alerts(db, store_id=store_id, alert_type=type, level=level, acknowledged=acknowledged)

@router.post("/trigger")
def trigger_alert(payload: AlertTriggerRequest, db: Session = Depends(get_db)):
    return alert_service.trigger_custom_alert(
        db,
        store_id=payload.store_id,
        alert_type=payload.type,
        level=payload.level,
        title=payload.title,
        description=payload.description,
        source_id=payload.source_id
    )

@router.post("/evaluate")
def evaluate_rules(store_id: str = "STORE-812", db: Session = Depends(get_db)):
    generated = alert_service.evaluate_all_rules(db, store_id=store_id)
    return {
        "status": "EVALUATION_COMPLETE",
        "generated_count": len(generated),
        "alerts": [g.id for g in generated]
    }

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    success = alert_service.acknowledge_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "SUCCESS", "message": f"Alert {alert_id} acknowledged"}
