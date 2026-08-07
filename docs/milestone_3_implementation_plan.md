# Implementation Plan - Milestone 3: Consumer Behavior Intelligence & Analytics Pipeline

Build and integrate **Milestone 3** covering the Consumer Behavior Intelligence Engine, Planogram Homography & Spatial Heatmap Workflows, Product Attractiveness Scoring Engine, Diagnostic Recommendation Engine, and FastAPI REST Endpoint integration with the React frontend dashboards.

---

## Overview & Architecture

### 1. Trajectory Analysis & Behavioral Segmentation
- **Data Ingestion**: Process session logs (`shopper_id`, `timestamps`, `(x, y)` coordinate tracking points).
- **Kalman Filter Smoothing**: Eliminate coordinate jitter and noise.
- **Metric Extraction**: Calculate total path distance, zone dwell times, and movement velocity.
- **Shopper Segmentation**: Classify sessions into 5 core personas using K-Means / Rule-Based heuristics:
  1. *Explorers*: High path distance, high dwell across multiple zones, low pickup rate.
  2. *Quick Buyers*: Low dwell time, direct path to single zone, immediate pickup & checkout.
  3. *Comparison Shoppers*: Extended dwell at single shelf, high pickup and return events.
  4. *Impulse Buyers*: Moderate path length, short view duration followed by immediate pickup.
  5. *Brand Loyal Customers*: Targeted navigation to brand zones with high purchase conversion.

### 2. Spatial Homography & Heatmap Pipeline
- **Coordinate Projection**: `cv2.findHomography` mapping 2D camera coordinates $(x_c, y_c)$ to flat store layout / shelf planogram coordinates $(x_p, y_p)$.
- **Gaussian Kernel Density Estimation (KDE)**: Multi-layer spatial density maps across store traffic, zone activity, product gaze focus, and grid-level shelf engagement.
- **API & Caching**: FastAPI `/api/v1/heatmaps/store` & `/api/v1/heatmaps/shelf` with filtering by store, shelf, date range, and segment.

### 3. Product Attractiveness Scoring Engine
- **Metric Normalization**: Min-Max scaling of Attention Duration ($A$), Interactivity ($I$), Pickup Rate ($P$), Conversion Rate ($C$), and Repeat Engagement ($R$) to $[0, 100]$.
- **Weighted Formula Execution**:
  $$\text{Attractiveness Score} = (0.35 \times A) + (0.25 \times I) + (0.20 \times P) + (0.15 \times C) + (0.05 \times R)$$
- **Database Persistence & API**: `/api/v1/analytics/attractiveness` exposing SKU scores, rankings, and historical trends.

### 4. Diagnostic Recommendation Engine
- **Heuristic Decision Trees**:
  - *High Attention + Low Pickups* $\rightarrow$ Suggest pricing/packaging check.
  - *Top Score + Bottom Shelf* $\rightarrow$ Suggest eye-level relocation.
  - *Low Traffic in Aisle* $\rightarrow$ Suggest placing popular anchor product nearby.
- **API Payload**: `/api/v1/recommendations` delivering structured JSON alerts with priority levels and expected conversion uplifts.

---

## Proposed Code Structure

```
backend/
├── app/
│   ├── ml/
│   │   ├── behavior_engine.py      # Kalman filter, trajectory metrics, K-Means segmentation
│   │   └── heatmap_engine.py       # Planogram homography (findHomography) & Gaussian KDE matrix generator
│   ├── services/
│   │   ├── attractiveness_engine.py # SKU metric scaling & weighted score calculation
│   │   └── recommendation_engine.py # Heuristic diagnostic decision trees
│   ├── routers/
│   │   └── milestone3_routes.py    # FastAPI routes for behavior, heatmaps, attractiveness, recommendations
│   ├── models.py                   # DB models for trajectory, attractiveness scores, recommendations
│   ├── schemas.py                  # Pydantic validation schemas
│   └── main.py                     # API router registration
```

---

## Verification Plan

1. **Automated Unit Tests**: `backend/tests/test_milestone3.py` validating Kalman smoothing, K-Means classification, homography projection, KDE density matrix generation, attractiveness formula, and diagnostic rules.
2. **FastAPI OpenAPI Swagger UI**: Verification of `/api/v1/behavior/segmentation`, `/api/v1/heatmaps/store`, `/api/v1/analytics/attractiveness`, and `/api/v1/recommendations`.
3. **Frontend REST Integration**: Testing dashboard UI views fetching live API endpoints.
