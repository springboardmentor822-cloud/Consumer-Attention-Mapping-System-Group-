# Architecture

## System overview

```mermaid
flowchart LR
    subgraph Store["In-store hardware"]
        CAM[Camera / RTSP / Webcam]
    end

    subgraph AI["ai_models/ (Python)"]
        VI[video_intake<br/>downsample to 5fps]
        DET[detection<br/>HOG or YOLOv8 + tracker]
        CAL[calibration<br/>pixel to floor homography]
        ATT[attention<br/>head pose + gaze mapping]
    end

    subgraph Backend["backend/ (FastAPI)"]
        API[REST API<br/>47 endpoints]
        SVC[Services<br/>scoring, heatmap, recommendation,<br/>notification, segmentation, reports]
        DB[(PostgreSQL)]
        WS[WebSocket<br/>live updates]
    end

    subgraph Frontend["frontend/ (React)"]
        UI[Ops console<br/>stores, cameras, catalog, analytics]
    end

    CAM --> VI --> DET
    CAL -.calibration data.-> DET
    DET -->|sessions, tracking points| API
    ATT -->|attention events| API
    API --> DB
    SVC --> DB
    API --> WS --> UI
    UI -->|JWT auth| API
```

## Data flow: a shopper walks through the store

```mermaid
sequenceDiagram
    participant Cam as Camera
    participant VI as video_intake
    participant Det as detection/pipeline
    participant Cal as calibration
    participant API as Backend API
    participant DB as PostgreSQL

    Cam->>VI: raw frames (e.g. 30fps)
    VI->>VI: grab() cheap, retrieve() only kept frames
    VI->>Det: emitted frame (5fps)
    Det->>Det: detect people, assign track IDs
    Det->>API: POST /sessions (new track seen)
    API->>DB: INSERT ShopperSession
    Det->>Cal: pixel foot-point -> floor coordinates
    Cal-->>Det: floor_x, floor_y
    Det->>API: POST /tracking/batch
    API->>DB: INSERT TrackingData rows
    Note over Det,API: on track disappearance
    Det->>API: PUT /sessions/{id} (exit_time)
    API->>DB: UPDATE ShopperSession
```

## Entity-relationship diagram

```mermaid
erDiagram
    USERS ||--o{ STORES : manages
    STORES ||--o{ STORE_ZONES : contains
    STORES ||--o{ CAMERAS : has
    STORES ||--o{ SHELVES : has
    STORE_ZONES ||--o{ CAMERAS : "located in"
    SHELF_CATEGORIES ||--o{ SHELVES : categorizes
    SHELVES ||--o{ PRODUCTS : holds
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : categorizes
    CAMERAS ||--o{ SHELVES : monitors
    STORES ||--o{ SHOPPER_SESSIONS : "visited by"
    SHOPPER_SESSIONS ||--o{ TRACKING_DATA : generates
    SHOPPER_SESSIONS ||--o{ ATTENTION_EVENTS : generates
    SHOPPER_SESSIONS ||--o{ PRODUCT_INTERACTIONS : generates
    SHELVES ||--o{ ATTENTION_EVENTS : "attended to"
    PRODUCTS ||--o{ ATTENTION_EVENTS : "attended to"
    PRODUCTS ||--o{ PRODUCT_INTERACTIONS : involved_in
    PRODUCTS ||--o{ PRODUCT_ATTRACTIVENESS_SCORES : scored
    STORES ||--o{ HEATMAPS : generates
    STORES ||--o{ REPORTS : generates
    STORES ||--o{ NOTIFICATIONS : raises
    STORES ||--o{ RECOMMENDATIONS : receives

    USERS {
        int id PK
        string email
        string role
        bool is_active
    }
    STORES {
        int id PK
        string name
        float floor_width_m
        float floor_height_m
    }
    CAMERAS {
        int id PK
        int store_id FK
        string camera_type
        string status
        text calibration_data
    }
    SHELVES {
        int id PK
        int store_id FK
        text position_coordinates
    }
    PRODUCTS {
        int id PK
        string sku
        int shelf_id FK
    }
    SHOPPER_SESSIONS {
        int id PK
        int store_id FK
        string shopper_uid
        string segment
    }
    TRACKING_DATA {
        int id PK
        int session_id FK
        float floor_x
        float floor_y
    }
    ATTENTION_EVENTS {
        int id PK
        int session_id FK
        int shelf_id FK
        float duration_seconds
    }
    PRODUCT_INTERACTIONS {
        int id PK
        int session_id FK
        int product_id FK
        string interaction_type
    }
```

## Module map

| Directory | What it is | Tested here? |
|---|---|---|
| `backend/` | FastAPI + PostgreSQL: auth/RBAC, all CRUD, scoring, heatmap, report, notification, recommendation, segmentation services | Yes — 15 tests |
| `frontend/` | React/TS/Vite/Tailwind ops console | Build-verified + live API smoke tests |
| `ai_models/video_intake/` | OpenCV FPS downsampling | Yes — 3 tests |
| `ai_models/detection/` | Person detection + tracking + backend ingest | Yes — 4 tests + live E2E |
| `ai_models/calibration/` | Pixel → floor-plane homography | Yes — 5 tests |
| `ai_models/attention/` | Head pose + gaze-to-shelf mapping | Yes — 16 tests + live E2E |
| `scripts/` | Demo data seeding | Yes — runs against SQLite/Postgres |
| `documentation/` | This file + others | — |

See each module's own README for what's genuinely tested versus what's
correct-but-blocked-by-sandbox-network integration code (YOLOv8 and
MediaPipe model weights specifically — both documented in detail in
their respective module READMEs).
