#!/usr/bin/env bash
# One-command startup for the attention-mapping project (Docker required).
#
# Usage:
#   ./start.sh          # build + start in foreground (see logs, Ctrl+C to stop)
#   ./start.sh -d        # build + start in background
#
# Then open:
#   Frontend  -> http://localhost:3001
#   API docs  -> http://localhost:8000/docs

set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH. Install Docker Desktop first: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# Ensure required env files exist (copy from example on first run).
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

echo "Starting attention-mapping (db, redis, backend, frontend)..."
docker compose up --build "$@"
