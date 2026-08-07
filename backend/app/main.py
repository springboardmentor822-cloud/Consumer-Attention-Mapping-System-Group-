import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta

from fastapi import Body, Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app import database
from app import models, schemas
from app.config import get_settings
from app.database import get_db
from app.routers import milestone3_routes

settings = get_settings()
app = FastAPI(title=os.getenv("PROJECT_NAME", settings.project_name))
app.include_router(milestone3_routes.router)
bearer_scheme = HTTPBearer(auto_error=False)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _b64encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")


def _b64decode(payload: str) -> bytes:
    padding = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(payload + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    salt, digest = stored_hash.split("$", 1)
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return hmac.compare_digest(candidate.hex(), digest)


def create_token(user: models.User) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": int((datetime.utcnow() + timedelta(minutes=settings.access_token_minutes)).timestamp()),
    }
    header_part = _b64encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_part = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        settings.secret_key.encode("utf-8"),
        f"{header_part}.{payload_part}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{header_part}.{payload_part}.{_b64encode(signature)}"


def decode_token(token: str) -> dict:
    try:
        header_part, payload_part, signature_part = token.split(".")
        expected = hmac.new(
            settings.secret_key.encode("utf-8"),
            f"{header_part}.{payload_part}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64encode(expected), signature_part):
            raise ValueError("bad signature")
        payload = json.loads(_b64decode(payload_part))
        if payload["exp"] < int(datetime.utcnow().timestamp()):
            raise ValueError("token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")
    payload = decode_token(credentials.credentials)
    user = db.get(models.User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is not None:
        try:
            payload = decode_token(credentials.credentials)
            user = db.get(models.User, int(payload["sub"]))
            if user is not None and user.is_active:
                return user
        except Exception:
            pass
    default_user = db.query(models.User).filter(models.User.email == "analyst@attention.ai").first()
    if default_user is None:
        default_user = db.query(models.User).first()
    if default_user is None:
        raise HTTPException(status_code=401, detail="No active user found")
    return default_user


def require_roles(*roles: models.UserRole):
    def dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role is not allowed for this workflow")
        return user

    return dependency


def ensure_store_access(db: Session, user: models.User, store_id: int) -> models.Store:
    store = db.get(models.Store, store_id)
    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")
    if user.role == models.UserRole.administrator:
        return store
    allowed = (
        db.query(models.UserStoreAccess)
        .filter(
            models.UserStoreAccess.user_id == user.id,
            models.UserStoreAccess.store_id == store_id,
        )
        .first()
    )
    if allowed is None:
        raise HTTPException(status_code=403, detail="User does not have access to this store")
    return store


def _accessible_store_ids(db: Session, user: models.User) -> list[int] | None:
    if user.role == models.UserRole.administrator:
        return None
    return [
        row.store_id
        for row in db.query(models.UserStoreAccess)
        .filter(models.UserStoreAccess.user_id == user.id)
        .all()
    ]


def ensure_entity_store(
    db: Session,
    entity_type,
    entity_id: int | None,
    store_id: int,
    label: str,
):
    if entity_id is None:
        return None
    entity = db.get(entity_type, entity_id)
    if entity is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    if entity.store_id != store_id:
        raise HTTPException(status_code=422, detail=f"{label} does not belong to store {store_id}")
    return entity


def _seed_users(db: Session) -> None:
    if db.query(models.User).count():
        return
    users = [
        ("Aarav Admin", "admin@attention.ai", "Admin@123", models.UserRole.administrator),
        ("Mira Store", "manager@attention.ai", "Manager@123", models.UserRole.store_manager),
        ("Dev Analyst", "analyst@attention.ai", "Analyst@123", models.UserRole.retail_analyst),
        ("Nila Marketing", "marketing@attention.ai", "Marketing@123", models.UserRole.marketing_manager),
    ]
    for name, email, password, role in users:
        db.add(models.User(name=name, email=email, password_hash=hash_password(password), role=role))


def _seed_store(db: Session) -> None:
    if db.query(models.Store).count():
        return
    store = models.Store(
        name="SmartMart Indiranagar",
        location="Bengaluru, Karnataka",
        manager_name="Mira Store",
        floor_area_sqft=18600,
        shopper_capacity=420,
    )
    db.add(store)
    db.flush()

    zones = [
        models.Zone(store_id=store.id, name="Entrance/Exit Foyer", category_focus="Foot traffic", expected_dwell_seconds=18, heatmap_weight=1.3),
        models.Zone(store_id=store.id, name="Main Product Aisle", category_focus="Dense shelf retail", expected_dwell_seconds=42, heatmap_weight=1.1),
        models.Zone(store_id=store.id, name="Checkout Lanes", category_focus="Queue and anomaly monitoring", expected_dwell_seconds=35, heatmap_weight=1.0),
    ]
    db.add_all(zones)
    db.flush()

    shelves = [
        models.Shelf(store_id=store.id, zone_id=zones[0].id, code="S-FOYER-01", aisle="A0", category="Seasonal offers", x_position=16, y_position=18, attention_score=84),
        models.Shelf(store_id=store.id, zone_id=zones[1].id, code="S-AISLE-01", aisle="B1", category="Personal care", x_position=48, y_position=46, attention_score=73),
        models.Shelf(store_id=store.id, zone_id=zones[1].id, code="S-AISLE-02", aisle="B2", category="Beverages", x_position=74, y_position=62, attention_score=68),
    ]
    db.add_all(shelves)
    db.flush()

    products = [
        models.Product(sku="SKU-PC-1101", name="FreshMint Toothpaste", brand="DailyCare", category="Personal care", dataset_source="SKU-110K"),
        models.Product(sku="SKU-BV-2102", name="Cold Brew Can", brand="UrbanSip", category="Beverages", dataset_source="Retail Product Checkout Dataset"),
        models.Product(sku="SKU-PR-3103", name="Festival Snack Combo", brand="HappyBasket", category="Seasonal offers", dataset_source="SKU-110K"),
    ]
    db.add_all(products)
    db.flush()

    db.add_all(
        [
            models.ProductPlacement(shelf_id=shelves[0].id, product_id=products[2].id, row=1, column=2, facing_count=8, placement_quality=91),
            models.ProductPlacement(shelf_id=shelves[1].id, product_id=products[0].id, row=2, column=4, facing_count=6, placement_quality=78),
            models.ProductPlacement(shelf_id=shelves[2].id, product_id=products[1].id, row=3, column=1, facing_count=7, placement_quality=74),
        ]
    )
    db.add_all(
        [
            models.CameraFeed(store_id=store.id, zone_id=zones[0].id, name="CAM-ENT-01", feed_url="rtsp://demo.local/entrance", status=models.CameraStatus.online, fps=29.8, coverage="Unique entry and exit foot traffic"),
            models.CameraFeed(store_id=store.id, zone_id=zones[1].id, name="CAM-AISLE-02", feed_url="rtsp://demo.local/main-aisle-left", status=models.CameraStatus.online, fps=24.0, coverage="Dense shelf detection, gaze, and dwell"),
            models.CameraFeed(store_id=store.id, zone_id=zones[1].id, name="CAM-AISLE-03", feed_url="rtsp://demo.local/main-aisle-right", status=models.CameraStatus.online, fps=24.0, coverage="Product interaction and occlusion coverage"),
            models.CameraFeed(store_id=store.id, zone_id=zones[2].id, name="CAM-CHECKOUT-04", feed_url="rtsp://demo.local/checkout", status=models.CameraStatus.online, fps=24.0, coverage="Queue length, bottlenecks, and anomaly alerts"),
        ]
    )
    db.flush()


def _reconcile_flagship_layout(db: Session) -> None:
    """Bring an older demo database forward to the four-camera Milestone 2 layout."""

    store = db.query(models.Store).filter(models.Store.name == "SmartMart Indiranagar").first()
    if store is None:
        return
    zones = db.query(models.Zone).filter(models.Zone.store_id == store.id).order_by(models.Zone.id).all()
    if len(zones) < 3:
        return
    zone_specs = [
        ("Entrance/Exit Foyer", "Foot traffic", 18, 1.3),
        ("Main Product Aisle", "Dense shelf retail", 42, 1.1),
        ("Checkout Lanes", "Queue and anomaly monitoring", 35, 1.0),
    ]
    for zone, (name, focus, dwell, weight) in zip(zones[:3], zone_specs):
        zone.name = name
        zone.category_focus = focus
        zone.expected_dwell_seconds = dwell
        zone.heatmap_weight = weight

    shelves = db.query(models.Shelf).filter(models.Shelf.store_id == store.id).order_by(models.Shelf.id).all()
    for index, shelf in enumerate(shelves[:3]):
        shelf.zone_id = zones[0].id if index == 0 else zones[1].id
        shelf.code = ["S-FOYER-01", "S-AISLE-01", "S-AISLE-02"][index]

    camera_specs = [
        ("CAM-ENT-01", zones[0].id, "rtsp://demo.local/entrance", "Unique entry and exit foot traffic"),
        ("CAM-AISLE-02", zones[1].id, "rtsp://demo.local/main-aisle-left", "Dense shelf detection, gaze, and dwell"),
        ("CAM-AISLE-03", zones[1].id, "rtsp://demo.local/main-aisle-right", "Product interaction and occlusion coverage"),
        ("CAM-CHECKOUT-04", zones[2].id, "rtsp://demo.local/checkout", "Queue length, bottlenecks, and anomaly alerts"),
    ]
    cameras = db.query(models.CameraFeed).filter(models.CameraFeed.store_id == store.id).order_by(models.CameraFeed.id).all()
    for index, (name, zone_id, feed_url, coverage) in enumerate(camera_specs):
        if index < len(cameras):
            camera = cameras[index]
            camera.name = name
            camera.zone_id = zone_id
            camera.feed_url = feed_url
            camera.coverage = coverage
            camera.status = models.CameraStatus.online
        else:
            db.add(
                models.CameraFeed(
                    store_id=store.id,
                    zone_id=zone_id,
                    name=name,
                    feed_url=feed_url,
                    coverage=coverage,
                    status=models.CameraStatus.online,
                    fps=24.0,
                )
            )
    db.flush()


def _seed_milestone_2(db: Session) -> None:
    if db.query(models.ShopperSession).count():
        return

    store = db.query(models.Store).order_by(models.Store.id).first()
    if store is None:
        return

    zones = db.query(models.Zone).filter(models.Zone.store_id == store.id).order_by(models.Zone.id).all()
    shelves = db.query(models.Shelf).filter(models.Shelf.store_id == store.id).order_by(models.Shelf.id).all()
    cameras = db.query(models.CameraFeed).filter(models.CameraFeed.store_id == store.id).order_by(models.CameraFeed.id).all()
    cameras_by_zone = {
        zone.id: [camera for camera in cameras if camera.zone_id == zone.id]
        for zone in zones
    }
    products = db.query(models.Product).order_by(models.Product.id).all()
    if len(zones) < 3 or len(shelves) < 3 or len(cameras) < 3 or len(products) < 3:
        return

    now = datetime.utcnow()
    session_specs = [
        ("shopper-2026-0001", models.SessionStatus.completed, 156, 0.94, [0, 1, 2], [18, 44, 72, 80]),
        ("shopper-2026-0002", models.SessionStatus.active, 98, 0.88, [0, 2], [20, 58, 76]),
        ("shopper-2026-0003", models.SessionStatus.completed, 212, 0.91, [0, 1], [12, 36, 52]),
        ("shopper-2026-0004", models.SessionStatus.abandoned, 41, 0.79, [0], [14, 22]),
    ]

    for index, (ref, status_value, dwell, confidence, zone_indexes, x_positions) in enumerate(session_specs):
        session = models.ShopperSession(
            store_id=store.id,
            anonymous_shopper_ref=ref,
            status=status_value,
            started_at=now - timedelta(minutes=35 - index * 8),
            ended_at=None if status_value == models.SessionStatus.active else now - timedelta(minutes=30 - index * 8),
            entry_zone_id=zones[zone_indexes[0]].id,
            exit_zone_id=zones[zone_indexes[-1]].id,
            total_dwell_seconds=dwell,
            path_confidence=confidence,
        )
        db.add(session)
        db.flush()

        for point_index, x_position in enumerate(x_positions):
            route_index = zone_indexes[min(point_index, len(zone_indexes) - 1)]
            zone = zones[route_index]
            camera = cameras_by_zone.get(zone.id, cameras)[0]
            db.add(
                models.TrackingPoint(
                    session_id=session.id,
                    camera_feed_id=camera.id,
                    zone_id=zone.id,
                    observed_at=session.started_at + timedelta(seconds=point_index * 35),
                    x_position=x_position,
                    y_position=22 + point_index * 15 + index * 3,
                    confidence=max(0.72, confidence - point_index * 0.03),
                )
            )
        event_specs = [
            (zones[0], shelves[0], products[2], models.AttentionEventType.dwell, 24, 0.82, 76),
            (zones[zone_indexes[-1]], shelves[zone_indexes[-1]], products[zone_indexes[-1]], models.AttentionEventType.gaze, max(12, dwell // 4), 0.87, min(96, 64 + dwell / 5)),
        ]
        if status_value != models.SessionStatus.abandoned:
            event_specs.append(
                (
                    zones[min(1, len(zones) - 1)],
                    shelves[min(1, len(shelves) - 1)],
                    products[0],
                    models.AttentionEventType.pickup,
                    18,
                    0.78,
                    82,
                )
            )

        for event_index, (zone, shelf, product, event_type, event_dwell, gaze, engagement) in enumerate(event_specs):
            db.add(
                models.AttentionEvent(
                    session_id=session.id,
                    camera_feed_id=cameras_by_zone.get(zone.id, cameras)[0].id,
                    zone_id=zone.id,
                    shelf_id=shelf.id,
                    product_id=product.id,
                    event_type=event_type,
                    observed_at=session.started_at + timedelta(seconds=25 + event_index * 48),
                    dwell_seconds=event_dwell,
                    gaze_confidence=gaze,
                    engagement_score=engagement,
                )
            )


def _seed_store_access(db: Session) -> None:
    """Grant seeded demo identities explicit tenant memberships."""

    existing = {
        (row.user_id, row.store_id)
        for row in db.query(models.UserStoreAccess).all()
    }
    users = db.query(models.User).all()
    stores = db.query(models.Store).all()
    for user in users:
        for store in stores:
            key = (user.id, store.id)
            if key not in existing:
                db.add(models.UserStoreAccess(user_id=user.id, store_id=store.id))

def seed_demo_data() -> None:
    try:
        database.Base.metadata.create_all(bind=database.engine)
    except SQLAlchemyError:
        database.activate_sqlite_fallback()
        database.Base.metadata.create_all(bind=database.engine)

    with database.SessionLocal() as db:
        _seed_users(db)
        _seed_store(db)
        _reconcile_flagship_layout(db)
        _seed_milestone_2(db)
        _seed_store_access(db)
        db.commit()
    database.initialize_timescale()


@app.on_event("startup")
def startup() -> None:
    seed_demo_data()


@app.on_event("startup")
async def start_tracking_stream() -> None:
    from app.services.streaming import tracking_stream

    await tracking_stream.start()


@app.on_event("shutdown")
async def stop_tracking_stream() -> None:
    from app.services.streaming import tracking_stream

    await tracking_stream.stop()


@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "Consumer Attention Mapping Engine Core Operational",
        "database": "SQLite demo fallback" if database.using_fallback_database else "Configured database",
    }


@app.get("/api/db-check")
def test_db_connection(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "connected",
            # Do not expose a configured SQLAlchemy URL: it can contain
            # database credentials.  The dialect is all the UI needs.
            "database": database.engine.dialect.name,
            "database_backend": database.engine.dialect.name,
            "fallback_mode": database.using_fallback_database,
            "timescale_enabled": database.timescale_enabled,
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


@app.post("/api/auth/register", response_model=schemas.UserRead)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="User email already exists")
    user = models.User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return schemas.TokenResponse(access_token=create_token(user), user=user)


@app.get("/api/auth/me", response_model=schemas.UserRead)
def read_me(user: models.User = Depends(get_current_user)):
    return user


@app.get("/api/admin/users", response_model=list[schemas.UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(models.UserRole.administrator)),
):
    return db.query(models.User).order_by(models.User.id).all()


def _store_query(db: Session):
    return db.query(models.Store).options(
        joinedload(models.Store.zones),
        joinedload(models.Store.shelves).joinedload(models.Shelf.zone),
        joinedload(models.Store.shelves).joinedload(models.Shelf.placements).joinedload(models.ProductPlacement.product),
        joinedload(models.Store.cameras).joinedload(models.CameraFeed.zone),
    )


def _session_query(db: Session):
    return db.query(models.ShopperSession).options(
        joinedload(models.ShopperSession.entry_zone),
        joinedload(models.ShopperSession.exit_zone),
        joinedload(models.ShopperSession.path_points).joinedload(models.TrackingPoint.zone),
        joinedload(models.ShopperSession.attention_events).joinedload(models.AttentionEvent.zone),
        joinedload(models.ShopperSession.attention_events).joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.zone),
        joinedload(models.ShopperSession.attention_events).joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.placements).joinedload(models.ProductPlacement.product),
        joinedload(models.ShopperSession.attention_events).joinedload(models.AttentionEvent.product),
    )


@app.get("/api/stores", response_model=list[schemas.StoreRead])
def list_stores(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = _store_query(db)
    allowed_ids = _accessible_store_ids(db, user)
    if allowed_ids is not None:
        query = query.filter(models.Store.id.in_(allowed_ids))
    return query.order_by(models.Store.id).all()


@app.post("/api/stores", response_model=schemas.StoreRead)
def create_store(
    payload: schemas.StoreCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    store = models.Store(**payload.model_dump())
    db.add(store)
    db.flush()
    db.add(models.UserStoreAccess(user_id=user.id, store_id=store.id))
    db.commit()
    return _store_query(db).filter(models.Store.id == store.id).one()


@app.post("/api/stores/{store_id}/zones", response_model=schemas.ZoneRead)
def create_zone(
    store_id: int,
    payload: schemas.ZoneCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    ensure_store_access(db, user, store_id)
    zone = models.Zone(store_id=store_id, **payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@app.post("/api/shelves", response_model=schemas.ShelfRead)
def create_shelf(
    payload: schemas.ShelfCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    ensure_store_access(db, user, payload.store_id)
    ensure_entity_store(db, models.Zone, payload.zone_id, payload.store_id, "Zone")
    shelf = models.Shelf(**payload.model_dump())
    db.add(shelf)
    db.commit()
    return (
        db.query(models.Shelf)
        .options(joinedload(models.Shelf.zone), joinedload(models.Shelf.placements).joinedload(models.ProductPlacement.product))
        .filter(models.Shelf.id == shelf.id)
        .one()
    )


@app.post("/api/products", response_model=schemas.ProductRead)
def create_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.post("/api/product-placements", response_model=schemas.ProductPlacementRead)
def create_product_placement(
    payload: schemas.ProductPlacementCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    shelf = db.get(models.Shelf, payload.shelf_id)
    if shelf is None:
        raise HTTPException(status_code=404, detail="Shelf not found")
    ensure_store_access(db, user, shelf.store_id)
    if db.get(models.Product, payload.product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    placement = models.ProductPlacement(**payload.model_dump())
    db.add(placement)
    db.commit()
    return (
        db.query(models.ProductPlacement)
        .options(joinedload(models.ProductPlacement.product))
        .filter(models.ProductPlacement.id == placement.id)
        .one()
    )


@app.get("/api/camera-feeds", response_model=list[schemas.CameraFeedRead])
def list_camera_feeds(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.CameraFeed).options(joinedload(models.CameraFeed.zone))
    if store_id is not None:
        ensure_store_access(db, user, store_id)
        query = query.filter(models.CameraFeed.store_id == store_id)
    else:
        allowed_ids = _accessible_store_ids(db, user)
        if allowed_ids is not None:
            query = query.filter(models.CameraFeed.store_id.in_(allowed_ids))
    return query.order_by(models.CameraFeed.id).all()


@app.post("/api/camera-feeds", response_model=schemas.CameraFeedRead)
def create_camera_feed(
    payload: schemas.CameraFeedCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager)),
):
    ensure_store_access(db, user, payload.store_id)
    ensure_entity_store(db, models.Zone, payload.zone_id, payload.store_id, "Zone")
    feed = models.CameraFeed(**payload.model_dump(), last_sync_at=datetime.utcnow())
    db.add(feed)
    db.commit()
    return db.query(models.CameraFeed).options(joinedload(models.CameraFeed.zone)).filter(models.CameraFeed.id == feed.id).one()


@app.patch("/api/camera-feeds/{feed_id}/heartbeat", response_model=schemas.CameraFeedRead)
def update_camera_heartbeat(
    feed_id: int,
    status_value: models.CameraStatus = models.CameraStatus.online,
    fps: float = 24.0,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.store_manager, models.UserRole.retail_analyst)),
):
    feed = db.get(models.CameraFeed, feed_id)
    if feed is None:
        raise HTTPException(status_code=404, detail="Camera feed not found")
    feed.status = status_value
    feed.fps = fps
    feed.last_sync_at = datetime.utcnow()
    db.commit()
    return db.query(models.CameraFeed).options(joinedload(models.CameraFeed.zone)).filter(models.CameraFeed.id == feed.id).one()


@app.get("/api/tracking/sessions", response_model=list[schemas.ShopperSessionRead])
def list_shopper_sessions(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(
            models.UserRole.administrator,
            models.UserRole.store_manager,
            models.UserRole.retail_analyst,
            models.UserRole.marketing_manager,
        )
    ),
):
    query = _session_query(db)
    if store_id is not None:
        ensure_store_access(db, user, store_id)
        query = query.filter(models.ShopperSession.store_id == store_id)
    else:
        allowed_ids = _accessible_store_ids(db, user)
        if allowed_ids is not None:
            query = query.filter(models.ShopperSession.store_id.in_(allowed_ids))
    return query.order_by(models.ShopperSession.started_at.desc()).all()


@app.post("/api/tracking/sessions", response_model=schemas.ShopperSessionRead)
def create_shopper_session(
    payload: schemas.ShopperSessionCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)),
):
    ensure_store_access(db, user, payload.store_id)
    ensure_entity_store(db, models.Zone, payload.entry_zone_id, payload.store_id, "Entry zone")
    ensure_entity_store(db, models.Zone, payload.exit_zone_id, payload.store_id, "Exit zone")
    session = models.ShopperSession(**payload.model_dump(), started_at=datetime.utcnow())
    db.add(session)
    db.commit()
    return _session_query(db).filter(models.ShopperSession.id == session.id).one()


@app.patch("/api/tracking/sessions/{session_id}/close", response_model=schemas.ShopperSessionRead)
def close_shopper_session(
    session_id: int,
    payload: schemas.ShopperSessionClose,
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)
    ),
):
    session = db.get(models.ShopperSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Shopper session not found")
    ensure_store_access(db, user, session.store_id)
    if payload.status == models.SessionStatus.active:
        raise HTTPException(status_code=422, detail="A closed session cannot remain active")
    ensure_entity_store(db, models.Zone, payload.exit_zone_id, session.store_id, "Exit zone")
    if payload.ended_at < session.started_at:
        raise HTTPException(status_code=422, detail="ended_at cannot precede started_at")
    session.status = payload.status
    session.exit_zone_id = payload.exit_zone_id
    session.ended_at = payload.ended_at
    session.total_dwell_seconds = int(
        db.query(func.coalesce(func.sum(models.AttentionEvent.dwell_seconds), 0))
        .filter(models.AttentionEvent.session_id == session.id)
        .scalar()
        or 0
    )
    session.path_confidence = float(
        db.query(func.coalesce(func.avg(models.TrackingPoint.confidence), 0))
        .filter(models.TrackingPoint.session_id == session.id)
        .scalar()
        or 0
    )
    db.commit()
    return _session_query(db).filter(models.ShopperSession.id == session.id).one()


@app.post("/api/tracking/points", response_model=schemas.TrackingPointRead)
def create_tracking_point(
    payload: schemas.TrackingPointCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)),
):
    session = db.get(models.ShopperSession, payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Shopper session not found")
    ensure_store_access(db, user, session.store_id)
    ensure_entity_store(db, models.CameraFeed, payload.camera_feed_id, session.store_id, "Camera feed")
    ensure_entity_store(db, models.Zone, payload.zone_id, session.store_id, "Zone")
    point = models.TrackingPoint(**payload.model_dump(), observed_at=datetime.utcnow())
    db.add(point)
    db.commit()
    return (
        db.query(models.TrackingPoint)
        .options(joinedload(models.TrackingPoint.zone))
        .filter(models.TrackingPoint.id == point.id)
        .one()
    )


@app.post("/api/attention/events", response_model=schemas.AttentionEventRead)
def create_attention_event(
    payload: schemas.AttentionEventCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)),
):
    session = db.get(models.ShopperSession, payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Shopper session not found")
    ensure_store_access(db, user, session.store_id)
    ensure_entity_store(db, models.CameraFeed, payload.camera_feed_id, session.store_id, "Camera feed")
    ensure_entity_store(db, models.Zone, payload.zone_id, session.store_id, "Zone")
    shelf = ensure_entity_store(db, models.Shelf, payload.shelf_id, session.store_id, "Shelf")
    if payload.product_id is not None:
        if db.get(models.Product, payload.product_id) is None:
            raise HTTPException(status_code=404, detail="Product not found")
        if shelf is not None:
            placement = (
                db.query(models.ProductPlacement)
                .filter(
                    models.ProductPlacement.shelf_id == shelf.id,
                    models.ProductPlacement.product_id == payload.product_id,
                )
                .first()
            )
            if placement is None:
                raise HTTPException(status_code=422, detail="Product is not placed on the referenced shelf")
    event = models.AttentionEvent(**payload.model_dump(), observed_at=datetime.utcnow())
    session.total_dwell_seconds += payload.dwell_seconds
    db.add(event)
    db.commit()
    return (
        db.query(models.AttentionEvent)
        .options(
            joinedload(models.AttentionEvent.zone),
            joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.zone),
            joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.placements).joinedload(models.ProductPlacement.product),
            joinedload(models.AttentionEvent.product),
        )
        .filter(models.AttentionEvent.id == event.id)
        .one()
    )


