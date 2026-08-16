# Consumer Attention Mapping System

A retail consumer-attention analytics platform: containerized backend +
frontend + database, auth with RBAC, store/camera/shelf/product
management, computer-vision detection/tracking, camera calibration,
head-pose-based attention estimation, customer segmentation, and a React
ops console — built and verified module by module, with 43 passing
automated tests and multiple live end-to-end runs against a real backend.

## What's built and verified

- **Docker Compose** — Postgres + FastAPI backend + React/Nginx frontend,
  one command (`docker compose up --build`), identical on every machine.
- **Database** — normalized schema for Users, Roles, Stores, Zones,
  Cameras, Shelves (with physical coordinate fields), Products, shopper
  sessions, tracking points, attention events, interactions, heatmaps,
  scores, reports, notifications, recommendations.
- **Security** — register/login/refresh/password-reset/email-verify, JWT
  access+refresh tokens, Google OAuth2 scaffold, RBAC across 4 roles.
- **Dataset-driven population** — `scripts/dataset_import/` populates
  the system from a real public retail dataset (real store locations,
  real product categories, real product names/prices) instead of
  hand-typed data, via the actual REST API. Cameras are necessarily
  synthesized (clearly labeled, since no public camera-hardware dataset
  exists anywhere) but everything else traces back to real dataset rows
  — verified end-to-end, and this run surfaced and fixed a genuine
  backend bug (duplicate category names crashed with a raw 500 instead
  of a clean 400).
- **Frontend** — React + TypeScript + Vite + Tailwind CSS ops console:
  auth, store/camera management, shelf & product catalog management, and
  an analytics dashboard (summary stats, product engagement chart,
  recommendations, notifications, customer segment breakdown). Built
  clean, live-tested against the real backend end-to-end.
- **Live Cameras panel** — the Store Manager dashboard's camera wall: 8
  camera tiles (Entrance, Aisle 1-4, Promotion Area, Checkout, Exit), each
  backed by its own background thread that opens a real video source with
  OpenCV, runs the same pretrained YOLOv8n person detector used by the
  upload pipeline on every frame, and publishes annotated JPEGs the
  frontend renders as a live MJPEG stream (`GET
  /api/v1/live-cameras/{id}/stream`) — no page refresh, no polling. A
  `/ws/live-cameras` WebSocket pushes each camera's status and live person
  count once a second; a camera whose source drops is marked "Offline" and
  retried automatically. Sources are entirely config-driven
  (`backend/app/config/live_cameras.json`) — point an entry at a real
  RTSP/IP-camera URL or webcam index and it streams from that instead, no
  code changes. Without real hardware wired up, all 8 default to a real
  (not synthetic) pedestrian-footage sample video bundled at
  `backend/sample_media/vtest.avi`, so the panel shows genuine YOLO
  detections rather than a placeholder.
- **Video intake** — downsamples a camera/RTSP/file source to a target
  FPS (default 5), decoding only kept frames. Verified: 10fps/795 frames
  in → 5fps/398 frames out, exactly as expected.
- **Detection & tracking** — person detection + tracking + automatic
  shopper-session lifecycle, pushed to the backend. Verified end-to-end
  against a live backend (real sessions, real tracking rows).
- **Camera calibration** — converts pixel bounding boxes to real
  floor-plan coordinates (meters) via homography. Verified with a
  held-out-point geometry test and a live end-to-end run (real floor_x/
  floor_y values landed in the DB).
- **Attention estimation** — head-pose geometry (verified against
  synthetic ground-truth rotations, <3° error) + gaze-to-shelf mapping +
  a sustained-attention state tracker, pushing real `AttentionEvent` rows
  to the backend. Verified end-to-end: a simulated 3-second gaze produced
  exactly a 3.0s AttentionEvent in the database. **Now wired directly
  into the detection pipeline** (`detection/pipeline.py
  --enable-attention`): each tracked body's head region is cropped and
  run through a pluggable face-pose estimator every frame, verified with
  an integration test (sustained gaze → exactly one AttentionEvent
  routed to the correct shelf; track loses calibration → zero events).
- **Consumer segmentation** — rule-based classifier (Explorer / Quick
  Buyer / Comparison Shopper / Impulse Buyer / Brand Loyal), verified
  end-to-end: a 90-second single-purchase session was correctly
  classified as `quick_buyer`.
- **Product Attractiveness Score**, **heatmap aggregation**, **PDF/Excel
  reports**, **rule-based recommendations**, **rule-based notifications**
  — all real logic over real DB rows, not mocked. Notification checks
  (camera offline, low product visibility, traffic spikes) now run
  automatically every 60s via an in-process asyncio scheduler started
  alongside the FastAPI app — verified booting cleanly with the
  scheduler task active.
