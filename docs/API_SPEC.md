# API Specification — Consumer Attention Mapping

The FastAPI application exposes role-protected REST APIs for authentication, stores, shelves, cameras, zones, dwell/traffic analytics, heatmaps, attractiveness, recommendations, shopper segments, reports, product interactions, admin logs, campaigns, campaign analytics and completion analytics.

The canonical route registration is in `backend/app/main.py`. The frontend client is `frontend/lib/api.ts`.

## Health
`GET /health` → `{ "status": "ok" }`

## Authentication
`POST /api/auth/login`
`GET /api/auth/me`

Bearer JWT authentication is used for protected routes.

## Analytics families
- `/api/stores/.../dwell-time`
- `/api/stores/.../traffic-analytics`
- `/api/v1/heatmaps/...`
- `/api/stores/.../attractiveness`
- `/api/stores/.../recommendations`
- `/api/stores/.../segments`
- `/api/stores/.../reports`
- `/api/v1/completion/...`
- `/api/campaigns/...`

For exact request/response schemas, use the live FastAPI OpenAPI document at `/docs` after the service is running.
