.PHONY: up down build migrate seed test lint format

# Start all Docker Compose containers
up:
	docker compose up -d

# Stop all Docker Compose containers
down:
	docker compose down

# Rebuild containers
build:
	docker compose build

# Run database migrations
migrate:
	docker compose exec backend alembic upgrade head

# Seed initial store layout assets
seed:
	docker compose exec backend python scripts/seed.py

# Run Pytest unit checks
test:
	docker compose exec backend python -m pytest backend/

# Format code with Black
format:
	black backend/

# Lint code with Ruff
lint:
	ruff check backend/
