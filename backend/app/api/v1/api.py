from fastapi import APIRouter

from app.api.v1.endpoints import (
    attention,
    auth,
    cameras,
    dashboard,
    heatmaps,
    live_cameras,
    notifications,
    oauth,
    products,
    recommendations,
    reports,
    retention,
    scores,
    sessions,
    shelves,
    stores,
    tracking,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(oauth.router, prefix="/auth/oauth", tags=["Auth - OAuth2"])
api_router.include_router(users.router, prefix="/users", tags=["Users (Admin)"])

api_router.include_router(stores.router, prefix="/stores", tags=["Stores"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["Cameras"])
api_router.include_router(live_cameras.router, prefix="/live-cameras", tags=["Live Cameras"])
api_router.include_router(shelves.router, prefix="/shelves", tags=["Shelves"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])

api_router.include_router(sessions.router, prefix="/sessions", tags=["Shopper Sessions"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["Tracking Data"])
api_router.include_router(attention.router, prefix="/attention", tags=["Attention & Interactions"])

api_router.include_router(heatmaps.router, prefix="/heatmaps", tags=["Heatmaps"])
api_router.include_router(scores.router, prefix="/scores", tags=["Product Attractiveness Scores"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(dashboard.router, prefix="/analytics", tags=["Dashboard Analytics"])

api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(retention.router, prefix="/retention", tags=["Data Retention (Admin)"])
