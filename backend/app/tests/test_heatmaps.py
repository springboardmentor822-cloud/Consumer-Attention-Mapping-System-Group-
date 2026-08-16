import datetime as dt
import json

from app.models.attention import AttentionEvent
from app.models.enums import CustomerSegmentEnum, HeatmapTypeEnum
from app.models.session import ShopperSession
from app.models.shelf import Shelf
from app.models.store import Store
from app.models.tracking import TrackingData
from app.services.heatmap_service import (
    generate_shelf_or_product_attention_heatmap,
    generate_traffic_or_movement_heatmap,
)

BASE = dt.datetime(2026, 1, 1, 10, 0, 0)


def _make_store(db_session, width=20.0, height=20.0):
    store = Store(name="KDE Store", floor_width_m=width, floor_height_m=height)
    db_session.add(store)
    db_session.commit()
    db_session.refresh(store)
    return store


def _make_session(db_session, store_id, segment=None, shopper_uid="s1"):
    session = ShopperSession(
        store_id=store_id, shopper_uid=shopper_uid, entry_time=BASE, segment=segment
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session


def _add_points(db_session, session, center_x, center_y, n=20):
    for i in range(n):
        p = TrackingData(
            session_id=session.id,
            camera_id=1,
            track_id=1,
            floor_x=center_x + (i % 3) * 0.1,
            floor_y=center_y + (i % 3) * 0.1,
            bbox_x=0,
            bbox_y=0,
            bbox_w=1,
            bbox_h=1,
            detection_confidence=0.9,
            timestamp=BASE + dt.timedelta(seconds=i),
        )
        db_session.add(p)
    db_session.commit()


def test_traffic_heatmap_smooths_a_tight_cluster(db_session):
    store = _make_store(db_session)
    session = _make_session(db_session, store.id)
    _add_points(db_session, session, center_x=10.0, center_y=10.0)

    heatmap = generate_traffic_or_movement_heatmap(
        db_session, store.id, None, HeatmapTypeEnum.TRAFFIC, BASE, BASE + dt.timedelta(minutes=5)
    )

    data = json.loads(heatmap.data)
    # A raw histogram of a 3x3-cell cluster would only ever populate a
    # handful of cells; the Gaussian blur should spread it much further.
    assert len(data["points"]) > 20
    assert data["kde_sigma"] > 0
    # Every point carries both raw and 0-1 normalized intensity.
    assert all("normalized" in p for p in data["points"])
    assert max(p["normalized"] for p in data["points"]) == 1.0


def test_traffic_heatmap_empty_when_no_points(db_session):
    store = _make_store(db_session)

    heatmap = generate_traffic_or_movement_heatmap(
        db_session, store.id, None, HeatmapTypeEnum.TRAFFIC, BASE, BASE + dt.timedelta(minutes=5)
    )

    data = json.loads(heatmap.data)
    assert data["points"] == []


def test_traffic_heatmap_filters_by_segment(db_session):
    store = _make_store(db_session)
    explorer_session = _make_session(db_session, store.id, segment=CustomerSegmentEnum.EXPLORER, shopper_uid="explorer-1")
    quick_session = _make_session(db_session, store.id, segment=CustomerSegmentEnum.QUICK_BUYER, shopper_uid="quick-1")
    _add_points(db_session, explorer_session, center_x=5.0, center_y=5.0)
    _add_points(db_session, quick_session, center_x=15.0, center_y=15.0)

    heatmap = generate_traffic_or_movement_heatmap(
        db_session,
        store.id,
        None,
        HeatmapTypeEnum.TRAFFIC,
        BASE,
        BASE + dt.timedelta(minutes=5),
        segment=CustomerSegmentEnum.EXPLORER,
    )

    data = json.loads(heatmap.data)
    # Density should concentrate near (5,5) in a 20x20-cell grid over a
    # 20m floor - i.e. cell (5, 5) - not spread toward the quick-buyer's
    # cluster at (15, 15) / cell (15, 15).
    hot_cells = {(p["x"], p["y"]) for p in data["points"] if p["normalized"] > 0.5}
    assert any(x < 10 and y < 10 for x, y in hot_cells)
    assert not any(x >= 10 and y >= 10 for x, y in hot_cells)


def test_shelf_heatmap_aggregates_attention_duration(db_session):
    store = _make_store(db_session)
    shelf = Shelf(store_id=store.id, name="Shelf A")
    db_session.add(shelf)
    db_session.commit()
    db_session.refresh(shelf)

    session = _make_session(db_session, store.id)
    for i in range(3):
        db_session.add(
            AttentionEvent(
                session_id=session.id,
                shelf_id=shelf.id,
                camera_id=1,
                start_time=BASE + dt.timedelta(seconds=i * 10),
                duration_seconds=5.0,
            )
        )
    db_session.commit()

    heatmap = generate_shelf_or_product_attention_heatmap(
        db_session, store.id, None, HeatmapTypeEnum.SHELF, BASE, BASE + dt.timedelta(minutes=5)
    )

    data = json.loads(heatmap.data)
    assert data["points"] == [{"shelf_id": shelf.id, "intensity": 15.0}]


def test_shelf_heatmap_filters_by_shelf_id(db_session):
    store = _make_store(db_session)
    shelf_a = Shelf(store_id=store.id, name="Shelf A")
    shelf_b = Shelf(store_id=store.id, name="Shelf B")
    db_session.add_all([shelf_a, shelf_b])
    db_session.commit()
    db_session.refresh(shelf_a)
    db_session.refresh(shelf_b)

    session = _make_session(db_session, store.id)
    db_session.add(
        AttentionEvent(
            session_id=session.id, shelf_id=shelf_a.id, camera_id=1, start_time=BASE, duration_seconds=5.0
        )
    )
    db_session.add(
        AttentionEvent(
            session_id=session.id, shelf_id=shelf_b.id, camera_id=1, start_time=BASE, duration_seconds=8.0
        )
    )
    db_session.commit()

    heatmap = generate_shelf_or_product_attention_heatmap(
        db_session,
        store.id,
        None,
        HeatmapTypeEnum.SHELF,
        BASE,
        BASE + dt.timedelta(minutes=5),
        shelf_id=shelf_a.id,
    )

    data = json.loads(heatmap.data)
    assert data["points"] == [{"shelf_id": shelf_a.id, "intensity": 5.0}]
