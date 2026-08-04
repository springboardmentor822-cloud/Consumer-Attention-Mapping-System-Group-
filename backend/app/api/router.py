from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.stores import router as stores_router
from app.api.shelves import router as shelves_router
from app.api.zones import router as zones_router
from app.api.cameras import router as cameras_router
from app.api.sessions import router as sessions_router
from app.api.interactions import router as interactions_router
from app.api.attention import router as attention_router
from app.api.analytics import router as analytics_router
from app.api.reports import router as reports_router
from app.api.v1.dashboards import router as dashboards_router
from app.api.ml import router as ml_router

router = APIRouter()

router.include_router(health_router, tags=["Health Probes"])
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(stores_router, prefix="/stores", tags=["Store Management"])
router.include_router(shelves_router, prefix="/shelves", tags=["Shelf Management"])
router.include_router(zones_router, prefix="/zones", tags=["Zone Management"])
router.include_router(cameras_router, prefix="/cameras", tags=["Camera Management"])
router.include_router(sessions_router, prefix="/sessions", tags=["Session Tracking"])
router.include_router(interactions_router, prefix="/interactions", tags=["Product Interactions"])
router.include_router(attention_router, prefix="/attention", tags=["Attention Tracking"])
router.include_router(analytics_router, prefix="/analytics", tags=["Analytics Reporting"])
router.include_router(reports_router, prefix="/reports", tags=["Report Generation"])
router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboard Intelligence"])
router.include_router(ml_router, prefix="/ml", tags=["Machine Learning"])


