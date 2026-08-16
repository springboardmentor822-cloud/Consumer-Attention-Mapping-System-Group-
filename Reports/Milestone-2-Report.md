# Milestone 2 Report: Dashboard, Analytics Engines & AI Services

**Project:** Consumer Attention Mapping System (CAMS)  
**Date:** August 2026  
**Status:** ✅ Completed

---

## 1. Objective

Build the consumer-facing analytics dashboard (Next.js) and the four AI-powered intelligence engines that transform raw shopper telemetry into actionable retail insights — behavior segmentation, spatial heatmaps, product attractiveness scoring, and diagnostic layout recommendations.

---

## 2. Architecture — Analytics Intelligence Layer

```
Raw Shopper Positions (DB)
         │
         ├──► Behavior Engine ──► Shopper Persona Segmentation (5 personas)
         │
         ├──► Heatmap Engine ──► Homography + 2D KDE Density Matrices
         │
         ├──► Attractiveness Engine ──► Weighted SKU Scores (0–100)
         │
         └──► Recommendation Engine ──► Diagnostic Heuristic Alerts
                                               │
                                               ▼
                                    FastAPI Analytics API
                                               │
                                               ▼
                                  Next.js Frontend Dashboard
                            (Role-based: 4 dashboard variants)
```

---

## 3. Deliverables

### 3.1 Behavior Intelligence Engine (`backend/app/services/behavior_engine.py`)

**Purpose:** Processes raw shopper position trails and classifies each customer journey into one of 5 behavioral personas.

**Pipeline:**
1. **Trajectory Distance** — Calculates total Euclidean path distance from position-to-position
2. **Movement Velocity** — Computes average velocity as `total_distance / session_duration`
3. **Zone Dwell Calculation** — Uses ray-casting point-in-polygon algorithm to test if each position falls within shelf coordinate polygons; aggregates dwell time per zone
4. **Gaze Interaction Counting** — Counts unique gaze_target hits as product interactions
5. **Persona Classification** — Rule-based decision tree mapping journey metrics to 5 segments:

| Persona | Classification Rule |
|---------|-------------------|
| **Explorer** | Dwell > 120s, visited ≥ 3 zones, interactions < 3 |
| **Quick Buyer** | Dwell < 45s, velocity > 1.5 |
| **Comparison Shopper** | Dwell > 90s, interactions ≥ 5 |
| **Impulse Buyer** | 30s ≤ dwell ≤ 90s, interactions ≥ 2, velocity < 1.0 |
| **Brand Loyal Customer** | 1 zone only, interactions ≥ 3 |

Results are persisted as `ShopperSession` records in the database.

### 3.2 Spatial Heatmap Engine (`backend/app/services/heatmap_engine.py`)

**Purpose:** Transforms camera pixel coordinates into store floor plan heatmaps using computer vision homography and statistical density estimation.

**Pipeline:**
1. **Homography Mapping** — Uses `cv2.findHomography()` to compute a 3×3 perspective transformation matrix from camera coordinates to planogram coordinates. Applies `cv2.perspectiveTransform()` to all shopper positions.
2. **2D Kernel Density Estimation** — Applies `scipy.stats.gaussian_kde` to produce smooth continuous density surfaces. Falls back to OpenCV `GaussianBlur` when insufficient data points.
3. **Downsampled Grid Transfer** — Resizes the 640×480 density matrix to a 64×48 grid for efficient JSON API transfer
4. **Redis Caching** — Caches computed heatmaps with 10-second TTL for sub-100ms API response times

**Supported Layer Types:**
- `foot_traffic` — Overall customer movement density
- `zone_density` — Per-zone traffic concentration
- `gaze_focus` — Gaze vector target density (where customers look)
- `shelf_hotspots` — Product shelf interaction heat concentration

### 3.3 Product Attractiveness Scoring Engine (`backend/app/services/attractiveness_engine.py`)

**Purpose:** Calculates a composite Attractiveness Score for every SKU on every shelf, enabling data-driven product placement decisions.

