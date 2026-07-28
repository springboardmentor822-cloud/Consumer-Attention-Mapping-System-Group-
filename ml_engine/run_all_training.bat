@echo off
echo =======================================================
echo Starting ML Training Pipeline for Consumer Attention Mapping System
echo =======================================================
echo.
echo NOTE: Training on a CPU will take a significant amount of time.
echo Ensure your system has sufficient RAM available.
echo.

echo [1/2] Starting Crowd Counter Training...
python train_crowd.py
if %errorlevel% neq 0 (
    echo [ERROR] Crowd Counter training failed.
    exit /b %errorlevel%
)
echo [SUCCESS] Crowd Counter training complete!
echo.

echo [2/2] Starting SKU-110K Retail Product Training...
python train_retail.py
if %errorlevel% neq 0 (
    echo [ERROR] Retail Product training failed.
    exit /b %errorlevel%
)
echo [SUCCESS] Retail Product training complete!
echo.

echo =======================================================
echo All training jobs completed successfully!
echo Best models are saved in the 'weights' directory.
echo =======================================================
pause
