from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import ai_dashboard
from camera_worker import start_camera_workers
from routers.store_architecture import router as store_router
# ==========================
# Import Routers
# ==========================

from routers import (
    auth,
    users,
    stores,
    shelves,
    products,
    camera,
    analytics,
    reports,
    notifications,
    dashboard,
    ai_dashboard,
    video,
)
from routers import customer_journey
# ==========================
# Create Database Tables
# ==========================

Base.metadata.create_all(bind=engine)

# ==========================
# FastAPI App
# ==========================

app = FastAPI(
    title="AI Consumer Attention Mapping System",
    version="1.0.0",
    description="AI Powered Retail Analytics Platform"
)
# ==========================
# Startup Event
# ==========================

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("Starting Background Camera Workers...")
    print("=" * 60)

    start_camera_workers()

    print("Camera Workers Started Successfully")
# ==========================
# CORS
# ==========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        "http://localhost:5174",
        "http://127.0.0.1:5174",

        "http://localhost:5175",
        "http://127.0.0.1:5175",
        
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        
        "http://localhost:5178",
        "http://127.0.0.1:5178",

        "http://localhost:5182",
        "http://127.0.0.1:5182",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# Home
# ==========================

@app.get("/")
def home():
    return {
        "message": "AI Consumer Attention Mapping System API Running"
    }

# ==========================
# Routers
# ==========================

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

app.include_router(
    stores.router,
    prefix="/stores",
    tags=["Stores"]
)

app.include_router(
    shelves.router,
    prefix="/shelves",
    tags=["Shelves"]
)

app.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)

app.include_router(
    camera.router,
    prefix="/cameras",
    tags=["Cameras"]
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)

app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    ai_dashboard.router,
    prefix="/ai-dashboard",
    tags=["AI Dashboard"]
)

app.include_router(
    video.router,
    prefix="/video",
    tags=["Video Streaming"]
)
app.include_router(customer_journey.router)

app.include_router(store_router)