**Scoring Formula:**
```
Attractiveness Score = 0.35 × (Passing Traffic) + 0.25 × (Dwell Time) + 0.25 × (Interaction Count) − 0.15 × (Stockout Rate)
```

All parameters are normalized to [0, 100] using Min-Max scaling across the store's product catalog.

**Additional Computed Metrics:**
| Metric | Description |
|--------|-------------|
| `attention_duration` | Scaled dwell time in seconds |
| `pickup_rate` | Ratio of interactions to traffic |
| `conversion_rate` | Purchase-to-interaction ratio |
| `repeat_engagement` | Percentage of returning customer attention |

**Eye-Level Bonus:** Products positioned at eye level (0.8m–1.6m height) receive a 1.3× multiplier on raw traffic, dwell, and interaction metrics. Non-eye-level products receive a 0.85× factor.

Results are persisted as `ProductAttractivenessScore` records with configurable calculation windows (hourly, daily, weekly).

### 3.4 Diagnostic Recommendation Engine (`backend/app/services/recommendation_engine.py`)

**Purpose:** Evaluates attractiveness scores against a heuristic decision tree and generates actionable operational alerts for store managers.

**Decision Rules:**

| Rule | Condition | Priority | Example Action |
|------|-----------|----------|---------------|
| **High Traffic + Low Dwell** | Traffic > 60%, Dwell < 30% | High | "Add vibrant shelf talker, highlight discount tag" |
| **High Dwell + Low Conversion** | Dwell > 60%, Conversion < 25% | High | "Audit pricing, check stock, clarify product features" |
| **Eye-Level Relocation** | Score > 75, position_y < 0.6m | Medium | "Relocate from bottom shelf to 1.4m eye-level slot" |
| **Dead Zone** | Traffic 60% below store average | Medium | "Reposition anchor category to pull foot traffic" |

Each recommendation includes: issue type, priority level, title, description, recommended action, expected uplift metric, and status tracking (active → acknowledged → resolved).

### 3.5 Analytics REST API (`backend/app/api/analytics.py`)

8 endpoints exposing all four engines:

| Endpoint | Method | Engine | Description |
|----------|--------|--------|-------------|
| `/api/v1/analytics/behavior/sessions` | GET | Behavior | Shopper session logs with persona segments |
| `/api/v1/analytics/behavior/segmentation` | GET | Behavior | Breakdown of 5 personas (counts + percentages) |
| `/api/v1/heatmaps/store` | GET | Heatmap | 2D KDE density matrix (64×48 grid) |
| `/api/v1/heatmaps/shelf` | GET | Heatmap | 10×5 shelf grid interaction hotspots |
| `/api/v1/analytics/attractiveness` | GET | Attractiveness | Product attractiveness scores with metadata |
| `/api/v1/recommendations` | GET | Recommendation | Diagnostic recommendations list |
| `/api/v1/recommendations/{id}/action` | POST | Recommendation | Update recommendation status |

### 3.6 Sales & Dataset Analytics API (`backend/app/api/sales.py`)