@app.get("/api/attention/events", response_model=list[schemas.AttentionEventRead])
def list_attention_events(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(
            models.UserRole.administrator,
            models.UserRole.store_manager,
            models.UserRole.retail_analyst,
            models.UserRole.marketing_manager,
        )
    ),
):
    query = (
        db.query(models.AttentionEvent)
        .join(models.ShopperSession, models.ShopperSession.id == models.AttentionEvent.session_id)
        .options(
            joinedload(models.AttentionEvent.zone),
            joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.zone),
            joinedload(models.AttentionEvent.shelf).joinedload(models.Shelf.placements).joinedload(models.ProductPlacement.product),
            joinedload(models.AttentionEvent.product),
        )
    )
    if store_id is not None:
        ensure_store_access(db, user, store_id)
        query = query.filter(models.ShopperSession.store_id == store_id)
    else:
        allowed_ids = _accessible_store_ids(db, user)
        if allowed_ids is not None:
            query = query.filter(models.ShopperSession.store_id.in_(allowed_ids))
    return query.order_by(models.AttentionEvent.observed_at.desc()).all()


@app.get("/api/attention/zone-summary", response_model=list[schemas.ZoneAttentionSummary])
def get_zone_attention_summary(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(
            models.UserRole.administrator,
            models.UserRole.store_manager,
            models.UserRole.retail_analyst,
            models.UserRole.marketing_manager,
        )
    ),
):
    if store_id is not None:
        ensure_store_access(db, user, store_id)
    allowed_ids = _accessible_store_ids(db, user)
    rows = (
        db.query(
            models.Zone.name,
            func.count(func.distinct(models.AttentionEvent.session_id)).label("shopper_visits"),
            func.coalesce(func.sum(models.AttentionEvent.dwell_seconds), 0).label("total_dwell_seconds"),
            func.coalesce(func.avg(models.AttentionEvent.engagement_score), 0).label("average_engagement"),
        )
        .join(models.AttentionEvent, models.AttentionEvent.zone_id == models.Zone.id)
    )
    if store_id is not None:
        rows = rows.filter(models.Zone.store_id == store_id)
    elif allowed_ids is not None:
        rows = rows.filter(models.Zone.store_id.in_(allowed_ids))
    rows = (
        rows.group_by(models.Zone.id, models.Zone.name)
        .order_by(func.coalesce(func.sum(models.AttentionEvent.dwell_seconds), 0).desc())
        .all()
    )
    return [
        schemas.ZoneAttentionSummary(
            zone=row.name,
            shopper_visits=row.shopper_visits,
            total_dwell_seconds=row.total_dwell_seconds,
            average_engagement=round(row.average_engagement, 1),
        )
        for row in rows
    ]


