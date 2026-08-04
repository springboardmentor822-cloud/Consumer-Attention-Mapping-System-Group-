from fastapi import APIRouter
from .manager import router as manager_router
from .analyst import router as analyst_router
from .marketing import router as marketing_router
from .admin import router as admin_router

router = APIRouter()

router.include_router(manager_router, prefix="/manager", tags=["Manager Dashboard"])
router.include_router(analyst_router, prefix="/analyst", tags=["Analyst Dashboard"])
router.include_router(marketing_router, prefix="/marketing", tags=["Marketing Dashboard"])
router.include_router(admin_router, prefix="/admin", tags=["Admin Dashboard"])
