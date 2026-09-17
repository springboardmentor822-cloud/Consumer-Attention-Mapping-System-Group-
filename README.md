# Consumer Attention Mapping System

An internship project building a real, working in-store consumer attention
and product-interaction analytics platform: computer-vision tracking
(OpenCV/YOLOv8/ByteTrack) feeding a FastAPI backend and a Next.js
role-based dashboard suite, deployed live on AWS EC2.

**Live deployment:** `http://16.171.3.15:3000` (HTTP only — no domain/TLS
yet, a known and disclosed limitation, see `docs/DEPLOYMENT.md`)

## What this actually does

Tracks shoppers and products across store camera feeds and turns that into
real, queryable analytics: dwell time, heatmaps, product interactions
(contact / comparison / pickup-and-return candidates), camera-scoped
shopper journeys, and campaign/marketing tooling — surfaced through four
role-specific dashboards (Store Manager, Retail Analyst, Marketing
Manager, Admin).

This project is explicit throughout about what's a real observation versus
a derived heuristic — see `docs/DATA_QUALITY.md` for the honest breakdown
of what's measured directly, what's computed from that, and what's a
spatial-proximity heuristic rather than true hand-level or visual
re-identification detection.

## Stack

- **Backend:** FastAPI, PostgreSQL + TimescaleDB, Redis, SQLModel,
  OpenCV/YOLOv8/ByteTrack/DeepSORT tracking pipeline
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui,
  Recharts
- **Infra:** Docker Compose (local), AWS EC2 (deployed), GitHub Actions CI

## Project structure

```
.
├── backend/        # FastAPI app, tracking pipeline, tests — see backend/README.md
├── frontend/        # Next.js dashboards — see frontend/README.md
├── docs/
│   ├── API_SPEC.md       # API surface overview
│   ├── DATA_QUALITY.md   # what's real vs. derived vs. heuristic, honestly
│   ├── DEPLOYMENT.md     # local + real AWS EC2 deployment, incl. problems hit
│   └── M4_CHECKLIST.md
├── docker-compose.yml
└── schema.sql
```

## Getting started

See `backend/README.md` and `frontend/README.md` for local setup.
For deploying to a real GPU-less server, see the CPU-only dependency note
in `docs/DEPLOYMENT.md` before installing `backend/requirements.txt`
as-is — it's pinned for local GPU dev.

## Status

Milestones 1–3 complete. Milestone 4: security audit, centralized
logging, load testing, POS integration hardening, CI/CD, and a real AWS
deployment are done. Still open: HTTPS/domain, calibrated floorplan
homography (needs physical store measurements), hand-level pickup/return
detection, and true cross-camera visual re-identification — see
`docs/M4_CHECKLIST.md` for detail on what's genuinely finished versus
what's a disclosed, open limitation.