@app.get("/api/milestone2/summary", response_model=schemas.Milestone2Summary)
def get_milestone_2_summary(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(
            models.UserRole.administrator,
            models.UserRole.store_manager,
            models.UserRole.retail_analyst,
            models.UserRole.marketing_manager,
        )
    ),
):
    if store_id is not None:
        ensure_store_access(db, user, store_id)
        store_ids = [store_id]
    else:
        store_ids = _accessible_store_ids(db, user)
    session_query = db.query(models.ShopperSession)
    if store_ids is not None:
        session_query = session_query.filter(models.ShopperSession.store_id.in_(store_ids))
    session_ids = session_query.with_entities(models.ShopperSession.id)
    total_sessions = session_query.count()
    active_sessions = session_query.filter(models.ShopperSession.status == models.SessionStatus.active).count()
    tracking_points = db.query(models.TrackingPoint).filter(models.TrackingPoint.session_id.in_(session_ids)).count()
    attention_events = db.query(models.AttentionEvent).filter(models.AttentionEvent.session_id.in_(session_ids)).count()
    average_dwell = session_query.with_entities(
        func.coalesce(func.avg(models.ShopperSession.total_dwell_seconds), 0)
    ).scalar()
    average_gaze = db.query(func.coalesce(func.avg(models.AttentionEvent.gaze_confidence), 0)).filter(
        models.AttentionEvent.session_id.in_(session_ids)
    ).scalar()
    top_zone_row = (
        db.query(models.Zone.name, func.coalesce(func.sum(models.AttentionEvent.dwell_seconds), 0).label("dwell"))
        .join(models.AttentionEvent, models.AttentionEvent.zone_id == models.Zone.id)
        .filter(models.Zone.store_id.in_(store_ids) if store_ids is not None else text("1=1"))
        .group_by(models.Zone.id, models.Zone.name)
        .order_by(text("dwell DESC"))
        .first()
    )
    return schemas.Milestone2Summary(
        shopper_sessions=total_sessions,
        active_sessions=active_sessions,
        tracking_points=tracking_points,
        attention_events=attention_events,
        average_dwell_seconds=round(average_dwell, 1),
        average_gaze_confidence=round(average_gaze, 2),
        top_zone=top_zone_row.name if top_zone_row else "No events yet",
    )


