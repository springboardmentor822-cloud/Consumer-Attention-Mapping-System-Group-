from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.utils.logging import get_structured_logger

logger = get_structured_logger("error_handlers")

def setup_error_handlers(app: FastAPI):
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"Global server error: {exc}", 
            exc_info=True, 
            extra={
                "path": request.url.path,
                "method": request.method,
                "query_params": str(request.query_params)
            }
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."}
        )
