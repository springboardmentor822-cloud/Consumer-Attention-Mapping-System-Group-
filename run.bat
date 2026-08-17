@echo off
echo Starting Consumer Attention Mapping System...

echo =========================================
echo Starting Backend Server...
echo =========================================
:: Start backend in a new command prompt window from root directory
start "Backend Server" cmd /k "cd /d %~dp0 && cd backend && alembic upgrade head && cd .. && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

echo =========================================
echo Starting Frontend Server...
echo =========================================
:: Start frontend in a new command prompt window
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause
