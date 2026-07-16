from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, stores, shelves
from app.core.database import engine, Base

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

# Create FastAPI app
app = FastAPI(
    title="Consumer Attention Mapping System",
    description="AI-powered retail attention intelligence platform",
    version="1.0.0"
)

# Enable CORS (so frontend can connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(shelves.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Consumer Attention Mapping System",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api")
def api_info():
    return {
        "endpoints": [
            "/api/auth/register - Register new user",
            "/api/auth/login - Login user",
            "/api/stores - Get all stores",
            "/api/stores - Create store",
            "/api/stores/{store_id} - Get store by ID",
            "/api/stores/{store_id}/shelves - Get all shelves",
            "/api/stores/{store_id}/shelves - Create shelf"
        ]
    }