from fastapi import APIRouter
from app.api.v1.auth.router import router as auth_router
from app.api.v1.stores.router import router as stores_router
from app.api.v1.shelves.router import router as shelves_router
from app.api.v1.cameras.router import router as cameras_router
from app.api.v1.dashboards import router as dashboards_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(stores_router, prefix="/stores", tags=["Store Management"])
router.include_router(shelves_router, prefix="/shelves", tags=["Shelf Management"])
router.include_router(cameras_router, prefix="/cameras", tags=["Camera Management"])
router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboard Intelligence"])
