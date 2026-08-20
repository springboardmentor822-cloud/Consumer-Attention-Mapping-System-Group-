from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from app.api import auth, stores, shelves, telemetry, analytics
from app.core.database import engine, Base

# Create SQLite database tables if they don't exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database init notice: {e}")

app = FastAPI(
    title="Consumer Attention Mapping System (CAMS) - Backend Microservice",
    version="3.0.0",
    description="Full-Stack Retail Intelligence API Engine powering YOLOv8 Person Detection, ByteTrack MOT, 2D KDE Heatmaps, Homography Floor Plans, and Attractiveness Analytics.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular REST API domain routers
app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(shelves.router)
app.include_router(telemetry.router)
app.include_router(analytics.router)

@app.get("/", tags=["System Health"])
def read_root():
    return {
        "status": "ONLINE",
        "service": "CAMS FastAPI Microservice Engine",
        "version": "3.0.0",
        "opencv_status": "READY",
        "active_routers": ["auth", "stores", "shelves", "telemetry", "analytics"],
        "timestamp": time.time()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
