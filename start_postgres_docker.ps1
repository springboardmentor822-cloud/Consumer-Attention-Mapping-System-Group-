# Helper script to launch PostgreSQL via Docker Desktop

Write-Host "Checking Docker Desktop Status..." -ForegroundColor Cyan

try {
    docker ps | Out-Null
    Write-Host "Docker daemon is active!" -ForegroundColor Green
} catch {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep -Seconds 10
}

Write-Host "Starting PostgreSQL Container on Port 5432..." -ForegroundColor Cyan
docker compose up -d postgres redis

Write-Host "Seeding PostgreSQL Database..." -ForegroundColor Cyan
Set-Location backend
python scripts/seed.py

Write-Host "Launching Backend API Server..." -ForegroundColor Cyan
Start-Process python -ArgumentList "-m uvicorn app.main:app --port 8000 --reload"

Set-Location ../frontend
Write-Host "Launching Frontend Dashboard..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "run dev"

Write-Host "Platform Successfully Launched with Docker PostgreSQL!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000/" -ForegroundColor Yellow
