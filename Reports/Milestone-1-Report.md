# Milestone 1 Report: Core Infrastructure & Real-Time Tracking Pipeline

**Project:** Consumer Attention Mapping System (CAMS)  
**Date:** August 2026  
**Status:** ✅ Completed

---

## 1. Objective

Build the foundational backend infrastructure for a real-time in-store shopper tracking and spatial intelligence platform. This milestone delivers the FastAPI server, database schema design, camera telemetry simulation, Redis-based stream ingestion, and the background telemetry worker that persists high-throughput tracking data to the database.

---

## 2. Architecture Overview

CAMS uses a decoupled, three-tier architecture designed for high-throughput tracking log ingestion:

```
Camera Telemetry Simulator ──► Redis Stream: telemetry_ingest ──► Telemetry Aggregator Worker
                                       │                                    │
                                       ▼                                    ▼
                              WebSocket /stream                     Batch Inserts (100 rows)
                              (to Next.js Frontend)                 PostgreSQL / SQLite DB
                                                                         │
                                                     FastAPI REST API ◄──┘
                                                     (Query Config & Occupancy)
```

---

## 3. Deliverables

### 3.1 FastAPI Backend Server (`backend/app/main.py`)

- Built on **FastAPI** with automatic OpenAPI documentation
- CORS middleware configured for local Next.js development (`allow_origin_regex=".*"`)
- 6 API route modules registered at both `/api` and root prefixes:
  - `auth` — Authentication & user management
  - `stores` — Store CRUD
  - `cameras` — Camera configuration
  - `pipeline` — Live streaming pipeline
  - `sales` — Product sales analytics
  - `analytics` — Milestone 3 retail intelligence APIs
- Auto-seeds database with default users and store configuration on startup
- Starts telemetry worker and camera simulator as background daemon threads on `startup` event
- Graceful shutdown of workers on `shutdown` event

### 3.2 Database Schema (`backend/app/models/models.py`)

Designed a multi-tenant relational schema with **9 SQLAlchemy ORM models**:

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Login credentials with role-based access (Administrator, Store Manager, Retail Analyst, Marketing Manager) |
| `Store` | `stores` | Multi-tenant store profiles with name and location |
| `Shelf` | `shelves` | Physical shelf boundaries with zone names, dimensions (width/height in meters), and JSON coordinate polygons for spatial mapping |
| `Product` | `products` | Product catalogue with name, category, SKU, price, and image URL |
| `ShelfProduct` | `shelf_products` | Maps products to shelf positions (x, y coordinates, min/current stock levels) |
| `Camera` | `cameras` | Camera placements with stream URLs, floor plan coordinates (x, y), and rotation angles |
| `ShopperPosition` | `shopper_positions` | High-performance tracking table logging shopper coordinates (x, y, gaze_x, gaze_y, dwell_time, gaze_target) per camera per timestamp |
| `ShopperSession` | `shopper_sessions` | Aggregated session data — total path distance, average velocity, total dwell time, zone dwell JSON, interaction count, and shopper segment persona |
| `ProductAttractivenessScore` | `product_attractiveness_scores` | Composite SKU attractiveness metrics (passing traffic, dwell time, interaction count, stockout rate, attention duration, pickup rate, conversion rate, repeat engagement) |

All timestamps use UTC via a custom `utc_now()` helper. Relationships use SQLAlchemy `cascade="all, delete-orphan"` for referential integrity.

### 3.3 Database Engine & Configuration (`backend/app/core/`)

- **`config.py`**: Pydantic `BaseSettings` class loading environment variables with `.env` file support
  - JWT configuration: HS256 algorithm, 7-day token expiry
  - Database URL defaults to SQLite at project root, overridable via `DATABASE_URL` env var for PostgreSQL
- **`database.py`**: SQLAlchemy engine and session factory using `SessionLocal` pattern
- **`security.py`**: Bcrypt password hashing, JWT token creation/verification, `get_current_user` dependency, `RoleChecker` dependency for role-based access control

### 3.4 Authentication System (`backend/app/api/auth.py`)

- **POST `/auth/register`** — Register new users with role validation (4 allowed roles)
- **POST `/auth/login`** — OAuth2-compatible form-data login returning JWT bearer token
- **POST `/auth/login/json`** — JSON body login endpoint for frontend compatibility
- **GET `/auth/me`** — Retrieve authenticated user profile
- **GET `/auth/users`** — List all users (Administrator only)
- **PUT `/auth/users/{id}/toggle-active`** — Toggle user active status (Administrator only)
- **PUT `/auth/users/{id}/role`** — Update user role (Administrator only)

### 3.5 Camera Telemetry Simulator (`backend/app/workers/camera_simulator.py`)

A daemon thread that simulates **8 CCTV camera feeds** at 2 FPS (0.5s interval):

| Camera | Zone | Simulated Entities |
|--------|------|-------------------|
| Camera 1 | Entrance Foyer | 3 persistent customers (cart pusher, cart bay shopper, promo display viewer) |
| Camera 2 | Main Aisle A | 2 persistent + dynamic spawning customers (grocery & beverage browsing) |
| Camera 3 | Main Aisle B | 2 persistent + dynamic spawning customers (grocery & snack aisle) |
| Camera 4 | Checkout Lanes 1 | 1 cashier + 2 customers (POS terminal, impulse snack rack gazing) |
| Camera 5 | Apparel Section | 2 persistent customers (apparel rack, footwear display) |
| Camera 6 | Promotion Area | 2 persistent customers (seasonal promo stand, discount endcap) |
| Camera 7 | Checkout Lanes 2 | 1 cashier + 1 customer |
| Camera 8 | Store Exit | 2 persistent customers (exit gate, receipt check station) |

