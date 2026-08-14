@echo off
REM ============================================================
REM  CAMS Detection Engine ^|^| YOLOv8 + ByteTrack FastAPI Server
REM  Engine: http://localhost:8000
REM  WebSocket: ws://localhost:8000/cams/stream/{CAM-01..04}
REM ============================================================
setlocal
set "VENV_PYTHON=C:\cams-venv\Scripts\python.exe"
set "SCRIPT_DIR=%~dp0"
set "ENGINE_DIR=%SCRIPT_DIR%backend\python_engine"
echo.
echo  CAMS Detection Engine ^|^| YOLOv8 + ByteTrack
echo  Port: 8000
echo.
if not exist "%VENV_PYTHON%" (
    echo [ERROR] venv not found. Creating at C:\cams-venv...
    python -m venv C:\cams-venv
    C:\cams-venv\Scripts\pip.exe install ultralytics fastapi "uvicorn[standard]" websockets python-dotenv python-multipart opencv-python
)
"%VENV_PYTHON%" -c "import ultralytics" 2>nul
if errorlevel 1 (
    echo [INFO] Installing packages into C:\cams-venv...
    C:\cams-venv\Scripts\pip.exe install ultralytics fastapi "uvicorn[standard]" websockets python-dotenv python-multipart opencv-python
)
echo [INFO] Starting detection engine on port 8000...
cd /d "%ENGINE_DIR%"
"%VENV_PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
endlocal
