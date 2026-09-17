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

## Cloud deployment (AWS EC2 — actually deployed here)

This project is deployed on a real AWS EC2 instance (eu-north-1), not a generic
container service — this section documents what was actually done, including
the real problems hit.

**CPU-only Python dependencies:** `backend/requirements.txt` pins
`torch==2.13.0+cu126` / `torchvision==0.28.0+cu126` for real GPU acceleration
on local dev (RTX 4060). EC2 has no GPU. Installing `requirements.txt`
as-is on a GPU-less box still pulls several GB of unusable NVIDIA/CUDA
wheels (nvidia-cudnn, cublas, triton, etc.) even if you strip the `+cu126`
suffix by hand — PyPI's default Linux torch wheel bundles CUDA regardless.
This caused real `no space left on device` failures on the original 6.7GB
EBS volume. **Fix:** use `backend/requirements-cpu.txt` on any GPU-less
deployment target instead:
```
pip install -r requirements-cpu.txt
```
It points pip at PyTorch's actual CPU-only wheel index
(`--index-url https://download.pytorch.org/whl/cpu`) rather than just
editing version strings.

**EBS volume size:** the default root volume was too small for this
project's dependencies (OpenCV, ultralytics, torch, etc.) even after
switching to CPU-only wheels. Resize to at least 28GB before installing
(still within the free-tier 30GB-month EBS allowance).

**Docker build order:** building backend and frontend images in parallel
(`docker compose build`) can double peak disk pressure on a small EBS
volume. Build sequentially instead:
```
docker compose build backend
docker compose build frontend
```

**Secrets:** generate real production secrets (`JWT_SECRET_KEY`,
`POS_WEBHOOK_API_KEY`, DB password, SMTP credentials) directly on the
server, e.g.:
```
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
and write them into `.env` on the server directly — never pass real
secrets through a chat/AI assistant or commit them to git.

**SMTP:** Brevo's free tier is used (confirmed to still offer a genuinely
permanent free tier as of 2026, unlike SendGrid which discontinued its
free plan in May 2025 — verify current provider terms yourself before
relying on this long-term, pricing/policy pages change).

**Security group:** ports 3000 (frontend) and 8000 (backend) open.

**Known limitation, not yet fixed:** the deployment currently runs on
plain HTTP via the raw EC2 IP — no domain, no TLS. Login credentials and
JWTs travel unencrypted. Let's Encrypt can't issue a certificate for a
bare IP; this needs a real domain or a free dynamic-DNS subdomain (e.g.
DuckDNS) first.

Required production secrets (same as local, plus the POS key):
- DATABASE_URL
- TIMESCALE_DATABASE_URL
- REDIS_URL
- JWT_SECRET_KEY
- POS_WEBHOOK_API_KEY
- SMTP_* values
- CORS_ORIGINS
- FRONTEND_URL

## CI/CD

`.github/workflows/ci.yml` runs on pushes to the
`ritik-mishra-consumer-attention-mapping-system` branch and on pull
requests targeting `main`/`master`. Both backend (pytest) and frontend
(build) jobs must pass. Add cloud deployment credentials/secrets only in
the repository's protected environment; never commit credentials.
