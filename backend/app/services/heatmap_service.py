"""
Aggregates raw tracking_data / attention_event rows into a grid-based
heatmap. Grid resolution is fixed at GRID_SIZE x GRID_SIZE cells across
the store's floor-plan dimensions (falls back to a normalized 0-1 grid
if the store has no physical dimensions set).

Traffic/movement heatmaps are smoothed with a Gaussian Kernel Density
Estimate (scipy.ndimage.gaussian_filter) rather than returned as a raw
per-cell histogram - this is what turns "N shoppers happened to be
detected in cell (3, 7)" into the smooth, continuous-looking density
surface ("red = high activity, blue = low activity") retail heatmaps
are expected to look like, and avoids single-cell spikes from a sparse
sample dominating the visual.
"""
import datetime as dt
import json

import numpy as np
from scipy.ndimage import gaussian_filter
from sqlalchemy.orm import Session

from app.models.analytics import Heatmap
from app.models.enums import CustomerSegmentEnum, HeatmapTypeEnum
from app.models.session import ShopperSession
from app.models.store import Store
from app.models.tracking import TrackingData
from app.models.attention import AttentionEvent

GRID_SIZE = 20
# Std. dev (in grid cells) of the Gaussian kernel used to blur the raw
# point histogram into a smooth density surface.
KDE_SIGMA = 1.1


def _bucket(value: float, dimension: float, grid_size: int = GRID_SIZE) -> int:
    if dimension <= 0:
        dimension = 1.0
    idx = int((value / dimension) * grid_size)
    return max(0, min(grid_size - 1, idx))


def generate_traffic_or_movement_heatmap(
    db: Session,
    store_id: int,
    camera_id: int | None,
    heatmap_type: HeatmapTypeEnum,
    period_start: dt.datetime,
    period_end: dt.datetime,
    segment: CustomerSegmentEnum | None = None,
) -> Heatmap:
    store = db.query(Store).filter(Store.id == store_id).first()
    width = store.floor_width_m if store and store.floor_width_m else 1.0
    height = store.floor_height_m if store and store.floor_height_m else 1.0

    query = db.query(TrackingData).join(TrackingData.session).filter(
        TrackingData.timestamp >= period_start,
        TrackingData.timestamp <= period_end,
    )
    if camera_id:
        query = query.filter(TrackingData.camera_id == camera_id)
    if segment:
        query = query.filter(ShopperSession.segment == segment)

    raw_grid = np.zeros((GRID_SIZE, GRID_SIZE), dtype=float)
    for point in query.all():
        if point.floor_x is None or point.floor_y is None:
            continue
        gx = _bucket(point.floor_x, width)
        gy = _bucket(point.floor_y, height)
        raw_grid[gy, gx] += 1

    # Gaussian KDE: blur the discrete histogram into a smooth density
    # surface. mode="constant" so traffic doesn't wrap around store edges.
    smoothed = gaussian_filter(raw_grid, sigma=KDE_SIGMA, mode="constant") if raw_grid.sum() > 0 else raw_grid
    peak = float(smoothed.max())

    points = [
        {
            "x": x,
            "y": y,
            "intensity": round(float(smoothed[y, x]), 4),
            # 0-1 normalized against the hottest cell, handy for direct
            # opacity/color-scale mapping on the frontend.
            "normalized": round(float(smoothed[y, x] / peak), 4) if peak > 0 else 0.0,
        }
        for y in range(GRID_SIZE)
        for x in range(GRID_SIZE)
        if smoothed[y, x] > 1e-6
    ]

    heatmap = Heatmap(
        store_id=store_id,
        camera_id=camera_id,
        heatmap_type=heatmap_type,
        period_start=period_start,
        period_end=period_end,
        data=json.dumps({"grid_size": GRID_SIZE, "kde_sigma": KDE_SIGMA, "points": points}),
    )
    db.add(heatmap)
    db.commit()
    db.refresh(heatmap)
    return heatmap


def generate_shelf_or_product_attention_heatmap(
    db: Session,
    store_id: int,
    camera_id: int | None,
    heatmap_type: HeatmapTypeEnum,
    period_start: dt.datetime,
    period_end: dt.datetime,
    shelf_id: int | None = None,
) -> Heatmap:
    query = db.query(AttentionEvent).filter(
        AttentionEvent.start_time >= period_start,
        AttentionEvent.start_time <= period_end,
    )
    if camera_id:
        query = query.filter(AttentionEvent.camera_id == camera_id)
    if shelf_id:
        query = query.filter(AttentionEvent.shelf_id == shelf_id)

    shelf_totals: dict[int, float] = {}
    for event in query.all():
        if event.shelf_id is None:
            continue
        shelf_totals[event.shelf_id] = shelf_totals.get(event.shelf_id, 0.0) + (
            event.duration_seconds or 0.0
        )

    points = [
        {"shelf_id": shelf_id, "intensity": round(seconds, 2)}
        for shelf_id, seconds in shelf_totals.items()
    ]

    heatmap = Heatmap(
        store_id=store_id,
        camera_id=camera_id,
        heatmap_type=heatmap_type,
        period_start=period_start,
        period_end=period_end,
        data=json.dumps({"points": points}),
    )
    db.add(heatmap)
    db.commit()
    db.refresh(heatmap)
    return heatmap


def generate_heatmap(
    db: Session,
    store_id: int,
    camera_id: int | None,
    heatmap_type: HeatmapTypeEnum,
    period_start: dt.datetime,
    period_end: dt.datetime,
    segment: CustomerSegmentEnum | None = None,
    shelf_id: int | None = None,
) -> Heatmap:
    if heatmap_type in (
        HeatmapTypeEnum.TRAFFIC,
        HeatmapTypeEnum.MOVEMENT,
        HeatmapTypeEnum.OCCUPANCY,
    ):
        return generate_traffic_or_movement_heatmap(
            db, store_id, camera_id, heatmap_type, period_start, period_end, segment=segment
        )
    return generate_shelf_or_product_attention_heatmap(
        db, store_id, camera_id, heatmap_type, period_start, period_end, shelf_id=shelf_id
    )