Each simulated entity includes: position (x, y), velocity (vx, vy), gaze target (named shelf/zone), gaze coordinates, object type, detection confidence, and label. Dynamic shoppers spawn with randomized trajectories and are pruned when they exit the camera frame.

All telemetry events are pushed to Redis Stream `telemetry_ingest` via `redis_client.xadd()`.

### 3.6 Redis Client with Mock Fallback (`backend/app/core/redis_client.py`)

- **`RedisWrapper`** — Attempts to connect to a Redis server; falls back silently to `MockRedisClient` if unavailable
- **`MockRedisClient`** — Full in-memory implementation of:
  - Key-Value operations (`get`, `set`, `delete`, `incrby`)
  - Hash operations (`hset`, `hget`, `hgetall`, `hdel`)
  - Stream operations (`xadd`, `xread` with blocking and ID comparison)
- This allows the system to run **without any external Redis dependency** for development

### 3.7 Telemetry Aggregator Worker (`backend/app/workers/telemetry_worker.py`)

A background daemon thread that:

1. **Reads** from Redis Stream `telemetry_ingest` using `xread` (blocking 100ms, batch of 100 messages)
2. **Parses** each telemetry event into structured shopper data (camera_id, shopper_id, x, y, dwell_time, gaze_target, gaze_x, gaze_y, object_type, confidence, label)
3. **Updates Redis state** — Writes shopper state as JSON hashes under `store:{store_id}:camera:{camera_id}:shoppers` with `last_seen` timestamps
4. **Bulk saves** accumulated rows to database when batch size (100) or flush interval (2 seconds) is reached — using SQLAlchemy `insert()` for optimal batch performance
5. **Prunes inactive shoppers** every 3 seconds — removes shoppers not seen for 10 seconds and updates live store occupancy counter `store:{store_id}:occupancy`
6. **Caches** camera-to-store mappings to avoid redundant DB queries

### 3.8 Seed Data (`backend/seed.py`)

Populates the database with:
- **4 test users** with distinct roles (admin, manager, analyst, marketing)
- **1 flagship store** — "Walmart Flagship Superstore #1" at 123 Main St, New York
- **8 shelves** mapped to store zones (Entrance, Aisle A–D, Promotion Area, Checkout, Exit) with JSON coordinate polygons
- **9 products** across categories (Beverages, Snacks, Groceries, Personal Care, Electronics, Home & Living)
- **9 shelf-product mappings** with position coordinates and stock levels
- **8 cameras** with stream URLs, floor plan coordinates, and rotation angles

### 3.9 Data Utilities

- **`populate_history.py`** — Generates multi-day mock shopper position logs for analytics
- **`export_db.py`** — Queries all 7 database tables and writes JSON exports to `backend/exports/`
- **`download_datasets.py`** — Downloads ML training datasets (COCO, retail checkout, store traffic CCTV, SKU110K)
- **`download_retail_cctv_dataset.py`** — Downloads retail CCTV video feeds for the 8-camera store layout

### 3.10 Docker Compose (`docker-compose.yml`)

4-service orchestration:
1. **PostgreSQL 15** (Alpine) with health check and persistent volume
2. **Redis 7** (Alpine) with health check and persistent volume
3. **FastAPI Backend** — builds from `backend/Dockerfile`, waits for healthy DB and Redis
4. **Next.js Frontend** — builds from `frontend/Dockerfile`, depends on backend

---

## 4. Technical Specifications

| Specification | Value |
|---------------|-------|
| Framework | FastAPI (Python) |
| Database | SQLite (dev) / PostgreSQL 15 (prod) |
| ORM | SQLAlchemy with Pydantic schemas |
| Authentication | JWT (HS256, 7-day expiry) + bcrypt hashing |
| Streaming | Redis Streams (with in-memory mock fallback) |
| Ingestion Rate | 100 rows per batch insert, 2s flush interval |
| Simulation Rate | 2 FPS per camera (8 cameras = 16 events/sec) |
| Camera Coverage | 8 zones across 1 flagship store |
| Containerization | Docker Compose (4 services) |

---

## 5. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@attention.com` | `password123` |
| Store Manager | `manager@attention.com` | `password123` |
| Retail Analyst | `analyst@attention.com` | `password123` |
| Marketing Manager | `marketing@attention.com` | `password123` |

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI application entry point |
| `backend/app/models/models.py` | 9 SQLAlchemy ORM models |
| `backend/app/core/config.py` | Application configuration |
| `backend/app/core/database.py` | Database engine & session |
| `backend/app/core/security.py` | JWT & bcrypt authentication |
| `backend/app/core/redis_client.py` | Redis wrapper with mock fallback |
| `backend/app/api/auth.py` | Authentication endpoints |
| `backend/app/workers/camera_simulator.py` | 8-camera telemetry simulator |
| `backend/app/workers/telemetry_worker.py` | Stream ingestion & DB writer |
| `backend/seed.py` | Database seeding script |
| `docker-compose.yml` | Multi-service container orchestration |

---

## 7. Outcome

Milestone 1 delivers a fully functional, self-contained backend system that:
- Boots a FastAPI server with auto-seeded data
- Simulates realistic multi-camera retail shopper telemetry
- Streams coordinates through Redis (or in-memory fallback)
- Ingests and persists high-throughput tracking data via batch inserts
- Provides JWT-authenticated REST API with role-based access control
- Can be deployed via Docker Compose or run locally with zero external dependencies
