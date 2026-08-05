from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import crud
import schemas

from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL REPORTS
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get("/")
def get_reports(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):
    return crud.get_reports(db)


# ==========================================================
# REPORT DASHBOARD
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get(
    "/dashboard",
    response_model=schemas.ReportDashboardResponse
)
def report_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):
    return crud.get_report_dashboard(db)


# ==========================================================
# EXPORT PDF (Camera Wise)
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get("/export/pdf/{camera_id}")
def export_pdf(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):

    file_path = crud.export_report_pdf(
        db,
        camera_id
    )

    return FileResponse(
        path=file_path,
        filename=f"AI_Report_Camera_{camera_id}.pdf",
        media_type="application/pdf"
    )


# ==========================================================
# EXPORT EXCEL (Camera Wise)
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get("/export/excel/{camera_id}")
def export_excel(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):

    file_path = crud.export_report_excel(
        db,
        camera_id
    )

    return FileResponse(
        path=file_path,
        filename=f"AI_Report_Camera_{camera_id}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# ==========================================================
# EXPORT CSV (Camera Wise)
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get("/export/csv/{camera_id}")
def export_csv(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):

    file_path = crud.export_report_csv(
        db,
        camera_id
    )

    return FileResponse(
        path=file_path,
        filename=f"AI_Report_Camera_{camera_id}.csv",
        media_type="text/csv"
    )