7 endpoints processing archive CSV datasets (Walmart-style sales data):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sales/dataset-info` | GET | CSV file metadata and column descriptions |
| `/sales/overview` | GET | Total revenue, avg weekly sales, holiday lift analysis |
| `/sales/departments` | GET | Department-level sales breakdown with search & filter |
| `/sales/stores` | GET | Store-level performance, size, revenue density |
| `/sales/trends` | GET | Monthly sales performance time series |
| `/sales/promotions` | GET | Markdown spend breakdown, campaign ROI, effectiveness metrics |
| `/sales/macro-factors` | GET | Economic indicators (CPI, unemployment, temperature, fuel price) |

Features in-memory caching with JSON cache fallback for fast repeat queries. Maps 47 department IDs to human-readable retail category names.

### 3.7 Video Dataloader Service (`backend/app/services/video_dataloader.py`)

Serves pre-processed CCTV video feeds from the `datasets/retail_store_traffic/` directory for the frontend's live camera feed display.

### 3.8 Customer Tracker Service (`backend/app/services/customer_tracker.py`)

Integrates YOLOv8 object detection for real-time person tracking from CCTV video frames, providing bounding box coordinates and confidence scores.

---

## 4. Frontend Dashboard

### 4.1 Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js** (App Router) | React framework with server-side rendering |
| **TypeScript** | Type-safe component development |
| **Geist Font** | Google Fonts typography (Geist Sans & Geist Mono) |
| **CSS Variables** | Dark/light theme support via `ThemeContext` |

### 4.2 Application Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              — Root layout with AuthProvider & ThemeProvider
│   ├── page.tsx                — Landing / redirect page
│   ├── globals.css             — Global styles with CSS custom properties
│   ├── login/page.tsx          — Login page
│   ├── register/page.tsx       — Registration page
│   └── dashboard/
│       ├── page.tsx            — Main dashboard (162 KB — role-based routing)
│       └── components/
│           ├── AdministratorDashboard.tsx     — User management, system overview
│           ├── StoreManagerDashboard.tsx      — Store operations, camera feeds, occupancy
│           ├── RetailAnalystDashboard.tsx     — Analytics, heatmaps, attractiveness scores
│           ├── MarketingManagerDashboard.tsx  — Sales analytics, promotions, campaigns
│           ├── InteractiveHeatmapCanvas.tsx   — HTML5 Canvas heatmap renderer
│           ├── VisitorsAnalytics.tsx          — Live visitor count & analytics
│           ├── RecommendationFeed.tsx         — AI recommendation cards
│           ├── OperationalReports.tsx         — Exportable reports
│           ├── StoreSettings.tsx              — Store configuration panel
│           └── StoreShelfConfig.tsx           — Shelf layout configurator
└── context/
    ├── AuthContext.tsx          — JWT authentication state management
    └── ThemeContext.tsx         — Dark/light theme toggle
```

### 4.3 Role-Based Dashboards

Each of the 4 user roles sees a tailored dashboard view:

| Role | Dashboard | Key Features |
|------|-----------|-------------|
| **Administrator** | `AdministratorDashboard.tsx` (20 KB) | User management, role editing, account activation/deactivation, system health overview |
| **Store Manager** | `StoreManagerDashboard.tsx` (51 KB) | Live camera feeds, real-time occupancy counters, store settings, shelf configuration, operational alerts |
| **Retail Analyst** | `RetailAnalystDashboard.tsx` (69 KB) | Interactive heatmap canvas, behavior segmentation charts, product attractiveness leaderboard, recommendation feed |
| **Marketing Manager** | `MarketingManagerDashboard.tsx` (91 KB) | Sales overview KPIs, department revenue rankings, monthly trend charts, markdown/promotion analysis, campaign ROI tracking, macro-economic indicators |

### 4.4 Key UI Components

- **`InteractiveHeatmapCanvas.tsx`** — HTML5 Canvas renderer that paints 64×48 KDE density grid data as color-mapped heatmap overlays with gradient interpolation
- **`StoreShelfConfig.tsx`** (64 KB) — Full shelf layout editor with drag-and-drop product placement, coordinate polygon editing, and stock level management
- **`RecommendationFeed.tsx`** — Live feed of AI-generated optimization recommendations with priority badges and action buttons
- **`VisitorsAnalytics.tsx`** — Real-time visitor counting dashboard with per-camera breakdown

### 4.5 Authentication Flow

- `AuthContext.tsx` manages JWT token storage, login/logout actions, and user profile state
- Protected routes redirect unauthenticated users to `/login`
- Role is decoded from JWT to render the correct dashboard variant

---

## 5. Archive Datasets

Three CSV files in the `archive/` directory power the sales analytics:

| File | Size | Records | Key Columns |
|------|------|---------|-------------|
| `sales data-set.csv` | 13.3 MB | ~421K rows | Store, Dept, Date, Weekly_Sales, IsHoliday |
| `Features data set.csv` | 600 KB | 8,190 rows | Store, Date, Temperature, Fuel_Price, MarkDown1-5, CPI, Unemployment |
| `stores data-set.csv` | 577 B | 45 rows | Store, Type (A/B/C), Size (sq ft) |

---

## 6. ML Datasets

Four ML datasets in `datasets/` for computer vision model training:

| Dataset | Contents |
|---------|----------|
| `coco/` | COCO person detection annotations |
| `retail_checkout/` | Retail checkout item detection data |
| `retail_store_traffic/` | 8 CCTV video files (17 MB total) + zone manifest |
| `sku110k/` | SKU-110K shelf item recognition data |

---

## 7. API Endpoint Summary

### Authentication (6 endpoints)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/login/json`
- `GET /auth/me`, `GET /auth/users`, `PUT /auth/users/{id}/toggle-active`, `PUT /auth/users/{id}/role`

### Store Management (via `stores.py`, `cameras.py`)
- Store CRUD operations
- Camera configuration and stream management

### Live Pipeline (via `pipeline.py`)
- WebSocket streaming for real-time telemetry

### Sales Analytics (7 endpoints)
- Overview, departments, stores, trends, promotions, macro-factors, dataset-info

### Retail Intelligence (8 endpoints)
- Behavior sessions, segmentation, store heatmaps, shelf heatmaps, attractiveness scores, recommendations, recommendation actions

---

## 8. Technical Specifications

| Specification | Value |
|---------------|-------|
| Frontend Framework | Next.js (App Router) + TypeScript |
| CSS Approach | CSS Variables with Geist font family |
| Dashboard Variants | 4 role-specific views |
| Total Frontend Size | ~342 KB across 10 dashboard components |
| Analytics Engines | 4 (Behavior, Heatmap, Attractiveness, Recommendation) |
| Heatmap Resolution | 640×480 internal → 64×48 API transfer |
| Homography | OpenCV `cv2.findHomography` (4-point calibration) |
| KDE Method | `scipy.stats.gaussian_kde` with Gaussian blur fallback |
| Scoring Weights | Traffic 35%, Dwell 25%, Interaction 25%, Stockout 15% |
| Persona Count | 5 (Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer, Brand Loyal) |
| Sales Data | 421K+ records from Walmart-style dataset |
| Cache Strategy | Redis with 10s TTL + in-memory Python dict |

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `backend/app/services/behavior_engine.py` | Shopper persona classification engine |
| `backend/app/services/heatmap_engine.py` | Homography + KDE heatmap generator |
| `backend/app/services/attractiveness_engine.py` | Weighted SKU scoring engine |
| `backend/app/services/recommendation_engine.py` | Diagnostic recommendation generator |
| `backend/app/services/video_dataloader.py` | CCTV video feed service |
| `backend/app/services/customer_tracker.py` | YOLOv8 person detection tracker |
| `backend/app/api/analytics.py` | Analytics REST API (8 endpoints) |
| `backend/app/api/sales.py` | Sales analytics API (7 endpoints) |
| `frontend/src/app/dashboard/page.tsx` | Main dashboard page (role routing) |
| `frontend/src/app/dashboard/components/*.tsx` | 10 dashboard UI components |
| `frontend/src/context/AuthContext.tsx` | JWT authentication context |
| `frontend/src/context/ThemeContext.tsx` | Theme management context |

---

## 10. Outcome

Milestone 2 delivers a complete, production-ready analytics layer with:
- **4 AI engines** processing raw telemetry into actionable retail intelligence
- **Role-based dashboard** serving 4 distinct user personas with tailored views
- **Interactive heatmap canvas** rendering real-time spatial density data
- **Product attractiveness leaderboard** with weighted composite scoring
- **Automated diagnostic recommendations** with priority levels and uplift projections
- **Sales analytics module** processing 421K+ records with department rankings, trends, and promotion ROI
- **Full-stack deployment** via Docker Compose with PostgreSQL, Redis, FastAPI, and Next.js