@app.get("/api/milestone/objectives")
def get_project_objectives(user: models.User = Depends(get_current_user)):
    return {
        "objective": "Build an AI-powered retail attention intelligence platform for shelf, product, camera, and shopper behavior workflows.",
        "business_goals": [
            "Identify which shelves and promotional displays earn the most shopper attention.",
            "Connect camera coverage to zones so future vision models can produce dwell, path, and engagement analytics.",
            "Give each role a focused operating view: store setup, analytics review, marketing insight, and administration.",
            "Track anonymous shopper journeys and convert camera observations into attention events.",
        ],
    }


@app.get("/api/milestone/architecture")
def get_architecture(user: models.User = Depends(get_current_user)):
    return {
        "layers": [
            "React dashboard for role-aware retail operations.",
            "FastAPI service for authentication, RBAC, store setup, shelf mapping, and camera feed control.",
            "SQLAlchemy data layer supporting PostgreSQL in production and SQLite for local demos.",
            "Future computer vision workers using COCO, SKU-110K, Retail Product Checkout, and traffic datasets.",
            "Milestone 2 tracking layer for shopper sessions, path points, dwell events, and gaze confidence.",
        ],
        "data_flow": "Camera feeds map to zones, zones map to shelves, shelves map to products, and AI events attach shopper paths, dwell, gaze, pickup, and engagement metrics to those entities.",
    }


