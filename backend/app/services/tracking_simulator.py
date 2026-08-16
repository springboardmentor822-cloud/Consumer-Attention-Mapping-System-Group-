"""
Simulated tracking producer.

The assignment calls for YOLOv8 (object detection) + ByteTrack (multi-object
tracking) reading real camera video. That needs an actual video dataset and
a GPU to train/run - neither is available in this environment. The
assignment itself allows for this exact substitution: the Retail Store
Traffic Dataset is meant to "simulate live camera feeds and validate our
analytical math" - so this module IS that simulated feed.

What's real, not simulated: everything downstream of this file. The Redis
Stream, the batching consumer, the Postgres writes, the WebSocket push, and
the frontend heatmap all run for real against whatever this producer emits.
Swapping this simulator for a real YOLOv8 + ByteTrack pipeline later is a
drop-in replacement - it would just call `push_point()` with real detections
instead of simulated ones; nothing else in the pipeline needs to change.
"""
import asyncio
import datetime as dt
import json
import logging
import random
import uuid

from sqlalchemy.orm import Session

from app.core.redis_client import get_redis, occupancy_key, stream_key
from app.database import SessionLocal
from app.models.camera import Camera
from app.models.enums import CameraStatusEnum, CameraTypeEnum
from app.models.session import ShopperSession
from app.models.store import Store, StoreZone
from app.services.attention_tracking import (
    AttentionState,
    close_attention,
    load_shelf_targets,
    update_attention,
)
from app.services.occupancy_alerts import check_overcrowding

logger = logging.getLogger("tracking_simulator")

TICK_SECONDS = 1.0  # one simulated "sample" per second (throttled for a live browser dashboard)
SPAWN_CHANCE_PER_TICK = 0.35  # chance a new shopper walks in on any given tick
MAX_CONCURRENT_SHOPPERS = 12

ZONE_DEFS = [
    {"name": "Entrance / Exit Foyer", "description": "Zone A - net foot traffic count", "min_ticks": 2, "max_ticks": 4},
    {"name": "Main Product Aisle", "description": "Zone B - shelf dwell, gaze, product interaction", "min_ticks": 5, "max_ticks": 14},
    {"name": "Checkout Lanes", "description": "Zone C - bottleneck / queue length", "min_ticks": 3, "max_ticks": 8},
]

CAMERA_DEFS = [
    {"name": "Camera 1 - Entrance", "zone_index": 0},
    {"name": "Camera 2 - Aisle (North)", "zone_index": 1},
    {"name": "Camera 3 - Aisle (South)", "zone_index": 1},
    {"name": "Camera 4 - Checkout", "zone_index": 2},
]

_running: dict[int, dict[str, asyncio.Task]] = {}


def is_running(store_id: int) -> bool:
    return store_id in _running


def _ensure_zones_and_cameras(db: Session, store_id: int) -> tuple[list[StoreZone], list[Camera]]:
    """Creates the 3 zones / 4 cameras from the assignment brief if the store
    doesn't already have them, so a manager can hit "Start" without a manual
    setup step first."""
    zones = db.query(StoreZone).filter(StoreZone.store_id == store_id).order_by(StoreZone.id).all()
    if not zones:
        store = db.query(Store).filter(Store.id == store_id).first()
        floor_w = store.floor_width_m if store and store.floor_width_m else 20.0
        floor_h = store.floor_height_m if store and store.floor_height_m else 12.0

        zones = []
        for i, z in enumerate(ZONE_DEFS):
            # Horizontal bands stacked top to bottom, one per zone - the
            # same layout _VirtualShopper.step() already walks through
            # (band_top/band_bottom = zone_idx/3, (zone_idx+1)/3) and what
            # the live-tracking canvas draws, so the store-layout view and
            # the actual simulated dots always agree on where each zone is.
            band_top = (i / len(ZONE_DEFS)) * floor_h
            band_bottom = ((i + 1) / len(ZONE_DEFS)) * floor_h
            polygon = [
                [0, band_top],
                [floor_w, band_top],
                [floor_w, band_bottom],
                [0, band_bottom],
            ]
            zone = StoreZone(
                store_id=store_id,
                name=z["name"],
                description=z["description"],
                polygon_coordinates=json.dumps(polygon),
            )
            db.add(zone)
            zones.append(zone)
        db.commit()
        for z in zones:
            db.refresh(z)

    cameras = db.query(Camera).filter(Camera.store_id == store_id).order_by(Camera.id).all()
    if not cameras:
        cameras = []
        for c in CAMERA_DEFS:
            zone = zones[c["zone_index"]] if c["zone_index"] < len(zones) else None
            cam = Camera(
                store_id=store_id,
                zone_id=zone.id if zone else None,
                name=c["name"],
                camera_type=CameraTypeEnum.IP_CAMERA,
                status=CameraStatusEnum.ONLINE,
                fps=30,
            )
            db.add(cam)
            cameras.append(cam)
        db.commit()
        for c in cameras:
            db.refresh(c)

    return zones, cameras


