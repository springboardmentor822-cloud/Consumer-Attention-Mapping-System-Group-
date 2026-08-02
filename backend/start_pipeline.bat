@echo off
REM Starts the 3 persistent backend processes in the correct order:
REM   1. Docker containers (postgres/redis/timescaledb) - must be up
REM      first, or uvicorn crashes on startup with a psycopg2
REM      connection-refused error that looks like an app bug but isn't.
REM   2. uvicorn (FastAPI app)
REM   3. timescale_writer.py (the Redis -> TimescaleDB -> WebSocket worker)
REM
REM Does NOT start tracking_runner.py - that's a one-shot per-camera
REM script you run manually when you actually want to feed a video
REM through detection, not a persistent service to auto-start.
REM
REM Run this from the backend\ directory.

echo Starting Docker containers...
docker-compose up -d

echo Waiting for Postgres to accept connections...
:wait_loop
docker exec camsystem-postgres pg_isready -U camsystem >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)
echo Postgres is ready.

echo Starting uvicorn in a new window...
start "backend - uvicorn" cmd /k "uvicorn app.main:app --reload"

echo Waiting a few seconds for the API to finish startup (init_db, TimescaleDB hypertable, role seeding)...
timeout /t 5 /nobreak >nul

echo Starting timescale_writer worker in a new window...
start "backend - timescale_writer" cmd /k "python -m app.workers.timescale_writer"

echo.
echo All 3 persistent processes are starting in their own windows.
echo Remember: tracking_runner.py is still run manually per camera, e.g.:
echo   python -m app.services.tracking_runner ^<camera_id^>
