import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients = {}  # { ip: [timestamp1, timestamp2, ...] }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limit for OpenAPI docs, health, static options
        if request.url.path in ["/health", "/docs", "/openapi.json"] or request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Clean timestamps older than window_seconds
        timestamps = self.clients.get(client_ip, [])
        timestamps = [t for t in timestamps if now - t < self.window_seconds]

        if len(timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Too many requests per minute.",
                    "status": "TOO_MANY_REQUESTS",
                    "retry_after_seconds": int(self.window_seconds - (now - timestamps[0]))
                },
                headers={
                    "Retry-After": str(int(self.window_seconds - (now - timestamps[0]))),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0"
                }
            )

        timestamps.append(now)
        self.clients[client_ip] = timestamps

        response: Response = await call_next(request)
        remaining = max(0, self.max_requests - len(timestamps))
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
