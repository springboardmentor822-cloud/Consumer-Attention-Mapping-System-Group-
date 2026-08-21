from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.services import reporting as report_service

router = APIRouter()

@router.get("/export")
def export_report(
    store_id: str = "STORE-812",
    report_type: str = Query("daily", description="daily, weekly, monthly, custom"),
    format: str = Query("csv", description="csv, excel, pdf, json"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    zone_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if format in ["csv", "excel"]:
        csv_content = report_service.generate_csv_report(
            db, store_id=store_id, report_type=report_type,
            start_date=start_date, end_date=end_date, zone_id=zone_id
        )
        file_name = f"{report_type.capitalize()}_Report_{store_id}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )
    elif format == "pdf":
        summary, headers, rows = report_service.generate_report_data(
            db, store_id=store_id, report_type=report_type,
            start_date=start_date, end_date=end_date, zone_id=zone_id
        )
        # Structured HTML print payload suitable for PDF printing
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{summary['title']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }}
                h1 {{ color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #cbd5e1; padding: 10px; text-align: left; }}
                th {{ background-color: #f1f5f9; font-weight: bold; }}
                .summary {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <h1>{summary['title']}</h1>
            <p><strong>Generated At:</strong> {summary['date_generated']}</p>
            <table>
                <thead>
                    <tr>{"".join(f"<th>{h}</th>" for h in headers)}</tr>
                </thead>
                <tbody>
                    {"".join("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>" for row in rows)}
                </tbody>
            </table>
            <div class="summary">
                <h3>Executive Summary Metrics</h3>
                <ul>
                    {"".join(f"<li><strong>{k.replace('_', ' ').title()}:</strong> {v}</li>" for k, v in summary.items() if k not in ['title', 'date_generated'])}
                </ul>
            </div>
        </body>
        </html>
        """
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"inline; filename={report_type}_report.html"}
        )
    else:
        # json format
        return report_service.generate_formatted_report_json(
            db, store_id=store_id, report_type=report_type,
            start_date=start_date, end_date=end_date, zone_id=zone_id
        )
