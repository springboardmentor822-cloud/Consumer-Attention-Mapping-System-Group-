# Consumer Attention Mapping — Deployment Guide

## Local production-like stack

1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET_KEY` and real SMTP settings before production use.
3. Build and start everything with `docker compose up --build`.
4. Backend health: `http://localhost:8000/health`.
5. Frontend: `http://localhost:3000`.

The compose stack contains PostgreSQL, TimescaleDB, Redis, FastAPI, and Next.js. The large `backend/data` directory is intentionally excluded from Docker build context.

## Cloud deployment

Deploy the same containers to AWS ECS/Fargate, Azure Container Apps, or an equivalent container service. Put PostgreSQL/TimescaleDB and Redis behind managed/private networking where available. Store raw videos, snapshots, reports and heatmaps in object storage rather than inside the container filesystem.

Required production secrets:
- DATABASE_URL
- TIMESCALE_DATABASE_URL
- REDIS_URL
- JWT_SECRET_KEY
- SMTP_* values
- CORS_ORIGINS
- FRONTEND_URL

## CI/CD

`.github/workflows/ci.yml` builds/tests backend and frontend on pushes and pull requests. Add cloud deployment credentials/secrets only in the repository's protected environment; never commit credentials.
