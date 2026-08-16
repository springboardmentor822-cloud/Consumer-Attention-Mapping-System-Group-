import datetime as dt
import os

from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from sqlalchemy.orm import Session

from app.models.analytics import ProductAttractivenessScore, Report
from app.models.enums import ReportFormatEnum, ReportTypeEnum
from app.models.interaction import ProductInteraction
from app.models.attention import AttentionEvent
from app.models.product import Product
from app.models.session import ShopperSession

REPORTS_DIR = os.environ.get("REPORTS_STORAGE_DIR", "/tmp/attention_mapping_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def _gather_report_rows(db: Session, report: Report) -> list[dict]:
    """Pulls the underlying metrics for the requested report type/period."""
    rows: list[dict] = []

    if report.report_type == ReportTypeEnum.CONSUMER_ATTENTION:
        events = (
            db.query(AttentionEvent)
            .join(AttentionEvent.session)
            .filter(
                ShopperSession.store_id == report.store_id,
                AttentionEvent.start_time >= report.period_start,
                AttentionEvent.start_time <= report.period_end,
            )
            .all()
        )
        for e in events:
            rows.append(
                {
                    "session_id": e.session_id,
                    "shelf_id": e.shelf_id,
                    "product_id": e.product_id,
                    "start_time": str(e.start_time),
                    "duration_seconds": e.duration_seconds or 0,
                }
            )

    elif report.report_type == ReportTypeEnum.PRODUCT_ENGAGEMENT:
        interactions = (
            db.query(ProductInteraction)
            .join(ProductInteraction.session)
            .filter(
                ShopperSession.store_id == report.store_id,
                ProductInteraction.timestamp >= report.period_start,
                ProductInteraction.timestamp <= report.period_end,
            )
            .all()
        )
        for i in interactions:
            rows.append(
                {
                    "product_id": i.product_id,
                    "interaction_type": i.interaction_type.value,
                    "timestamp": str(i.timestamp),
                }
            )

    elif report.report_type in (ReportTypeEnum.CONVERSION, ReportTypeEnum.MARKETING):
        scores = (
            db.query(ProductAttractivenessScore)
            .join(Product)
            .filter(
                ProductAttractivenessScore.period_start >= report.period_start,
                ProductAttractivenessScore.period_end <= report.period_end,
            )
            .all()
        )
        for s in scores:
            rows.append(
                {
                    "product_id": s.product_id,
                    "total_score": s.total_score,
                    "pickup_rate_score": s.pickup_rate_score,
                    "conversion_rate_score": s.conversion_rate_score,
                }
            )

    else:  # SHELF_PERFORMANCE
        events = (
            db.query(AttentionEvent)
            .join(AttentionEvent.session)
            .filter(
                ShopperSession.store_id == report.store_id,
                AttentionEvent.shelf_id.isnot(None),
                AttentionEvent.start_time >= report.period_start,
                AttentionEvent.start_time <= report.period_end,
            )
            .all()
        )
        shelf_totals: dict[int, float] = {}
        for e in events:
            shelf_totals[e.shelf_id] = shelf_totals.get(e.shelf_id, 0) + (e.duration_seconds or 0)
        for shelf_id, total in shelf_totals.items():
            rows.append({"shelf_id": shelf_id, "total_attention_seconds": round(total, 2)})

    return rows


def _write_pdf(report: Report, rows: list[dict], filepath: str) -> None:
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(f"{report.report_type.value.replace('_', ' ').title()} Report", styles["Title"]),
        Paragraph(
            f"Store ID: {report.store_id} | Period: {report.period_start} to {report.period_end}",
            styles["Normal"],
        ),
    ]

    if rows:
        headers = list(rows[0].keys())
        table_data = [headers] + [[str(row.get(h, "")) for h in headers] for row in rows[:500]]
        table = Table(table_data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(table)
    else:
        elements.append(Paragraph("No data available for the selected period.", styles["Normal"]))

    doc.build(elements)


def _write_excel(report: Report, rows: list[dict], filepath: str) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = report.report_type.value[:31]

    if rows:
        headers = list(rows[0].keys())
        ws.append(headers)
        for row in rows:
            ws.append([row.get(h, "") for h in headers])
    else:
        ws.append(["No data available for the selected period."])

    wb.save(filepath)


def generate_report_file(db: Session, report: Report) -> str:
    rows = _gather_report_rows(db, report)

    timestamp = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    extension = "pdf" if report.report_format == ReportFormatEnum.PDF else "xlsx"
    filename = f"report_{report.id}_{report.report_type.value}_{timestamp}.{extension}"
    filepath = os.path.join(REPORTS_DIR, filename)

    if report.report_format == ReportFormatEnum.PDF:
        _write_pdf(report, rows, filepath)
    else:
        _write_excel(report, rows, filepath)

    return filepath
