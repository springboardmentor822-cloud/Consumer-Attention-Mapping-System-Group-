# Consumer Attention Mapping System — Backend

FastAPI backend for the full system: auth/RBAC, store/shelf/zone/camera
management, the OpenCV/YOLOv8/ByteTrack tracking pipeline, product
interaction and journey analytics, alerting, campaigns, recommendations,
and PDF/Excel reporting.

## Local Setup

1. **Start Postgres, TimescaleDB, and Redis:**
   ```
   docker compose up -d
   ```

2. **Create a virtual environment and install dependencies:**
   ```
   python -m venv .venv
   source .venv/bin/activate   # on Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```
   `requirements.txt` pins CUDA-specific `torch`/`torchvision` wheels for
   local GPU acceleration. If you're installing on a machine with no GPU
   (e.g. a cloud deployment target), use `requirements-cpu.txt` instead —
   see `docs/DEPLOYMENT.md` for why this matters and what breaks if you
   skip it.

3. **Set up environment variables:**
   ```
   cp .env.example .env
   ```
   `.env.example` covers the JWT basics. The app also reads
   `TIMESCALE_DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, `FRONTEND_URL`,
   `POS_WEBHOOK_API_KEY`, and `SMTP_*` settings — see
   `app/core/config.py` for the full list and defaults. Replace
   `JWT_SECRET_KEY` with a real random string; the app refuses to start
   if it's left as the placeholder default.

4. **Run the persistent processes** (3 separate terminals, or use
   `start_pipeline.bat` on Windows, which automates all 3 in order):
   ```
   uvicorn app.main:app --reload
   python -m app.workers.timescale_writer
   ```
   `timescale_writer` drains the Redis tracking-event stream into
   TimescaleDB — tracking data never reaches the database without it
   running.

   Two additional optional background workers, run manually as needed
   (not started by `start_pipeline.bat`):
   ```
   python -m app.services.alert_worker           # evaluates + persists alerts
   python -m app.workers.recommendation_scheduler # periodic attractiveness/recommendation scoring
   ```

5. Visit `http://localhost:8000/docs` for interactive API docs (Swagger
   UI). On startup, tables are created automatically and default roles
   (SuperAdmin, StoreManager, Analyst) are seeded.

6. **Feed a camera through the tracking pipeline** (one-shot per camera,
   not auto-started — run manually when you want detection actually
   running against a video source):
   ```
   python -m app.services.tracking_runner <camera_id>
   python -m app.services.tracking_runner <camera_id> --product   # ProductDetector instead of PersonDetector
   ```

## API surface

Routers actually mounted in `app/main.py` (see `docs/API_SPEC.md` and
`/docs` for full request/response detail):

| Prefix | Covers |
|---|---|
| `/api/auth` | register, login, password reset |
| `/api/admin`, `/api/admin` (logs) | admin config, audit/event logs |
| `/api/users` | user management |
| `/api/stores` | stores, shelves, zones, cameras, dwell-time, traffic analytics, attractiveness, recommendations, segments, reports, product interactions |
| `/api/shelves` | shelf-camera-view configuration |
| `/api/campaigns` | campaigns, campaign analytics |
| `/api/v1/completion` | pickup/return/comparison candidates, journey linking |
| (heatmaps, live tracking) | mounted without an `/api` prefix — see `app/main.py` |

## Project structure

```
backend/
├── app/
│   ├── api/          # ~20 routers: auth, stores, cameras, campaigns,
│   │                  #   completion_analytics, reports, etc.
│   ├── core/          # config, db sessions (main + TimescaleDB), JWT/security,
│   │                  #   redis client, logging, role-based deps
│   ├── models/         # SQLModel schemas (13+): user, store, camera,
│   │                  #   tracking_event, product_interaction_event, etc.
│   ├── routers/        # live_tracking (WebSocket)
│   ├── services/       # tracking/detection pipeline, analytics logic,
│   │                  #   alert engine, report export, recommendation engine
│   ├── workers/        # timescale_writer, recommendation_scheduler
│   │                  #   (standalone processes, not FastAPI background tasks)
│   └── main.py         # FastAPI app init, router mounting
├── tests/              # 80 tests — auth, RBAC, tracking, analytics, security, etc.
├── data/                # camera source videos (Zone_1/2/3.mp4), YOLO training data
├── docker-compose.yml
├── requirements.txt      # local dev (GPU/CUDA pinned)
├── requirements-cpu.txt   # deployment (GPU-less)
├── start_pipeline.bat
└── .env.example
```
