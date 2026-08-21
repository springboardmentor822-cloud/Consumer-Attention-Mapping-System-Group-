import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import Base, engine
from app.middleware.rate_limit import RateLimitMiddleware
from app.api.v1 import (
    auth, sessions, analytics, heatmaps, 
    recommendations, products, campaigns, dashboards, system,
    alerts, reports
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Rate Limiting & Security Middleware
app.add_middleware(RateLimitMiddleware, max_requests=1000, window_seconds=60)


# CORS Middleware for React Vite frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_STR}/sessions", tags=["Sessions & Ingestion"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics & Segmentation"])
app.include_router(heatmaps.router, prefix=f"{settings.API_V1_STR}/heatmaps", tags=["Spatial Heatmaps & Homography"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["Recommendations Engine"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["Product Catalog"])
app.include_router(campaigns.router, prefix=f"{settings.API_V1_STR}/campaigns", tags=["Marketing Campaigns"])
app.include_router(dashboards.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Role Dashboards"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Notification & Alert Engine"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports & Export System"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System Status & Audit"])


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
