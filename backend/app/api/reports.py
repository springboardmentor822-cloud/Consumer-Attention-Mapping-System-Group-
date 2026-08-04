from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from typing import Optional, Any
from app.core.database import get_db
from app.api.auth import get_current_user, get_user_email
from app.models import Store, Shelf
from app.utils.logging import get_structured_logger
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = get_structured_logger("reports_api")
router = APIRouter()

@router.get(
    "/export/pdf",
    summary="Export PDF Report",
    description="Generates and downloads a PDF performance report covering registered store footprint details.",
    response_class=StreamingResponse
)
def export_pdf(
    store_id: Optional[str] = Query(None, description="Optional store filter ID"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    user_email = get_user_email(current_user)
    logger.info(f"User {user_email} requested PDF export", extra={"store_id": store_id, "user": user_email})
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#4f46e5'),
            spaceAfter=15
        )
        
        # Title
        story.append(Paragraph("Consumer Attention Mapping System", title_style))
        story.append(Paragraph("Executive Performance & Attention Intelligence Report", styles['Heading2']))
        story.append(Spacer(1, 15))
        
        # Store overview
        stores_query = db.query(Store)
        if store_id:
            stores_query = stores_query.filter(Store.id == store_id)
        stores = stores_query.all()
        
        story.append(Paragraph("Active Store Footprint Details", styles['Heading3']))
        story.append(Spacer(1, 8))
        
        table_data = [["Store ID", "Name", "Location/Address", "Shelves"]]
        for store in stores:
            shelf_count = db.query(Shelf).filter(Shelf.store_id == store.id).count()
            table_data.append([store.id, store.name, store.address, str(shelf_count)])
            
        t = Table(table_data, colWidths=[150, 150, 150, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f1f5f9')]),
        ]))
        story.append(t)
        
        doc.build(story)
        buffer.seek(0)
        logger.info(f"PDF export compiled successfully for user {user_email}")
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=attention_intelligence_report.pdf"}
        )
    except Exception as e:
        logger.error(f"Failed to export PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error generating report")


@router.get(
    "/export/excel",
    summary="Export Excel Report",
    description="Generates and downloads an Excel performance spreadsheet detailing store layouts and metrics.",
    response_class=StreamingResponse
)
def export_excel(
    store_id: Optional[str] = Query(None, description="Optional store filter ID"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    user_email = get_user_email(current_user)
    logger.info(f"User {user_email} requested Excel export", extra={"store_id": store_id, "user": user_email})
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Store Performance Overview"
        
        # Font setups
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=16, bold=True, color="4F46E5")
        cell_font = Font(name="Calibri", size=11)
        
        fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
        align = Alignment(horizontal="center", vertical="center")
        
        # Title Block
        ws['A1'] = "Consumer Attention Mapping System - Performance Report"
        ws['A1'].font = title_font
        ws.merge_cells('A1:D1')
        ws.row_dimensions[1].height = 30
        
        ws.append([]) # spacer
        
        # Headers
        headers = ["Store ID", "Name", "Location", "Total Shelves"]
        ws.append(headers)
        ws.row_dimensions[3].height = 20
        
        for col_idx, h in enumerate(headers, 1):
            cell = ws.cell(row=3, column=col_idx)
            cell.font = header_font
            cell.fill = fill
            cell.alignment = align
            
        # Query database
        stores_query = db.query(Store)
        if store_id:
            stores_query = stores_query.filter(Store.id == store_id)
        stores = stores_query.all()
        
        for store in stores:
            shelf_count = db.query(Shelf).filter(Shelf.store_id == store.id).count()
            ws.append([store.id, store.name, store.address, shelf_count])
            
        for row in range(4, len(stores) + 4):
            for col in range(1, 5):
                ws.cell(row=row, column=col).font = cell_font
                
        # Auto-fit columns
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
            
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        logger.info(f"Excel export compiled successfully for user {user_email}")
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=attention_intelligence_report.xlsx"}
        )
    except Exception as e:
        logger.error(f"Failed to export Excel: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error generating report")
