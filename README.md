# Consumer Attention Mapping System

Retail consumer-attention analytics: person detection and tracking from store
camera footage, turned into zone traffic, dwell time, shopper journeys,
attention heatmaps, product attractiveness scores and rule-based
recommendations, surfaced through role-specific dashboards.

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts
- Backend: FastAPI, SQLAlchemy, Pydantic, JWT, Passlib, Alembic
- Computer vision: Ultralytics YOLO (person detection), YOLO-World (open-vocabulary
  product/shelf detection), ByteTrack via `supervision` (tracking)
- Database: PostgreSQL
- Development: Docker ready

## Project Structure

```text
frontend/
backend/
database/
docs/
```

## Media and large files

Video footage, model weights (`*.pt`, `*.onnx`), datasets, training runs and
`backend/uploads/` are **deliberately not committed** - see `.gitignore`.

This is not an oversight. These files previously lived in git history and grew
the repository to roughly 66 GB, which exceeds what GitHub will accept and
forces every collaborator to download all of it on clone. GitHub also rejects
any single file over 100 MB outright, and typical store footage here is well
past that (the demo recording is ~278 MB).

### Demo recording

The one exception is `media/CAMS video.mp4`, the project demo recording. It is
a compressed cut kept under GitHub's 100 MB per-file limit so it commits as an
ordinary file - no Git LFS, no extra setup, and a plain `git clone` gets it.

To work with footage locally:

1. Use `media/CAMS video.mp4`, or obtain other footage from the project's
   shared drive.
2. Place it in `backend/uploads/videos/`.
3. Upload and process it through the **Video Processing** page in the app, or
   `POST /api/video/process`.

Processing writes tracking rows to the database, which is what every dashboard
reads - so the analytics work from the database, not from the video file being
present in the repository.

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in real values. Never
commit `backend/.env` - it holds database credentials and the JWT secret.