@app.get("/api/milestone/workflows", response_model=list[schemas.WorkflowItem])
def get_workflows(user: models.User = Depends(get_current_user)):
    return [
        schemas.WorkflowItem(stage="Authentication", status="Implemented", owner_role=models.UserRole.administrator, outcome="Seeded users, login endpoint, token validation, and role checks."),
        schemas.WorkflowItem(stage="Store setup", status="Implemented", owner_role=models.UserRole.store_manager, outcome="Register stores, zones, shelf coordinates, product placements, and capacity data."),
        schemas.WorkflowItem(stage="Camera onboarding", status="Implemented", owner_role=models.UserRole.store_manager, outcome="Register RTSP/demo feeds, assign zones, monitor FPS and online/warning/offline health."),
        schemas.WorkflowItem(stage="Consumer tracking", status="Implemented", owner_role=models.UserRole.retail_analyst, outcome="Anonymous shopper sessions, camera path points, entry/exit zones, and path confidence are operational."),
        schemas.WorkflowItem(stage="Attention analysis", status="Implemented", owner_role=models.UserRole.retail_analyst, outcome="Dwell, gaze, pickup, and engagement events are connected to zones, shelves, and products."),
        schemas.WorkflowItem(stage="Marketing intelligence", status="Implemented", owner_role=models.UserRole.marketing_manager, outcome="Zone dwell summaries and product attention events support promotion decisions."),
    ]


