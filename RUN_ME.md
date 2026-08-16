# Quick start

Requires Docker Desktop installed and running.

```bash
./start.sh
```

Then open:
- Frontend: http://localhost:3001
- Backend API docs: http://localhost:8000/docs

Stop with `Ctrl+C`. To run in the background instead: `./start.sh -d`, then
`docker compose down` when you're done.

First run takes a few minutes (pulling Postgres/Redis images, installing
backend + frontend dependencies). Subsequent runs are much faster.

## Editing the frontend

The frontend is served as a static build inside Docker, so code changes
won't hot-reload automatically. After editing files under `frontend/src`,
rebuild just that service:

```bash
docker compose up --build frontend
```

If you're doing a lot of frontend work, it's faster to run the frontend
natively instead (with `db`, `redis`, `backend` still in Docker):

```bash
docker compose up -d db redis backend
cd frontend
npm install
npm run dev
```

This starts a dev server (usually http://localhost:5173) with instant
hot-reload on save.
