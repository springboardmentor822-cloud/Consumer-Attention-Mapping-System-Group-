import csv
import io
import secrets
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from fastapi.security import OAuth2PasswordBearer

_optional_oauth2_scheme_completion = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
from app.models.event_log import EventCategory, EventLog
from app.models.purchase_event import PurchaseEvent
from app.services.heatmap_engine import get_or_generate_heatmap
from app.services.completion_analytics import (
    derive_interactions,
    journey_data,
    purchase_summary,
    conversion_summary,
)

router = APIRouter(prefix="/api/v1/completion", tags=["completion-analytics"])


class PurchaseIn(BaseModel):
    store_id: uuid.UUID
    sku: str
    transaction_id: str
    quantity: int = 1
    amount: float = 0.0
    purchased_at: str | None = None
    shopper_track_id: int | None = None
    camera_id: uuid.UUID | None = None


def _pos_ingest_auth(
    x_pos_api_key: str | None = Header(default=None),
    token: str | None = Depends(_optional_oauth2_scheme_completion),
    session: Session = Depends(get_session),
):
    """
    Two ways in, for two different real callers. A real POS/payment
    system is a server calling this on its own schedule - it should
    hold one long-lived, narrowly-scoped API key (X-POS-API-Key),
    not a human StoreManager's JWT that expires and needs a login
    flow to refresh. A human manually testing this endpoint (e.g. via
    Postman, or the Admin dashboard triggering it directly) still uses
    the normal JWT/role path. secrets.compare_digest avoids a timing
    side-channel on the API key comparison - a naive == comparison
    leaks how many leading characters matched via response timing.
    """
    if x_pos_api_key and settings.POS_WEBHOOK_API_KEY:
        if secrets.compare_digest(x_pos_api_key, settings.POS_WEBHOOK_API_KEY):
            return None  # authenticated as the POS system, no User row
        raise HTTPException(status_code=401, detail="Invalid POS API key")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Provide either X-POS-API-Key or a StoreManager/SuperAdmin Bearer token",
        )
    user = get_current_user(token=token, session=session)
    if not user.role or user.role.name not in ("StoreManager", "SuperAdmin"):
        raise HTTPException(status_code=403, detail="Requires one of roles: ('StoreManager', 'SuperAdmin')")
    return user


@router.get("/{store_id}/cameras/{camera_id}/interactions")
def interactions(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    return derive_interactions(store_id, camera_id)


@router.get("/{store_id}/cameras/{camera_id}/heatmap-layers")
def heatmap_layers(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    """Expose the heatmap layers the current tracking data can support.

    Traffic is person-position density. Product attention/shelf activity is
    product-position density. A true gaze layer still requires gaze/head-pose
    coordinates, which the current tracker does not store.
    """
    traffic = get_or_generate_heatmap(camera_id, class_name=None)
    return {
        "store_id": str(store_id),
        "camera_id": str(camera_id),
        "layers": {
            "traffic": traffic,
        },
        "available_layers": ["traffic", "product_visibility"],
        "unavailable_layers": ["gaze_attention"],
        "data_quality": {
            "traffic": "real_person_tracking",
            "product_visibility": "real_product_tracking",
            "gaze_attention": "unavailable_no_gaze_coordinates",
        },
    }


@router.get("/{store_id}/journey")
def journey(
    store_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    return journey_data(store_id)


@router.get("/{store_id}/conversion")
def conversion(
    store_id: uuid.UUID,
    camera_id: uuid.UUID | None = None,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    return conversion_summary(store_id, camera_id)


@router.get("/{store_id}/purchases")
def purchases(
    store_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    return purchase_summary(store_id)


@router.post("/pos/purchases", status_code=201)
def ingest_purchase(
    payload: PurchaseIn,
    response: Response,
    session: Session = Depends(get_session),
    _=Depends(_pos_ingest_auth),
):
    from datetime import datetime, UTC
    purchased_at = datetime.fromisoformat(payload.purchased_at) if payload.purchased_at else datetime.now(UTC)
    row = PurchaseEvent(
        store_id=payload.store_id,
        sku=payload.sku,
        transaction_id=payload.transaction_id,
        quantity=max(1, payload.quantity),
        amount=max(0.0, payload.amount),
        purchased_at=purchased_at,
        shopper_track_id=payload.shopper_track_id,
        camera_id=payload.camera_id,
    )
    session.add(row)
    try:
        session.commit()
    except IntegrityError:
        # FIXED (real gap): real POS/payment webhooks retry on timeout as
        # standard practice - the same transaction_id arriving twice is
        # expected, normal behavior, not an error condition. Returning the
        # ALREADY-recorded purchase (200, not a new 201) instead of a raw
        # IntegrityError/500 makes this endpoint genuinely idempotent,
        # matching how real webhook receivers (Stripe, etc.) are expected
        # to behave - the caller can safely retry without fear of double-
        # counting revenue or purchase counts.
        session.rollback()
        existing = session.exec(
            select(PurchaseEvent).where(PurchaseEvent.transaction_id == payload.transaction_id)
        ).first()
        if existing:
            response.status_code = 200
            return existing
        raise
    session.refresh(row)
    return row


@router.get("/{store_id}/alerts")
def store_alerts(
    store_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "Analyst", "SuperAdmin")),
):
    rows = session.exec(
        select(EventLog)
        .where(EventLog.category == EventCategory.audit)
        .where(EventLog.event_type.like("alert_%"))
        .order_by(EventLog.created_at.desc())
        .limit(200)
    ).all()
    result = []
    for row in rows:
        metadata = row.event_metadata or {}
        alert = metadata.get("alert") if isinstance(metadata, dict) else None
        if isinstance(alert, dict) and str(alert.get("store_id")) == str(store_id):
            result.append(row)
    return result


@router.get("/{store_id}/report.csv")
def csv_report(
    store_id: uuid.UUID,
    _=Depends(require_roles("StoreManager", "Analyst", "MarketingManager", "SuperAdmin")),
):
    purchase = purchase_summary(store_id)
    journey = journey_data(store_id)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["metric", "value"])
    writer.writerow(["transactions", purchase["transactions"]])
    writer.writerow(["items", purchase["items"]])
    writer.writerow(["revenue", purchase["revenue"]])
    writer.writerow(["journey_sessions", journey["sessions"]])
    writer.writerow(["journey_data_quality", journey["data_quality"]])
    for row in purchase["by_sku"]:
        writer.writerow([f"sku:{row['sku']}:quantity", row["quantity"]])
        writer.writerow([f"sku:{row['sku']}:revenue", row["revenue"]])
    buf = io.BytesIO(out.getvalue().encode("utf-8"))
    return StreamingResponse(buf, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=completion-report.csv"})