@app.get("/api/milestone/datasets", response_model=list[schemas.DatasetMapping])
def get_dataset_mapping(user: models.User = Depends(get_current_user)):
    return [
        schemas.DatasetMapping(dataset="Retail Product Checkout Dataset", purpose="Retail object detection and product recognition.", milestone_1_use="Mapped as product metadata source for checkout and SKU recognition workflows."),
        schemas.DatasetMapping(dataset="SKU-110K Dataset", purpose="Shelf product detection and retail shelf analytics.", milestone_1_use="Mapped to shelf placements and future product-facing detection events."),
        schemas.DatasetMapping(dataset="COCO Dataset", purpose="Person detection and object tracking.", milestone_1_use="Used by Milestone 2 tracking design for shopper detection, path points, and session generation."),
        schemas.DatasetMapping(dataset="Retail Store Traffic Dataset", purpose="Consumer movement analytics and store traffic monitoring.", milestone_1_use="Used by Milestone 2 analytics design for entry/exit, path density, dwell, and zone traffic baselines."),
    ]


@app.get("/api/milestone/summary")
def get_milestone_summary(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return {
        "users": db.query(models.User).count(),
        "stores": db.query(models.Store).count(),
        "zones": db.query(models.Zone).count(),
        "shelves": db.query(models.Shelf).count(),
        "products": db.query(models.Product).count(),
        "camera_feeds": db.query(models.CameraFeed).count(),
        "camera_feeds_online": db.query(models.CameraFeed).filter(models.CameraFeed.status == models.CameraStatus.online).count(),
        "shopper_sessions": db.query(models.ShopperSession).count(),
        "tracking_points": db.query(models.TrackingPoint).count(),
        "attention_events": db.query(models.AttentionEvent).count(),
        "database_fallback_mode": database.using_fallback_database,
    }


@app.post("/api/video/test-stream")
def test_video_stream(
    camera_name: str = None,
    limit: int = 60,
    user: models.User = Depends(get_current_user),
):
    from app.services.video_stream import VideoStreamIngester
    try:
        ingester = VideoStreamIngester(camera_name=camera_name)
        logs = ingester.run_ingestion_test(limit_frames=limit)
        return {
            "status": "success",
            "stream_source": ingester.source_path,
            "frames_processed": len(logs),
            "frame_logs": logs
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/stores/{store_id}/tracking/ingest", response_model=schemas.TrackingIngestResponse)
async def ingest_tracking_observations(
    store_id: int,
    payload: schemas.TrackingIngestBatch,
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)
    ),
):
    """Enqueue detector/tracker output without blocking on database writes."""

    from app.services.streaming import tracking_stream

    ensure_store_access(db, user, store_id)
    if payload.store_id != store_id:
        raise HTTPException(status_code=422, detail="Body store_id must match the route store_id")

    camera_ids = {item.camera_feed_id for item in payload.observations}
    valid_camera_ids = {
        row.id
        for row in db.query(models.CameraFeed)
        .filter(models.CameraFeed.store_id == store_id, models.CameraFeed.id.in_(camera_ids))
        .all()
    }
    if camera_ids != valid_camera_ids:
        raise HTTPException(status_code=422, detail="Every camera_feed_id must belong to the requested store")

    zone_ids = {item.zone_id for item in payload.observations if item.zone_id is not None}
    if zone_ids:
        valid_zone_ids = {
            row.id
            for row in db.query(models.Zone)
            .filter(models.Zone.store_id == store_id, models.Zone.id.in_(zone_ids))
            .all()
        }
        if zone_ids != valid_zone_ids:
            raise HTTPException(status_code=422, detail="Every zone_id must belong to the requested store")

    message_ids: list[str] = []
    for observation in payload.observations:
        event = observation.model_dump(mode="json")
        event["store_id"] = store_id
        message_ids.append(await tracking_stream.publish(event))
    return schemas.TrackingIngestResponse(
        store_id=store_id,
        accepted=len(message_ids),
        stream_backend=tracking_stream.broker.backend,
        message_ids=message_ids,
    )


_global_browser_tracker = None

def _get_browser_tracker():
    global _global_browser_tracker
    if _global_browser_tracker is None:
        from app.ml.inference import YOLOByteTracker
        from pathlib import Path
        model_path = Path("ml_runs/retail_finetune/weights/best.pt")
        if not model_path.is_file():
            model_path = Path("yolov8n.pt")
        _global_browser_tracker = YOLOByteTracker(model=model_path, confidence_threshold=0.25)
    return _global_browser_tracker


_webcam_dwell_timestamps: dict[int, float] = {}


