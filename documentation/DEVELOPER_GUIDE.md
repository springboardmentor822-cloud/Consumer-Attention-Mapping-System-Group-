# Developer Guide

## Prerequisites

- Docker + Docker Compose (easiest path), or:
- Python 3.11+ and Node 20+ for running things locally without containers

## Local setup (no Docker)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="sqlite:///./dev.db"
uvicorn app.main:app --reload
# Swagger docs: http://localhost:8000/docs

# Seed demo data (separate terminal)
DATABASE_URL="sqlite:///./dev.db" python ../scripts/seed_data.py

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
# http://localhost:5173
```

## Docker setup

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

## Running all tests

```bash
cd backend && python -m pytest app/tests/ -v
cd ai_models/video_intake && python -m pytest test_intake.py -v
cd ai_models/detection && python -m pytest test_detection.py -v
cd ai_models/calibration && python -m pytest test_homography.py -v
cd ai_models/attention && python -m pytest test_head_pose.py test_gaze_mapping.py -v
```

31 tests total across the project as of this writing (15 backend, 3
video intake, 4 detection, 5 calibration, 16 attention).

## Adding a new backend endpoint

1. Add/extend the SQLAlchemy model in `backend/app/models/`.
2. Add the Pydantic request/response schema in `backend/app/schemas/`.
3. Add the route in `backend/app/api/v1/endpoints/<module>.py`, using
   `Depends(get_current_user)` or `Depends(require_admin_or_manager)` /
   `Depends(require_roles(...))` for auth.
4. Register the router in `backend/app/api/v1/api.py` if it's a new module.
5. Write a test in `backend/app/tests/` using the `client` fixture from
   `conftest.py` (isolated SQLite per test).

## Adding a new frontend page

1. Add API functions to `frontend/src/api/resources.ts`.
2. Add types to `frontend/src/types/index.ts`.
3. Build the page in `frontend/src/pages/`, wrapped in `<AppShell>`.
4. Add a route in `frontend/src/App.tsx` and a nav entry in
   `frontend/src/components/AppShell.tsx`.
5. Run `npm run build` before considering it done — `tsc -b` catches a
   lot.

## Wiring in the real YOLOv8 / MediaPipe models

This sandbox's network egress proxy blocks the CDN hosts both
Ultralytics and MediaPipe download model weights from
(`release-assets.githubusercontent.com` and `storage.googleapis.com`
respectively). All the integration code is written and believed correct
(`ai_models/detection/detector.py::YOLOv8Detector`,
`ai_models/attention/head_pose.py::MediaPipeFaceLandmarker`), just not
exercised end-to-end here. On a machine with normal internet access:

```bash
pip install ultralytics mediapipe
# YOLOv8 weights auto-download on first use
python ai_models/detection/pipeline.py --detector yolov8 --source rtsp://...
# MediaPipe: download face_landmarker.task manually or let mediapipe fetch it,
# then use MediaPipeFaceLandmarker + estimate_head_pose() per frame,
# paired with tracked floor positions from detection/pipeline.py
```

## Database migrations

The backend auto-creates tables on startup (`Base.metadata.create_all`)
for local development convenience. For real schema evolution:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## Known gaps (be upfront about these)

- No cloud IaC (AWS/Azure) — Docker Compose is the on-ramp to ECS/AKS/etc.
- No CI pipeline configured (tests exist and pass locally; wiring them
  into GitHub Actions or similar is a natural next step).
- No data-retention/TTL policy on `tracking_data` / `attention_events` —
  add one before handling real customer data (see privacy note in the
  main README).
- Detection→attention pairing (matching a tracked body to its face crop
  for pose estimation) isn't wired — see `ai_models/attention/README.md`.
- Frontend has no automated tests (build-verified + manual/API smoke
  tests only); no Cypress/Playwright E2E suite.