def ensure_zones_and_cameras(db: Session, store_id: int) -> tuple[list[StoreZone], list[Camera]]:
    """Public entry point - same setup, usable by the real detection
    pipeline (detection_pipeline.py) as well as this simulator, so an
    uploaded-video run and a simulated run land on identical store layout."""
    return _ensure_zones_and_cameras(db, store_id)


class _VirtualShopper:
    __slots__ = (
        "track_id", "session_id", "zone_idx", "ticks_in_zone", "ticks_target", "x", "y",
        "zones_visited", "distance_m", "attention",
    )

    def __init__(self, track_id: int, session_id: int):
        self.track_id = track_id
        self.session_id = session_id
        self.zone_idx = 0
        self.ticks_in_zone = 0
        self.ticks_target = random.randint(ZONE_DEFS[0]["min_ticks"], ZONE_DEFS[0]["max_ticks"])
        self.x = random.uniform(0.3, 0.7)
        self.y = random.uniform(0.05, 0.15)
        self.zones_visited = 1
        self.distance_m = 0.0
        # Product-attention state (see app/services/attention_tracking.py).
        self.attention = AttentionState(session_id=session_id)

    def step(self) -> bool:
        """Advances this shopper by one tick. Returns False once they've
        walked out the door (session should be closed)."""
        prev_x, prev_y = self.x, self.y
        # wander a bit within the current zone's vertical band
        band_top = self.zone_idx / 3
        band_bottom = (self.zone_idx + 1) / 3
        self.x = min(0.95, max(0.05, self.x + random.uniform(-0.06, 0.06)))
        self.y = min(band_bottom - 0.02, max(band_top + 0.02, self.y + random.uniform(-0.03, 0.05)))
        self.distance_m += ((self.x - prev_x) ** 2 + (self.y - prev_y) ** 2) ** 0.5 * 15  # rough floor-scale

        self.ticks_in_zone += 1
        if self.ticks_in_zone >= self.ticks_target:
            self.zone_idx += 1
            if self.zone_idx >= len(ZONE_DEFS):
                return False  # walked out
            self.ticks_in_zone = 0
            self.ticks_target = random.randint(ZONE_DEFS[self.zone_idx]["min_ticks"], ZONE_DEFS[self.zone_idx]["max_ticks"])
            self.zones_visited += 1
        return True


