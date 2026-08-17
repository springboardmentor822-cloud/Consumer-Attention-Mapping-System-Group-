@echo off
echo =========================================
echo CAMS DEMO STARTING
echo =========================================

cd backend
call ..\.venv\Scripts\activate
alembic upgrade head
cd ..

echo =========================================
echo Seeding Demo Data (CAMS SmartMart)...
echo =========================================
call .venv\Scripts\activate
python -m backend.app.seed_demo

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =========================================
    echo CAMS DEMO SEED FAILED
    echo Backend/Tracker not started.
    echo Fix seed error first.
    echo =========================================
    pause
    exit /b %ERRORLEVEL%
)

if exist .demo_env.bat (
    call .demo_env.bat
)

echo.
echo =========================================
echo Starting Backend Server...
echo =========================================
start "Backend Server" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && pip install -r requirements.txt && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

echo.
echo =========================================
echo Starting Frontend Server...
echo =========================================
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================
echo Starting Live Tracker AI (Webcam)...
echo =========================================
taskkill /FI "WINDOWTITLE eq AI Tracker*" /T /F >nul 2>&1
set CAMERA_SOURCE=0
start "AI Tracker" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate && pip install ultralytics opencv-python numpy==1.26.4 && cd ml_engine\scripts && set CAMERA_SOURCE=%CAMERA_SOURCE% && set CAMS_STORE_ID=%CAMS_STORE_ID% && set CAMS_CAMERA_ID=%CAMS_CAMERA_ID% && python live_tracker.py"

echo.
echo =========================================
echo Everything is launching in separate windows!
echo 1. Wait a moment for all servers to start.
echo 2. Open http://localhost:5173
echo 3. Log in as the Store Manager (manager@consumerattention.com / Manager@123).
echo =========================================
echo.
echo Press any key to stop all CAMS services and exit...
pause >nul

echo.
echo =========================================
echo Stopping CAMS Services...
echo =========================================
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AI Tracker*" /T /F >nul 2>&1
echo All services successfully stopped.
echo =========================================
timeout /t 2 >nul
