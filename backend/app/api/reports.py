import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.core.db import get_session
from app.core.deps import require_roles
from app.models.store import Store
from app.services.report_export import build_report_data, render_pdf, render_excel

router = APIRouter()


@router.get("/{store_id}/reports/export")
def export_report(
    store_id: uuid.UUID,
    format: str = "pdf",
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    if format not in ("pdf", "excel"):
        raise HTTPException(status_code=400, detail="format must be 'pdf' or 'excel'")

    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    data = build_report_data(store_id)

    if format == "pdf":
        buffer = render_pdf(store, data)
        media_type = "application/pdf"
        ext = "pdf"
    else:
        buffer = render_excel(store, data)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"

    # Store name may contain characters unsafe for a filename (or the
    # hidden-whitespace issue already found on this project once this
    # session) - strip rather than trust it verbatim.
    safe_name = "".join(c for c in store.name.strip() if c.isalnum() or c in (" ", "-", "_")).strip()
    filename = f"{safe_name or 'store'}_report.{ext}"

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