@app.post("/api/stores/{store_id}/tracking/live-frame")
async def process_browser_live_frame(
    store_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user_optional),
):
    """Process a single live webcam base64 frame from the browser, running YOLO + ByteTrack."""
    import base64
    import time
    from datetime import datetime, timezone
    from app.ml.optional import require_module
    from app.services.streaming import tracking_stream

    store = db.get(models.Store, store_id)
    if store is None:
        store = db.query(models.Store).first()
        if store is not None:
            store_id = store.id

    frame_data = payload.get("image_base64", "")
    camera_id = payload.get("camera_id", 1)
    zone_id = payload.get("zone_id", 1)
    conf_threshold = payload.get("confidence", 0.25)
    class_filter = payload.get("class_filter", None)  # None=All, 'human'=[0], 'object'=[1..79]

    if "," in frame_data:
        frame_data = frame_data.split(",", 1)[1]
    if not frame_data:
        raise HTTPException(status_code=400, detail="Missing image_base64 payload")

    try:
        image_bytes = base64.b64decode(frame_data)
        cv2 = require_module("cv2", purpose="Decoding live browser webcam frames")
        np = require_module("numpy", purpose="Decoding live browser webcam frames")
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("OpenCV imdecode failed")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Invalid image format: {exc}")

    classes_list = None
    if class_filter == "human":
        classes_list = (0,)
    elif class_filter == "object":
        classes_list = tuple(range(1, 80))

    tracker = _get_browser_tracker()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_mono = time.monotonic()
    height, width = image.shape[:2]

    tracked = tracker.process_frame(image, confidence_threshold=float(conf_threshold), classes=classes_list)
    detections_out = []
    observations = []

    current_tids = set()

    for idx, det in enumerate(tracked.detections):
        center_x, center_y = det.center_xy
        norm_x = max(0.0, min(1.0, center_x / width)) if width else 0.5
        norm_y = max(0.0, min(1.0, center_y / height)) if height else 0.5
        left, top, right, bottom = det.bbox_xyxy

        is_human = (det.class_name == "person" or det.class_id == 0)
        track_id = det.track_id if det.track_id is not None else (idx + 1)
        current_tids.add(track_id)

        # Dwell time tracking for humans
        dwell_seconds = 0.0
        engagement_label = "Initial View"
        if is_human:
            if track_id not in _webcam_dwell_timestamps:
                _webcam_dwell_timestamps[track_id] = now_mono
            dwell_seconds = round(now_mono - _webcam_dwell_timestamps[track_id], 1)
            if dwell_seconds > 10.0:
                engagement_label = "High Dwell"
            elif dwell_seconds > 3.0:
                engagement_label = "Active Dwell"

        detections_out.append({
            "track_id": track_id,
            "class_id": det.class_id,
            "class_name": det.class_name,
            "retail_category": det.retail_category,
            "display_label": det.display_label or det.class_name.upper(),
            "is_human": is_human,
            "confidence": round(det.confidence, 2),
            "dwell_seconds": dwell_seconds,
            "engagement_label": engagement_label,
            "bbox_xyxy": [round(left, 1), round(top, 1), round(right, 1), round(bottom, 1)],
            "bbox_normalized": [round(left/width, 3), round(top/height, 3), round(right/width, 3), round(bottom/height, 3)],
        })

        obs = {
            "camera_feed_id": camera_id,
            "zone_id": zone_id,
            "tracker_id": track_id,
            "observed_at": now_iso,
            "frame_index": tracked.frame_index,
            "x_position": norm_x,
            "y_position": norm_y,
            "bbox_x_min": left / width if width else 0.0,
            "bbox_y_min": top / height if height else 0.0,
            "bbox_x_max": right / width if width else 1.0,
            "bbox_y_max": bottom / height if height else 1.0,
            "confidence": det.confidence,
            "gaze_target": det.display_label or det.class_name,
            "store_id": store_id,
        }
        observations.append(obs)
        await tracking_stream.publish(obs)

    # Prune stale dwell timestamps (> 30s absent)
    stale_keys = [k for k, v in _webcam_dwell_timestamps.items() if k not in current_tids and (now_mono - v > 30)]
    for k in stale_keys:
        _webcam_dwell_timestamps.pop(k, None)

    return {
        "store_id": store_id,
        "frame_index": tracked.frame_index,
        "detections": detections_out,
        "width": width,
        "height": height,
        "human_count": sum(1 for d in detections_out if d["retail_category"] == "human"),
        "product_count": sum(1 for d in detections_out if d["retail_category"] == "product"),
        "shelf_count": sum(1 for d in detections_out if d["retail_category"] == "shelf_structure"),
        "bag_count": sum(1 for d in detections_out if d["retail_category"] == "bag_basket"),
        "object_count": sum(1 for d in detections_out if d["retail_category"] != "human"),
        "max_dwell_seconds": max([d["dwell_seconds"] for d in detections_out if d["is_human"]], default=0.0),
    }


