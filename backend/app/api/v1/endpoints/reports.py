import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.analytics import Report
from app.models.user import User
from app.schemas.analytics import ReportCreateRequest, ReportOut
from app.services.report_service import generate_report_file

router = APIRouter()


@router.post("", response_model=ReportOut, status_code=201)
def request_report(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(
        store_id=payload.store_id,
        requested_by_id=current_user.id,
        report_type=payload.report_type,
        report_format=payload.report_format,
        period_start=payload.period_start,
        period_end=payload.period_end,
        status="generating",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    try:
        filepath = generate_report_file(db, report)
        report.file_path = filepath
        report.status = "ready"
        report.completed_at = dt.datetime.utcnow()
    except Exception as exc:  # noqa: BLE001
        report.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}") from exc

    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[ReportOut])
def list_reports(
    store_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Report)
    if store_id:
        query = query.filter(Report.store_id == store_id)
    return query.order_by(Report.created_at.desc()).all()


@router.get("/{report_id}/download")
def download_report(
    report_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or report.status != "ready" or not report.file_path:
        raise HTTPException(status_code=404, detail="Report not ready or not found")
    return FileResponse(
        path=report.file_path,
        filename=report.file_path.split("/")[-1],
        media_type="application/octet-stream",
    )
