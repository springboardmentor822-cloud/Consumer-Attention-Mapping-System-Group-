# Consumer Attention Mapping — Deployment Guide

## Local production-like stack

1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET_KEY` and real SMTP settings before production use.
3. First time only — the compose file uses external volumes so existing local data isn't wiped by an accidental `docker compose down -v`. Create them before the first run:
   ```
   docker volume create backend_camsystem_pgdata
   docker volume create backend_camsystem_redisdata
   docker volume create backend_camsystem_timescaledata
   ```
4. Build and start everything with `docker compose up --build`.
5. Backend health: `http://localhost:8000/health`.
6. Frontend: `http://localhost:3000`.

The compose stack contains PostgreSQL, TimescaleDB, Redis, FastAPI, and Next.js. The large `backend/data` directory is intentionally excluded from Docker build context.

`NEXT_PUBLIC_API_BASE_URL` is baked into the frontend's client-side bundle at **build time** (Next.js behavior), not read at container runtime. If you're deploying somewhere other than `localhost:8000`, set `NEXT_PUBLIC_API_BASE_URL` in your shell or `.env` *before* running `docker compose up --build`, so it reaches the frontend's build `args:`. Changing it and just restarting the container will not update the frontend — you must rebuild.

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
