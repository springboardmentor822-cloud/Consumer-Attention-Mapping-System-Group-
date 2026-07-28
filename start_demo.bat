@echo off
echo =========================================
echo Setting up Milestone 2 DB Migrations...
echo =========================================
cd backend
call ..\.venv\Scripts\activate
alembic revision --autogenerate -m "Add CoordinateLog"
alembic upgrade head
cd ..

echo.
echo =========================================
echo Starting Backend Server (with Redis Worker)...
echo =========================================
start "Backend Server" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && pip install -r requirements.txt && python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

echo.
echo =========================================
echo Starting Frontend Server...
echo =========================================
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================
echo Starting Live Tracker AI (YOLOv8)...
echo =========================================
start "AI Tracker" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && pip install ultralytics opencv-python && cd ml_engine\scripts && python live_tracker.py"

echo.
echo Everything is launching in separate windows!
echo 1. Wait a moment for all servers to start.
echo 2. Open http://localhost:5173
echo 3. Log in as the Store Manager.
echo 4. Scroll down to Section 6 to see the Live Heatmap drawing coordinates from the AI!
echo.
pause
