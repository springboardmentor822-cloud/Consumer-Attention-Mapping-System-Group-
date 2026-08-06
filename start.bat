@echo off
echo 🚀 Starting Consumer Attention Mapping System...

echo 📦 Starting Docker containers...
docker-compose up -d

echo ⏳ Waiting for databases to be ready...
timeout /t 10

echo 📦 Installing backend dependencies...
cd backend
call npm install

echo 📦 Installing frontend dependencies...
cd ../frontend
call npm install

echo 🚀 Starting backend server...
cd ../backend
start /B npm run dev

echo 🚀 Starting frontend server...
cd ../frontend
start /B npm start

echo ✅ All services started!
echo 📊 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:3000
echo.
echo Press any key to stop all services...
pause >nul