async def _producer_loop(store_id: int) -> None:
    db = SessionLocal()
    try:
        zones, cameras = _ensure_zones_and_cameras(db, store_id)
        store = db.query(Store).filter(Store.id == store_id).first()
        floor_w = store.floor_width_m if store and store.floor_width_m else 20.0
        floor_h = store.floor_height_m if store and store.floor_height_m else 12.0
        max_capacity = store.max_capacity if store else None
        # Pull out plain ids while the session is still open - `zones` and
        # `cameras` become unusable the moment db.close() runs below.
        zone_ids = [z.id for z in zones]
        camera_ids = [c.id for c in cameras]

        # Map each zone to its primary camera, using the assignment's own
        # layout (Camera 1 -> Entrance, Camera 2 -> Aisle, Camera 3 -> Aisle
        # alt angle, Camera 4 -> Checkout). Falls back gracefully if a store
        # doesn't have exactly 4 cameras (e.g. a manager added their own).
        camera_by_zone: dict[int, int] = {}
        for idx, cam_def in enumerate(CAMERA_DEFS):
            if idx < len(camera_ids):
                camera_by_zone.setdefault(cam_def["zone_index"], camera_ids[idx])
        if not camera_by_zone and camera_ids:
            camera_by_zone = {0: camera_ids[0], 1: camera_ids[0], 2: camera_ids[0]}
        # Falls back through zone 1's camera, then zone 0's, so this is only
        # ever None if the store has zero cameras at all (in which case the
        # simulator has nothing to emit against anyway). Previously this
        # fell straight to None whenever a store had fewer than 3 cameras
        # (e.g. exactly 1 manually-added camera) - that None then got
        # written onto the Redis stream every other tick a shopper was in
        # the Aisle zone, which crashed with `redis.exceptions.DataError`
        # and silently dropped every tick's worth of points, so occupancy
        # counts and the live canvas never moved.
        alt_aisle_camera = (
            camera_ids[2] if len(camera_ids) > 2 else camera_by_zone.get(1, camera_by_zone.get(0))
        )
        # Defensive on purpose: this whole setup block runs inside
        # asyncio.create_task(), fully decoupled from the "Start simulation"
        # HTTP response that already succeeded by the time this executes -
        # an exception here kills the producer task silently (Python just
        # logs "Task exception was never retrieved" to stderr) with no way
        # for the person to know their simulation never actually started.
        # Zone/occupancy tracking (the core feature) must never go dark just
        # because shelf-dwell data (an enhancement layered on top) hit a
        # problem, e.g. a store with no shelves placed yet, or bad legacy
        # data in a shelf row.
        try:
            shelf_targets = load_shelf_targets(db, store_id)
        except Exception:  # noqa: BLE001
            logger.exception(
                "Could not load shelf targets for store %d - continuing without shelf-dwell tracking", store_id
            )
            shelf_targets = []
    finally:
        db.close()

    r = get_redis()
    active: dict[int, _VirtualShopper] = {}
    next_track_id = 1
    tick = 0
    SHELF_REFRESH_EVERY_TICKS = 30  # picks up shelves placed after the simulation started

    logger.info("Started simulated tracking producer for store %d", store_id)
    try:
        while True:
            db = SessionLocal()
            try:
                # spawn
                if len(active) < MAX_CONCURRENT_SHOPPERS and random.random() < SPAWN_CHANCE_PER_TICK:
                    shopper_uid = f"sim-{store_id}-{uuid.uuid4().hex[:10]}"
                    session = ShopperSession(
                        store_id=store_id,
                        shopper_uid=shopper_uid,
                        entry_time=dt.datetime.utcnow(),
                        entry_zone_id=zone_ids[0] if zone_ids else None,
                    )
                    db.add(session)
                    db.commit()
                    db.refresh(session)
                    vs = _VirtualShopper(track_id=next_track_id, session_id=session.id)
                    next_track_id += 1
                    active[vs.track_id] = vs
                    await r.hincrby(occupancy_key(store_id), "zone:0", 1)
                    new_total = await r.hincrby(occupancy_key(store_id), "total", 1)
                    await check_overcrowding(store_id, new_total, max_capacity)

                # advance + emit
                finished: list[int] = []
                for track_id, vs in active.items():
                    prev_zone = vs.zone_idx
                    still_in_store = vs.step()

                    # step() increments zone_idx past the last real zone
                    # (len(ZONE_DEFS) == 3) the instant a shopper walks out,
                    # so vs.zone_idx is momentarily out of range right here.
                    # Emitting that raw value would push zone_index: 3 onto
                    # the wire - one past ZONE_COLORS/ZONE_LABELS on the
                    # frontend (which only has entries 0-2), so the exiting
                    # shopper's last dot silently fell back to a default
                    # gray instead of its real zone color, and the bogus
                    # zone briefly polluted the point written to Postgres.
                    # Clamp to the last real zone for this final point.
                    emit_zone_idx = min(vs.zone_idx, len(ZONE_DEFS) - 1)

                    zone_id = zone_ids[min(emit_zone_idx, len(zone_ids) - 1)] if zone_ids else None
                    camera_id = camera_by_zone.get(emit_zone_idx, camera_by_zone[0])
                    if emit_zone_idx == 1 and tick % 2 == 0:
                        camera_id = alt_aisle_camera
                    # Final safety net: the consumer does int(fields["camera_id"])
                    # off the Redis stream, so this must never be None - a
                    # None here previously crashed xadd() and silently
                    # dropped the whole tick (see alt_aisle_camera comment
                    # above for how that happened with <3 cameras).
                    if camera_id is None:
                        camera_id = camera_ids[0] if camera_ids else 0

                    now_ts = dt.datetime.utcnow()
                    point = {
                        "session_id": vs.session_id,
                        "camera_id": camera_id,
                        "zone_id": zone_id or "",
                        "track_id": vs.track_id,
                        "floor_x": round(vs.x * floor_w, 2),
                        "floor_y": round(vs.y * floor_h, 2),
                        "norm_x": round(vs.x, 4),
                        "norm_y": round(vs.y, 4),
                        "norm_w": 0.04,   # a plausible shopper silhouette width/height,
                        "norm_h": 0.11,   # simulated shoppers don't have a real detected box
                        "bbox_x": round(vs.x * 1000, 1),
                        "bbox_y": round(vs.y * 600, 1),
                        "bbox_w": 60,
                        "bbox_h": 140,
                        "detection_confidence": round(random.uniform(0.82, 0.99), 3),
                        "timestamp": now_ts.isoformat(),
                        "zone_index": emit_zone_idx,
                    }
                    await r.xadd(stream_key(store_id), point, maxlen=20000, approximate=True)

                    # Product-level dwell tracking (see attention_tracking.py)
                    # - only meaningful in the aisle zone, and only while the
                    # shopper is still in the store (a shopper who just walked
                    # out isn't "attending" anything). Guarded on its own so
                    # a dwell-tracking failure for one shopper can never
                    # block the core position data (the xadd above, already
                    # sent) for the rest of this tick's shoppers.
                    try:
                        update_attention(
                            db, vs.attention, shelf_targets,
                            fx=point["floor_x"], fy=point["floor_y"],
                            camera_id=camera_id, now=now_ts,
                            in_aisle_zone=(emit_zone_idx == 1 and still_in_store),
                        )
                    except Exception:  # noqa: BLE001
                        logger.exception("update_attention failed for store %d track %d", store_id, track_id)

                    if not still_in_store:
                        finished.append(track_id)
                        try:
                            close_attention(db, vs.attention, now_ts)
                        except Exception:  # noqa: BLE001
                            logger.exception("close_attention failed for store %d track %d", store_id, track_id)
                        session = db.query(ShopperSession).filter(ShopperSession.id == vs.session_id).first()
                        if session:
                            session.exit_time = dt.datetime.utcnow()
                            session.exit_zone_id = zone_ids[-1] if zone_ids else None
                            session.zones_visited_count = vs.zones_visited
                            session.total_distance_m = round(vs.distance_m, 2)
                            session.total_duration_seconds = (
                                session.exit_time - session.entry_time
                            ).total_seconds()
                            db.commit()
                        await r.hincrby(occupancy_key(store_id), f"zone:{prev_zone}", -1)
                        new_total = await r.hincrby(occupancy_key(store_id), "total", -1)
                        await check_overcrowding(store_id, new_total, max_capacity)
                    elif vs.zone_idx != prev_zone:
                        await r.hincrby(occupancy_key(store_id), f"zone:{prev_zone}", -1)
                        await r.hincrby(occupancy_key(store_id), f"zone:{vs.zone_idx}", 1)

                for track_id in finished:
                    del active[track_id]

                if tick % SHELF_REFRESH_EVERY_TICKS == 0:
                    try:
                        shelf_targets = load_shelf_targets(db, store_id)
                    except Exception:  # noqa: BLE001
                        logger.exception("Could not refresh shelf targets for store %d", store_id)

            except Exception:  # noqa: BLE001
                logger.exception("Simulated tracking tick failed for store %d", store_id)
            finally:
                db.close()

            tick += 1
            await asyncio.sleep(TICK_SECONDS)
    except asyncio.CancelledError:
        logger.info("Stopped simulated tracking producer for store %d", store_id)
        raise


def start(store_id: int) -> bool:
    """Starts the simulated producer + consumer for a store. Returns False
    if it was already running (idempotent)."""
    from app.services.tracking_consumer import consumer_loop  # local import avoids a cycle

    if store_id in _running:
        return False
    producer_task = asyncio.create_task(_producer_loop(store_id))
    consumer_task = asyncio.create_task(consumer_loop(store_id))
    _running[store_id] = {"producer": producer_task, "consumer": consumer_task}
    return True


def stop(store_id: int) -> bool:
    entry = _running.pop(store_id, None)
    if not entry:
        return False
    for task in entry.values():
        task.cancel()

    async def _reset():
        r = get_redis()
        await r.delete(occupancy_key(store_id))
        from app.core.redis_client import overcrowding_flag_key

        await r.delete(overcrowding_flag_key(store_id))

    asyncio.create_task(_reset())
    return True
