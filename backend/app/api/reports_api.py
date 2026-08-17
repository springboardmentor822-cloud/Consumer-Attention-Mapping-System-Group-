from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])


class GenerateReportRequest(BaseModel):
    report_type: str
    format: str = "pdf"
    store_id: Optional[UUID] = None


@router.get("")
def list_reports(
    store_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List available reports."""
    service = ReportService(db)
    return service.list_reports(store_id=store_id)


@router.post("/generate")
def generate_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Retail Analyst", "Marketing Manager")),
):
    """Generate a new report."""
    service = ReportService(db)
    return service.generate_report(
        report_type=payload.report_type,
        format=payload.format,
        store_id=payload.store_id,
        user_id=current_user.id,
    )


@router.get("/{report_id}/download")
def download_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a generated report."""
    service = ReportService(db)
    file_path = service.get_report_path(report_id)
    if not file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found or file missing.")
    return FileResponse(path=file_path, filename=file_path.split("/")[-1])
