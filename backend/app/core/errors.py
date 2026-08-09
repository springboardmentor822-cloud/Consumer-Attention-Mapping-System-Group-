"""
App-wide fallback exception handlers.

Routers that already build their own structured error responses (e.g.
`app/api/routers/video.py`'s `_error_response`) are untouched. This only
catches what would otherwise become a bare, unstructured 500: unexpected
exceptions, and `TrackingPersistenceError`s raised somewhere that doesn't
already catch them locally.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.services.tracking_repository import TrackingPersistenceError

logger = logging.getLogger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(TrackingPersistenceError)
    async def tracking_persistence_error_handler(_: Request, exc: TrackingPersistenceError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "error": exc.error, "details": exc.details, "fix": exc.fix},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "internal_error",
                "details": "An unexpected error occurred.",
                "fix": "Check backend logs for the failing request.",
            },
        )
