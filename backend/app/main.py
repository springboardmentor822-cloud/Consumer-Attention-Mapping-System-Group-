# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, stores, cameras, pipeline, sales, analytics

# Automatically bootstrap database tables on start.
# This runs SQL DDL queries locally against SQLite.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS for local development with Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routes (both with settings.API_V1_STR '/api' and root for seamless connectivity)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(auth.router)

app.include_router(stores.router, prefix=settings.API_V1_STR)
app.include_router(stores.router)

app.include_router(cameras.router, prefix=settings.API_V1_STR)
app.include_router(cameras.router)

app.include_router(pipeline.router, prefix=settings.API_V1_STR)
app.include_router(pipeline.router)

app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(sales.router)

app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router)



from app.workers.telemetry_worker import telemetry_worker
from app.workers.camera_simulator import camera_simulator

@app.on_event("startup")
def startup_event():
    # Auto-seed database with default users and store configuration if DB is empty
    from app.core.database import SessionLocal
    from seed import seed_data
    db = SessionLocal()
    try:
        seed_data(db)
    except Exception as e:
        print(f"Auto-seed warning: {e}")
    finally:
        db.close()

    telemetry_worker.start()
    camera_simulator.start()

@app.on_event("shutdown")
def shutdown_event():
    camera_simulator.stop()
    telemetry_worker.stop()

@app.get("/")
def get_status():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

