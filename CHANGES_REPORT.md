# Consumer Attention Mapping — Changes Report

## Implemented in this package
- Added backend Dockerfile and backend .dockerignore.
- Added frontend Dockerfile with Next.js standalone output and frontend .dockerignore.
- Expanded docker-compose.yml to orchestrate PostgreSQL, TimescaleDB, Redis, FastAPI backend, and Next.js frontend.
- Added .env.example with container-aware service URLs and production-secret placeholders.
- Added GitHub Actions CI for backend compile/tests and frontend build.
- Added backend /health/dependencies endpoint for PostgreSQL, TimescaleDB and Redis checks.
- Changed CORS to use the existing CORS_ORIGINS setting instead of a hardcoded localhost origin.
- Switched attractiveness scoring away from deterministic mock providers for interaction, pickup, purchase and repeat. Interaction/repeat are derived from persisted tracking; pickup is explicitly a candidate signal; purchase is observed only when PurchaseEvent rows exist.
- Added missing runtime/test dependencies to requirements.txt based on imports used by the source tree.
- Added deployment, API, data-quality, and M4 checklist documentation.
- Added backend smoke test.
- Added the uploaded frontend API client as frontend/lib/api.ts.

## Not falsely marked complete
These require information or infrastructure not present in the uploaded source package:
- AWS/Azure account deployment and credentials.
- Managed object storage account/bucket configuration.
- True hand/keypoint pickup/return detection.
- Cross-camera person re-identification.
- Calibrated per-camera homography/floorplan points.
- Real POS transaction population if PurchaseEvent is empty.
- Formal production performance/security/load results.
- Centralized external log/trace service configuration.

## Validation
- Python source compilation completed successfully after changes.
- Full backend pytest could not run in the clean environment because project dependencies were not installed in the execution environment (`sqlmodel` was missing).
- Frontend production build was not completed in this execution because dependency installation exceeded the execution time budget. The source package supplied here should be built in the project's existing Node environment.
