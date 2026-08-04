#!/bin/sh

echo "Waiting for PostgreSQL to start..."
python -c "
import socket
import time
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
for i in range(60):
    try:
        s.connect(('db', 5432))
        s.close()
        break
    except socket.error:
        time.sleep(1)
"
echo "Postgres is up."

echo "Applying Alembic database migrations..."
alembic upgrade head

echo "Seeding database with default records..."
python scripts/seed.py

echo "Setting up dataset files and model weights..."
python scripts/download_datasets.py

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