@app.get("/api/stores/{store_id}/tracking/observations", response_model=list[schemas.TrackingObservationRead])
def list_tracking_observations(
    store_id: int,
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ensure_store_access(db, user, store_id)
    return (
        db.query(models.TrackingObservation)
        .filter(models.TrackingObservation.store_id == store_id)
        .order_by(models.TrackingObservation.observed_at.desc())
        .limit(limit)
        .all()
    )


@app.get("/api/stores/{store_id}/heatmap", response_model=schemas.HeatmapResponse)
def get_store_heatmap(
    store_id: int,
    window_minutes: int = Query(default=60, ge=1, le=10080),
    grid_size: int = Query(default=30, ge=5, le=100),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ensure_store_access(db, user, store_id)
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    observations = (
        db.query(models.TrackingObservation)
        .filter(
            models.TrackingObservation.store_id == store_id,
            models.TrackingObservation.observed_at >= cutoff,
        )
        .all()
    )
    cell_width = 100.0 / grid_size
    cells: dict[tuple[int, int], dict[str, float]] = {}
    for observation in observations:
        cell_x = min(grid_size - 1, int(observation.x_position / cell_width))
        cell_y = min(grid_size - 1, int(observation.y_position / cell_width))
        cell = cells.setdefault((cell_x, cell_y), {"weight": 0.0, "x": 0.0, "y": 0.0, "samples": 0.0})
        attention_boost = 1.0 + float(observation.attention_probability or 0.0)
        cell["weight"] += float(observation.confidence) * attention_boost
        cell["x"] += float(observation.x_position)
        cell["y"] += float(observation.y_position)
        cell["samples"] += 1
    points = [
        schemas.HeatmapPoint(
            x=round(cell["x"] / cell["samples"], 3),
            y=round(cell["y"] / cell["samples"], 3),
            value=round(cell["weight"], 4),
            samples=int(cell["samples"]),
        )
        for cell in cells.values()
    ]
    points.sort(key=lambda point: point.value, reverse=True)
    return schemas.HeatmapResponse(
        store_id=store_id,
        generated_at=datetime.utcnow(),
        window_minutes=window_minutes,
        max_value=max((point.value for point in points), default=0.0),
        total_samples=len(observations),
        points=points,
    )


@app.get("/api/stores/{store_id}/stream/status", response_model=schemas.StreamStatus)
async def get_stream_status(
    store_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from app.services.streaming import tracking_stream

    ensure_store_access(db, user, store_id)
    return await tracking_stream.status(store_id)


@app.get("/api/stores/{store_id}/checkout/status", response_model=schemas.CheckoutQueueStatus)
def get_checkout_queue_status(
    store_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    from app.services.streaming import tracking_stream

    ensure_store_access(db, user, store_id)
    zones = db.query(models.Zone).filter(models.Zone.store_id == store_id).all()
    checkout_zone = next(
        (
            zone
            for zone in zones
            if "checkout" in f"{zone.name} {zone.category_focus}".lower()
            or "queue" in f"{zone.name} {zone.category_focus}".lower()
        ),
        None,
    )
    if checkout_zone is None:
        raise HTTPException(status_code=404, detail="No checkout/queue zone is configured for this store")
    queue_length = tracking_stream.zone_occupancy(store_id, checkout_zone.id)
    threshold = settings.checkout_queue_threshold
    return schemas.CheckoutQueueStatus(
        store_id=store_id,
        zone_id=checkout_zone.id,
        zone_name=checkout_zone.name,
        queue_length=queue_length,
        threshold=threshold,
        bottleneck_alert=queue_length >= threshold,
        active_window_seconds=30,
    )


@app.post("/api/stores/{store_id}/attention/gaze-estimate", response_model=schemas.GazeEstimateResponse)
def estimate_shelf_gaze(
    store_id: int,
    payload: schemas.GazeEstimateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(
            models.UserRole.administrator,
            models.UserRole.store_manager,
            models.UserRole.retail_analyst,
        )
    ),
):
    from app.ml.attention import ShelfPlane, gaze_vector_from_head_pose, map_gaze_to_shelf

    ensure_store_access(db, user, store_id)
    if payload.store_id != store_id:
        raise HTTPException(status_code=422, detail="Body store_id must match the route store_id")
    ensure_entity_store(db, models.CameraFeed, payload.camera_feed_id, store_id, "Camera feed")
    shelf_ids = {plane.shelf_id for plane in payload.shelf_planes}
    valid_shelves = {
        shelf.id: shelf
        for shelf in db.query(models.Shelf)
        .filter(models.Shelf.store_id == store_id, models.Shelf.id.in_(shelf_ids))
        .all()
    }
    if shelf_ids != set(valid_shelves):
        raise HTTPException(status_code=422, detail="Every calibrated shelf plane must belong to the store")
    for plane in payload.shelf_planes:
        if plane.product_id is not None:
            placement = (
                db.query(models.ProductPlacement)
                .filter(
                    models.ProductPlacement.shelf_id == plane.shelf_id,
                    models.ProductPlacement.product_id == plane.product_id,
                )
                .first()
            )
            if placement is None:
                raise HTTPException(status_code=422, detail="Calibrated product is not placed on its shelf")

    direction = gaze_vector_from_head_pose(
        payload.yaw_degrees,
        payload.pitch_degrees,
        payload.roll_degrees,
    )
    planes = [
        ShelfPlane(
            shelf_id=str(plane.shelf_id),
            product_id=str(plane.product_id) if plane.product_id is not None else None,
            center=plane.center,
            normal=plane.normal,
            up=plane.up,
            width=plane.width,
            height=plane.height,
        )
        for plane in payload.shelf_planes
    ]
    hit = map_gaze_to_shelf(
        payload.ray_origin,
        direction,
        planes,
        margin=payload.margin,
        max_distance=payload.max_distance,
    )
    hit_response = None
    if hit is not None:
        hit_response = schemas.GazeHitRead(
            shelf_id=int(hit.shelf_id),
            product_id=int(hit.product_id) if hit.product_id is not None else None,
            point=hit.point,
            distance=hit.distance,
            incidence=hit.incidence,
            horizontal_offset=hit.horizontal_offset,
            vertical_offset=hit.vertical_offset,
            confidence=round(payload.head_pose_confidence * hit.incidence, 6),
        )
    return schemas.GazeEstimateResponse(
        store_id=store_id,
        shopper_ref=payload.shopper_ref,
        ray_direction=direction,
        hit=hit_response,
    )


@app.get("/api/pipeline/status")
async def get_pipeline_status(user: models.User = Depends(get_current_user)):
    from app.services.streaming import tracking_stream

    return {
        "stream_backend": tracking_stream.broker.backend,
        "worker_running": tracking_stream.worker_task is not None and not tracking_stream.worker_task.done(),
        "timescale_enabled": database.timescale_enabled,
        "timescale_error": database.timescale_error,
        "stream_error": tracking_stream.last_error or tracking_stream.broker.last_error,
        "batch_size": settings.tracking_batch_size,
        "flush_seconds": settings.tracking_flush_seconds,
        "database_url": database.active_database_url.split("@")[-1],
    }


@app.websocket("/ws/stores/{store_id}/tracking")
async def tracking_websocket(websocket: WebSocket, store_id: int, token: str = Query(default="")):
    from app.services.streaming import tracking_stream

    try:
        if not token:
            raise ValueError("Missing token")
        token_payload = decode_token(token)
        with database.SessionLocal() as db:
            user = db.get(models.User, int(token_payload["sub"]))
            if user is None or not user.is_active:
                raise ValueError("Inactive user")
            ensure_store_access(db, user, store_id)
    except Exception:
        await websocket.close(code=4401, reason="Invalid token or store access")
        return

    await tracking_stream.connect_websocket(store_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        tracking_stream.disconnect_websocket(store_id, websocket)
    except Exception:
        tracking_stream.disconnect_websocket(store_id, websocket)


@app.post("/api/training/runs", response_model=schemas.TrainingRunRead, status_code=202)
def create_training_run(
    payload: schemas.TrainingRunCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(
        require_roles(models.UserRole.administrator, models.UserRole.retail_analyst)
    ),
):
    """Queue a real training process; metrics stay empty until the trainer observes them."""

    from app.services.training_jobs import training_jobs

    ensure_store_access(db, user, payload.store_id)
    if payload.task != models.ModelTask.detection:
        raise HTTPException(
            status_code=422,
            detail="Only YOLO detection training is supported. Gaze uses calibrated head-pose geometry, not fabricated labels.",
        )
    options = {
        "workers": payload.workers,
        "freeze": payload.freeze,
        "smoke": payload.smoke,
        "validate_dataset": payload.validate_dataset,
    }
    run = models.TrainingRun(
        store_id=payload.store_id,
        task=payload.task,
        dataset_name=payload.dataset_name,
        dataset_yaml=payload.dataset_yaml,
        base_model=payload.base_model,
        epochs=payload.epochs,
        batch_size=payload.batch_size,
        image_size=payload.image_size,
        device=payload.device,
        seed=payload.seed,
        config=options,
        metrics={},
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    training_jobs.submit(run.id)
    return run


@app.get("/api/training/runs", response_model=list[schemas.TrainingRunRead])
def list_training_runs(
    store_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.TrainingRun)
    if store_id is not None:
        ensure_store_access(db, user, store_id)
        query = query.filter(models.TrainingRun.store_id == store_id)
    else:
        allowed_ids = _accessible_store_ids(db, user)
        if allowed_ids is not None:
            query = query.filter(models.TrainingRun.store_id.in_(allowed_ids))
    return query.order_by(models.TrainingRun.created_at.desc()).limit(100).all()


@app.get("/api/training/runs/{run_id}", response_model=schemas.TrainingRunRead)
def get_training_run(
    run_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    run = db.get(models.TrainingRun, run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Training run not found")
    ensure_store_access(db, user, run.store_id)
    return run
