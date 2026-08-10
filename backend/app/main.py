from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import auth, stores, video, users, roles, behavior, heatmaps, attractiveness, recommendations, alerts, reports
from .services.batch_writer import BatchWriterWorker

batch_worker = BatchWriterWorker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        from .core.database import SessionLocal, init_db
        from .models.role import Role

        # Create tables automatically if needed
        init_db()

        db = SessionLocal()
        try:
            if db.query(Role).count() == 0:
                default_roles = [
                    Role(id=1, name="Administrator", description="Full system access"),
                    Role(id=2, name="Store Manager", description="Manage stores, shelves, and cameras"),
                    Role(id=3, name="Retail Analyst", description="View analytics and reports"),
                    Role(id=4, name="Marketing Manager", description="View marketing insights"),
                ]
                db.add_all(default_roles)
                db.commit()

            from .models.user import User
            from .core.security import get_password_hash
            if db.query(User).count() == 0:
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("admin123"),
                    role_id=1,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
        finally:
            db.close()
    except Exception as e:
        print("Role seeding check failed:", e)

    batch_worker.start()
    yield
    # Shutdown
    batch_worker.stop()


app = FastAPI(
    title="AI Consumer Attention Mapping System", 
    version="0.1.0", 
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(roles.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(stores.router, prefix="/api/v1")
app.include_router(video.router, prefix="/api/v1")
app.include_router(behavior.router, prefix="/api/v1")
app.include_router(heatmaps.router, prefix="/api/v1")
app.include_router(attractiveness.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "AI Consumer Attention Mapping System API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
