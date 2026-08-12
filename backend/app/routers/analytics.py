from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import io
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.security import require_role, READ_ALL_ROLES
from app.models.store import Store, Zone, Shelf, Product, Camera, AttentionLog
from app.ai.analytics import build_retail_report

from app.services.analytics_service import (
    get_live_analytics_data,
    get_attention_analytics_data,
    get_dwell_analytics_data,
    get_heatmap_analytics_data,
    get_customer_journey_analytics_data,
    get_product_analytics_data,
    get_shelf_analytics_data,
    get_daily_report_data,
    get_weekly_report_data,
    get_monthly_report_data,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])


@router.get("/reports/daily")
@router.get("/stores/{store_id}/reports/daily")
def get_daily_reports_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_daily_report_data(db, store_id)


@router.get("/reports/weekly")
@router.get("/stores/{store_id}/reports/weekly")
def get_weekly_reports_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_weekly_report_data(db, store_id)


@router.get("/reports/monthly")
@router.get("/stores/{store_id}/reports/monthly")
def get_monthly_reports_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_monthly_report_data(db, store_id)


@router.get("/reports")
@router.get("/stores/{store_id}/reports")
def get_store_reports(store_id: int = 1, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        store_id = 1

    zones = db.query(Zone).filter(Zone.store_id == store_id).all()
    zone_ids = [z.id for z in zones]

    if not zone_ids:
        return {
            "average_attention_score": "0.0%",
            "average_dwell_time": "0.0s",
            "top_performing_zone": "None",
            "zone_metrics": [],
            "attention_map_distribution": [],
        }

    avg_attention = (
        db.query(func.avg(AttentionLog.attention_score))
        .filter(AttentionLog.zone_id.in_(zone_ids))
        .scalar() or 0.0
    )
    avg_dwell = (
        db.query(func.avg(AttentionLog.dwell_time))
        .filter(AttentionLog.zone_id.in_(zone_ids))
        .scalar() or 0.0
    )

    zone_metrics = []
    top_zone_name = "None"
    max_attention = -1.0

    for zone in zones:
        count = db.query(AttentionLog).filter(AttentionLog.zone_id == zone.id).count()
        zone_avg_attn = (
            db.query(func.avg(AttentionLog.attention_score))
            .filter(AttentionLog.zone_id == zone.id)
            .scalar() or 0.0
        )

        status = "Optimal" if zone_avg_attn >= 75.0 else "Average" if zone_avg_attn >= 60.0 else "Underperforming"

        zone_metrics.append({
            "zone_id": zone.id,
            "name": zone.name,
            "attention_index": f"{round(zone_avg_attn, 1)}%",
            "dwell_count": f"{count * 8} customers/hr",
            "status": status,
        })

        if zone_avg_attn > max_attention:
            max_attention = zone_avg_attn
            top_zone_name = zone.name

    now = datetime.utcnow()
    attention_map_distribution = []
    for i in range(23, -1, -1):
        hour_start = (now - timedelta(hours=i)).replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        hour_count = db.query(AttentionLog).filter(
            AttentionLog.zone_id.in_(zone_ids),
            AttentionLog.timestamp >= hour_start,
            AttentionLog.timestamp < hour_end,
        ).count()
        attention_map_distribution.append({
            "hour": hour_start.strftime("%H:%M"),
            "value": hour_count,
        })

    return {
        "average_attention_score": f"{round(avg_attention, 1)}%",
        "average_dwell_time": f"{round(avg_dwell, 1)}s",
        "top_performing_zone": top_zone_name,
        "zone_metrics": zone_metrics,
        "attention_map_distribution": attention_map_distribution,
    }


@router.get("/retail-metrics")
@router.get("/stores/{store_id}/retail-metrics")
def get_retail_metrics(store_id: int = 1, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return build_retail_report(get_live_analytics_data(db, store_id))


@router.get("/export/csv")
@router.get("/stores/{store_id}/export/csv")
def export_csv(store_id: int = 1, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    import pandas as pd
    logs = db.query(AttentionLog).join(Zone).filter(Zone.store_id == store_id).all()
    data = [{"ID": log.id, "Zone": log.zone.name, "Timestamp": log.timestamp, "Attention Score": log.attention_score, "Dwell Time (s)": log.dwell_time} for log in logs]
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=store_{store_id}_analytics.csv"
    return response


@router.get("/export/excel")
@router.get("/stores/{store_id}/export/excel")
def export_excel(store_id: int = 1, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    import pandas as pd
    logs = db.query(AttentionLog).join(Zone).filter(Zone.store_id == store_id).all()
    data = [{"ID": log.id, "Zone": log.zone.name, "Timestamp": log.timestamp.replace(tzinfo=None) if log.timestamp else None, "Attention Score": log.attention_score, "Dwell Time (s)": log.dwell_time} for log in logs]
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    df.to_excel(stream, index=False, engine='openpyxl')
    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename=store_{store_id}_analytics.xlsx"
    return response


@router.get("/export/pdf")
@router.get("/stores/{store_id}/export/pdf")
def export_pdf(store_id: int = 1, db: Session = Depends(get_db)):
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    stream = io.BytesIO()
    c = canvas.Canvas(stream, pagesize=letter)
    c.drawString(100, 750, f"Retail Analytics Report - Store {store_id}")
    
    logs = db.query(AttentionLog).join(Zone).filter(Zone.store_id == store_id).limit(50).all()
    y = 710
    c.drawString(100, 730, "Recent 50 Attention Logs:")
    for log in logs:
        text = f"Zone: {log.zone.name} | Dwell: {log.dwell_time}s | Score: {log.attention_score}"
        c.drawString(100, y, text)
        y -= 15
        if y < 50:
            c.showPage()
            y = 750
            
    c.save()
    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=store_{store_id}_analytics.pdf"
    return response


# ---------------------------------------------------------
# 7 DEDICATED ANALYTICS ENDPOINTS
# ---------------------------------------------------------

@router.get("/live")
@router.get("/stores/{store_id}/live")
def get_live_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_live_analytics_data(db, store_id)


@router.get("/attention")
@router.get("/stores/{store_id}/attention")
def get_attention_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_attention_analytics_data(db, store_id)


@router.get("/dwell")
@router.get("/stores/{store_id}/dwell")
def get_dwell_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_dwell_analytics_data(db, store_id)


@router.get("/heatmap")
@router.get("/stores/{store_id}/heatmap")
def get_heatmap_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_heatmap_analytics_data(db, store_id)


@router.get("/customer-journey")
@router.get("/stores/{store_id}/customer-journey")
def get_customer_journey_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_customer_journey_analytics_data(db, store_id)


@router.get("/products")
@router.get("/stores/{store_id}/products")
def get_product_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_product_analytics_data(db, store_id)


@router.get("/shelves")
@router.get("/stores/{store_id}/shelves")
def get_shelf_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_shelf_analytics_data(db, store_id)
