# ADR 0003: Repositories, Service Interfaces, and DTOs

## Status
Proposed & Approved

## Context
Directly coupling API routers to SQLAlchemy database models makes refactoring databases difficult, complicates mock testing, and runs the risk of exposing sensitive entity fields (like password hashes) in REST API responses.

## Decision
We decouple the database operations and business logic using:
1. **Repository Pattern**: All database operations (CRUD) are isolated into a `repositories/` layer (`user_repository.py`, `store_repository.py`, etc.).
2. **Service Interfaces**: Routers only interact with abstract interfaces (`ITrackingService`, `IAnalyticsService`, etc.) provided via FastAPI Dependency Injection.
3. **DTO Separation**: Request inputs and response outputs are defined inside `schemas/dto/` and `schemas/events/` classes, separating Pydantic validation models from ORM tables.
4. **Domain Exceptions**: System validation issues are converted to structured domain exceptions (`AuthenticationError`, `CameraOfflineError`, etc.) handled by FastAPI global handlers.

## Consequences
- **Pros**: 100% unit-testable routers; easy substitution of storage providers (e.g. S3 vs local drive); secure data transfer boundaries.
- **Cons**: Increases the count of boilerplate classes (schemas, DTOs, interfaces).
