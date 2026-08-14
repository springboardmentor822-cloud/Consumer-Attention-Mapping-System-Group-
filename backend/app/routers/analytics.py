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
    from app.models.store import ShopperSession, ProductMetric, Shelf, Recommendation, Alert

    logs = db.query(AttentionLog).join(Zone).filter(Zone.store_id == store_id).all()
    logs_data = [{"ID": log.id, "Zone": log.zone.name, "Timestamp": log.timestamp.replace(tzinfo=None) if log.timestamp else None, "Attention Score": log.attention_score, "Dwell Time (s)": log.dwell_time} for log in logs]
    df_logs = pd.DataFrame(logs_data)

    metrics = db.query(ProductMetric).filter(ProductMetric.store_id == store_id).all()
    metrics_data = []
    for m in metrics:
        prod = db.query(Product).get(m.product_id)
        metrics_data.append({
            "Rank": m.rank,
            "Product Name": prod.product_name if prod else f"Product #{m.product_id}",
            "Attractiveness Score": m.attractiveness_score,
            "Attention Duration (s)": m.attention_duration,
            "Interaction Freq": m.interaction_frequency,
            "Pickup Rate (%)": m.pickup_rate,
            "Conversion Rate (%)": m.conversion_rate,
            "Repeat Engagement (%)": m.repeat_engagement,
            "Visibility Score": m.visibility_score,
        })
    df_metrics = pd.DataFrame(metrics_data)

    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    shelf_data = [{
        "Shelf Name": s.label or s.shelf_name,
        "Occupancy (%)": s.occupancy_percentage,
        "Visitors Count": s.visitors_count,
        "Avg Dwell (s)": s.average_dwell_time,
        "Attention Score": s.attention_score,
        "Status": s.shelf_status
    } for s in shelves]
    df_shelves = pd.DataFrame(shelf_data)

    sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).all()
    session_data = [{
        "Session ID": s.id,
        "Shopper Segment": s.shopper_segment,
        "Total Dwell (s)": s.total_dwell,
        "Attention Duration (s)": s.attention_duration,
        "Product Pickups": s.product_pickups,
        "Purchases": s.purchases,
        "Visited Zones": s.visited_zones
    } for s in sessions]
    df_sessions = pd.DataFrame(session_data)

    recs = db.query(Recommendation).filter(Recommendation.store_id == store_id).all()
    rec_data = [{
        "Category": r.category,
        "Target": r.target_name,
        "Current Problem": r.current_problem,
        "Recommendation": r.recommendation_text,
        "Priority": r.priority
    } for r in recs]
    df_recs = pd.DataFrame(rec_data)

    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df_logs.to_excel(writer, sheet_name='Attention Logs', index=False)
        df_metrics.to_excel(writer, sheet_name='Product Attractiveness', index=False)
        df_shelves.to_excel(writer, sheet_name='Shelf Performance', index=False)
        df_sessions.to_excel(writer, sheet_name='Shopper Segmentation', index=False)
        df_recs.to_excel(writer, sheet_name='AI Recommendations', index=False)

    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename=store_{store_id}_comprehensive_report.xlsx"
    return response


@router.get("/export/pdf")
@router.get("/stores/{store_id}/export/pdf")
def export_pdf(store_id: int = 1, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from app.models.store import ProductMetric, Shelf, Recommendation, ShopperSession

    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=0,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    # 1. Header
    story.append(Paragraph(f"Consumer Attention & Retail Performance Report", title_style))
    story.append(Paragraph(f"Store ID: {store_id} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Platform: CAMS AI Engine", subtitle_style))

    # 2. Executive Summary Metrics Table
    sessions_cnt = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).count()
    metrics = db.query(ProductMetric).filter(ProductMetric.store_id == store_id).all()
    avg_score = round(sum(m.attractiveness_score for m in metrics) / len(metrics), 2) if metrics else 0.0

    summary_table_data = [
        ["Metric Category", "Current Value", "Performance Status"],
        ["Total Shopper Sessions Tracked", str(sessions_cnt), "Optimal"],
        ["Average Product Attractiveness Score", f"{avg_score} / 100", "Healthy"],
        ["Top Performing Shelf Zone", "Beverage Shelf A1", "High Conversion"],
        ["Active AI Recommendations", str(db.query(Recommendation).count()), "Action Required"]
    ]
    t_summary = Table(summary_table_data, colWidths=[200, 150, 150])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(Paragraph("Executive Summary", h2_style))
    story.append(t_summary)
    story.append(Spacer(1, 12))

    # 3. Product Attractiveness Scores
    story.append(Paragraph("Product Attractiveness Rankings (0.35 Attn + 0.25 Inter + 0.20 Pick + 0.15 Conv + 0.05 Rep)", h2_style))
    p_headers = ["Rank", "Product Name", "Attention", "Interaction", "Pickup %", "Conv %", "Score"]
    p_rows = [p_headers]
    for m in metrics:
        prod = db.query(Product).get(m.product_id)
        p_rows.append([
            str(m.rank),
            prod.product_name if prod else f"Product #{m.product_id}",
            f"{m.attention_duration:.1f}s",
            f"{m.interaction_frequency:.0f}",
            f"{m.pickup_rate:.0f}%",
            f"{m.conversion_rate:.0f}%",
            f"{m.attractiveness_score:.2f}"
        ])
    t_products = Table(p_rows, colWidths=[35, 160, 65, 65, 60, 55, 60])
    t_products.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t_products)
    story.append(Spacer(1, 12))

    # 4. Recommendations
    story.append(Paragraph("Strategic AI Recommendations", h2_style))
    recs = db.query(Recommendation).filter(Recommendation.store_id == store_id).limit(5).all()
    for idx, r in enumerate(recs, 1):
        story.append(Paragraph(f"<b>{idx}. [{r.category}] Target: {r.target_name} (Priority: {r.priority})</b>", body_style))
        story.append(Paragraph(f"• Problem: {r.current_problem}", body_style))
        story.append(Paragraph(f"• Action: {r.recommendation_text}", body_style))
        story.append(Spacer(1, 4))

    doc.build(story)
    stream.seek(0)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=store_{store_id}_analytics_report.pdf"
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
