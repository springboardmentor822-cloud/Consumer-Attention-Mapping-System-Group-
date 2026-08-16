import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.analytics import Heatmap
from app.models.enums import CustomerSegmentEnum, HeatmapTypeEnum
from app.models.user import User
from app.schemas.analytics import HeatmapGenerateRequest, HeatmapOut
from app.services.heatmap_service import generate_heatmap

router = APIRouter()


@router.post("/generate", response_model=HeatmapOut, status_code=201)
def generate(
    payload: HeatmapGenerateRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return generate_heatmap(
        db=db,
        store_id=payload.store_id,
        camera_id=payload.camera_id,
        heatmap_type=payload.heatmap_type,
        period_start=payload.period_start,
        period_end=payload.period_end,
        segment=payload.segment,
        shelf_id=payload.shelf_id,
    )


@router.get("", response_model=list[HeatmapOut])
def list_heatmaps(
    store_id: int | None = None,
    heatmap_type: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Heatmap)
    if store_id:
        query = query.filter(Heatmap.store_id == store_id)
    if heatmap_type:
        query = query.filter(Heatmap.heatmap_type == heatmap_type)
    return query.order_by(Heatmap.generated_at.desc()).offset(skip).limit(limit).all()


@router.get("/store", response_model=HeatmapOut)
def store_heatmap(
    store_id: int,
    period_start: dt.datetime,
    period_end: dt.datetime,
    camera_id: int | None = None,
    segment: CustomerSegmentEnum | None = None,
    heatmap_type: HeatmapTypeEnum = HeatmapTypeEnum.TRAFFIC,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Store-level traffic/movement KDE heatmap, generated on the fly and
    filterable by store, date range, camera, and shopper segment - as
    specced (`/api/v1/heatmaps/store`)."""
    return generate_heatmap(
        db=db,
        store_id=store_id,
        camera_id=camera_id,
        heatmap_type=heatmap_type,
        period_start=period_start,
        period_end=period_end,
        segment=segment,
    )


@router.get("/shelf", response_model=HeatmapOut)
def shelf_heatmap(
    store_id: int,
    period_start: dt.datetime,
    period_end: dt.datetime,
    shelf_id: int | None = None,
    camera_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Shelf/product gaze-attention heatmap, filterable by store, shelf,
    and date range - as specced (`/api/v1/heatmaps/shelf`)."""
    return generate_heatmap(
        db=db,
        store_id=store_id,
        camera_id=camera_id,
        heatmap_type=HeatmapTypeEnum.SHELF,
        period_start=period_start,
        period_end=period_end,
        shelf_id=shelf_id,
    )