- **Data retention** — raw `tracking_data`/`attention_events` rows older
  than a configurable window (30 days by default) are automatically
  purged by a daily background job, with an admin API to view/trigger it
  manually. Aggregate records (sessions, purchases, scores) are
  deliberately untouched — only the raw positional/gaze data that could
  reconstruct where a specific person was is covered. Verified: seeded
  old + recent rows, confirmed only the old ones were deleted.
- **CI** — `.github/workflows/ci.yml` runs the full backend test suite,
  all four `ai_models` module test suites (each in its own matrix job,
  downloading the sample video fresh), and a frontend production build,
  on every push/PR.
- **58 passing automated tests** across 7 test suites (backend 21, video
  intake 3, detection 7, calibration 5, attention 16, dataset import 6),
  plus multiple live end-to-end runs against a real running backend
  documented in this project's build history.

## What's genuinely not finished, and why

Being direct about this rather than overclaiming:

- **Real YOLOv8 / MediaPipe model weights aren't fetchable in this
  sandbox.** Both `ultralytics` and `mediapipe` install and import fine,
  but their model-weight downloaders are blocked by this sandbox's
  network egress allowlist (`release-assets.githubusercontent.com` and
  `storage.googleapis.com` respectively — confirmed via explicit "Host
  not in allowlist" errors, not assumed). The integration code for both
  (`YOLOv8Detector`, `MediaPipeFaceLandmarker`, `MediaPipeFacePoseEstimator`)
  is complete and believed correct, but untested end-to-end here.
  Everything *downstream* of having model output (tracking, gaze
  mapping, the detection→attention wiring, backend ingest) **is**
  tested, using OpenCV's built-in HOG detector and a synthetic pose
  estimator as sandbox-friendly stand-ins — swap `--face-model-path`
  and `--detector yolov8` for the real thing on a machine with normal
  internet access or pre-downloaded model files, no other code changes.
- **No trained models on SKU-110K / RPC / retail-traffic / COCO.** Same
  root cause — this sandbox can't reach Kaggle or most model/dataset CDNs,
  and training beyond a toy run needs GPU compute this environment
  doesn't have.
- **No cloud IaC (AWS/Azure).** Docker Compose is the on-ramp to
  ECS/AKS/etc.; cloud-specific manifests weren't built.
- **No frontend E2E tests (Cypress/Playwright).** CI now runs the full
  backend + AI-module test suites and a frontend production build on
  every push; browser-driven E2E tests are a natural next addition.
- **The in-process scheduler is single-instance.** Fine for one
  deployment; a multi-replica production setup needs Celery beat or
  APScheduler with a shared job store instead, so jobs don't run
  redundantly on every replica.

## Architecture

See `documentation/ARCHITECTURE.md` for a full system diagram, data-flow
sequence diagram, and ER diagram (Mermaid). Short version:

```
backend/            # FastAPI + SQLAlchemy + PostgreSQL, 47 endpoints
frontend/            # React + TypeScript + Vite + Tailwind CSS ops console
  src/
    pages/           # Login, Register, Stores, Cameras, Catalog, Analytics
    components/      # AppShell, ProtectedRoute, UI primitives
    context/         # AuthContext (JWT session state)
    api/             # axios client with refresh-token handling
ai_models/
  video_intake/       # OpenCV FPS-downsampling intake service + tests
  detection/          # HOG/YOLOv8 detector + tracker + backend-ingest pipeline + tests
  calibration/        # pixel -> floor-plane homography calibration + tests
  attention/          # head pose + gaze-to-shelf mapping + tests
scripts/
  seed_data.py         # demo admin user + store + realistic synthetic behavior data
documentation/         # architecture/ER/sequence diagrams, dev guide, user manual
docker-compose.yml    # Postgres + backend + frontend, one command
```

## Quick start (Docker)

```bash
cd attention-mapping
docker compose up --build
```

`backend/.env` ships with working local-dev defaults (safe demo secret
key, no OAuth/SMTP configured — those fall back to console-logged stubs).
Edit it if you want to set a real `SECRET_KEY`, Google OAuth credentials,
or SMTP for real emails.

- API + Swagger docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Seed demo data (from your host, once containers are up):
  ```bash
  cd backend && python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  DATABASE_URL="postgresql+psycopg2://attention_user:attention_pass@localhost:5432/attention_mapping" \
    python ../scripts/seed_data.py
  ```
  Log in with `admin@example.com` / `Admin123!`.

To stop everything: `docker compose down` (add `-v` to also wipe the
Postgres volume and start fresh next time).

## Quick start (local, no Docker — SQLite)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="sqlite:///./dev.db"
uvicorn app.main:app --reload
```

In another terminal: `DATABASE_URL="sqlite:///./dev.db" python ../scripts/seed_data.py`
(creates one demo store with synthetic data — good for a quick smoke test).

For **real data** instead of a synthetic demo store, use the dataset
importer instead:
```bash
cd scripts/dataset_import
pip install -r requirements.txt
python import_dataset.py --backend-url http://localhost:8000/api/v1 \
  --email admin@example.com --password Admin123!
```
This populates real store locations, real shelf/product categories, and
real product names/prices from a public retail sales dataset — see
`scripts/dataset_import/README.md` for exactly what's real vs.
synthesized (cameras are necessarily synthesized; no public dataset of
camera hardware exists anywhere).

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

## The AI pipeline, end to end

```bash
# 1. Downsample a camera/video source to 5fps
cd ai_models/video_intake && pip install -r requirements.txt
python intake.py --source sample_data/vtest.avi --target-fps 5 --output out.mp4

# 2. Detect + track people, push sessions/tracking to the backend
cd ../detection && pip install -r requirements.txt
python pipeline.py --source ../video_intake/sample_data/vtest.avi \
  --backend-url http://localhost:8000/api/v1 \
  --email admin@example.com --password Admin123! --store-id 1 --camera-id 1

# 3. Calibrate a camera so tracking points get real floor coordinates
cd ../calibration && pip install -r requirements.txt
python calibrate.py --points points.json \
  --backend-url http://localhost:8000/api/v1 \
  --email admin@example.com --password Admin123! --camera-id 1

# 4. (production, needs real MediaPipe weights) head pose -> shelf attention
cd ../attention && pip install -r requirements.txt
python -m pytest test_head_pose.py test_gaze_mapping.py -v  # verify the geometry works
```

Each module's own README has the full detail, including exactly what's
tested here versus what's correct-but-blocked-by-sandbox-network.

## Running all tests

```bash
cd backend && python -m pytest app/tests/ -v                                    # 15 tests
cd ai_models/video_intake && python -m pytest test_intake.py -v                 # 3 tests
cd ai_models/detection && python -m pytest test_detection.py -v                 # 4 tests
cd ai_models/calibration && python -m pytest test_homography.py -v              # 5 tests
cd ai_models/attention && python -m pytest test_head_pose.py test_gaze_mapping.py -v  # 16 tests
```

## Database migrations (production path)

The app auto-creates tables on startup for dev convenience. For real
schema evolution:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Roles & permissions

| Role | Manage stores/cameras/shelves/products | View analytics | Admin-only actions |
|---|---|---|---|
| Administrator | Yes | Yes | user management, role changes |
| Store Manager | Yes | Yes | — |
| Retail Analyst | Read-only | Yes | — |
| Marketing Manager | Read-only | Yes (scores/recommendations focus) | — |

## A note on privacy

This system tracks and infers attention/gaze from people in a physical
store. Before deploying anything like this against real customers: check
local biometric/video-surveillance laws (GDPR in the EU, BIPA-style
statutes in some US states, etc.), and post clear in-store signage.
Raw tracking/attention data is now automatically purged after 30 days by
default (`app/services/retention_service.py`, configurable via
`TRACKING_DATA_RETENTION_DAYS`) — review whether that window fits your
jurisdiction's requirements before going live; some regions expect
shorter retention or explicit consent regardless of retention length.

## Documentation

- `documentation/ARCHITECTURE.md` — system diagram, ER diagram, sequence diagram
- `documentation/DEVELOPER_GUIDE.md` — setup, testing, how to extend each module
- `documentation/USER_MANUAL.md` — for store managers using the console
- `database/schema_dump.sql` — PostgreSQL schema dump, generated directly
  from the SQLAlchemy models (not hand-written, can't drift out of sync)
- `postman/` — a Postman collection covering auth, store/shelf CRUD, and
  failure states (unauthorized, duplicate email, wrong password,
  not-found), verified passing end-to-end via Newman
- `MILESTONE_1_SUBMISSION.md` — if this project is being submitted
  against a specific milestone checklist, this maps each requirement to
  the exact file(s) that satisfy it, in plain language

## 🎥 Project Workflow Screen Recording

-watch the Complete Project Workflow-(https://drive.google.com/file/d/1wqM3pvPiyzDl91CYev_VUMDwLqjmbtz5/view?usp=drivesdk)