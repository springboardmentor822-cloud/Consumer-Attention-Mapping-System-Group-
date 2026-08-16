# Consumer Attention Mapping System

The **Consumer Attention Mapping System** is an advanced AI-powered retail intelligence platform. It processes in-store video surveillance streams to track shopper movements, estimate customer gaze, detect shelf/product interactions, and compile retail analytics. This intelligence is delivered through dynamic dashboards designed for Retail Analysts, Store Managers, Marketing Managers, and Administrators to optimize store layouts and placement strategies.

---

## Key Objectives
* **Behavioral Tracking**: Detect and track shoppers across store zones using computer vision without storing personally identifiable information (PII).
* **Attention Mapping**: Quantify dwell times, gaze orientation, and interaction events (views, pickups, returns) at specific aisle displays.
* **Layout Optimization**: Generate data-driven recommendations to reposition products and improve display attractiveness.
* **Alerting & Surveillance Health**: Monitor store congestion and camera stream stability, notifying management of operational anomalies in real-time.
* **Compliance & Reporting**: Export executive PDF summaries and detailed Excel workbooks for sales and marketing reviews.

---

## System Architecture

The platform is designed around a modular, event-driven microservices architecture:

```
[ IP Camera Feeds ]
        │ (OpenCV / RTSP Streams)
        ▼
[ Video Ingestion Pipeline ] ──► (YOLOv8 Bbox & ByteTrack Shopper IDs)
        │
        ▼
[ Gaze & Interaction Engine ] ──► (Gaze Overlaps & Dwell Time Calculations)
        │
        ▼
[ Redis Queue Stream ] ◄── (tracking, interaction, alert & notification streams)
        │
        ▼
[ Redis Consumer Worker ] ──► [ SQLite / PostgreSQL Database ]
        │                                ▲
        ▼ (WebSockets / HTTP)            │
[ FastAPI REST Backend ] ────────────────┘
        │
        ▼ (JSON Telemetry)
[ React / Vite Frontend ]
```

### Architectural Components
* **React Frontend**: A single-page application built with React, TypeScript, and TailwindCSS, rendering charts (Recharts), live surveillance overlays, and interactive layout configurations.
* **FastAPI Backend**: A high-performance Python REST API exposing analytical endpoints, user session managers, and WebSocket broadcast channels.
* **Database Layer**: SQLite under local development (lean footprint) and PostgreSQL in production Docker containers.
* **Redis Integration**: Broker for queuing real-time frames and telemetry events (tracking, interactions, alerts).
* **Background Workers**:
  * **Redis Consumer**: Persists coordinates and updates shopper sessions.
  * **Analytics Worker**: Re-evaluates product attractiveness scores and fits K-Means segmentation models.
  * **Notification Worker**: Scans database metrics for low shelf performance, product visibility issues, and hardware connection timeouts.
  * **Report Worker**: Generates file exports (PDF and Excel formats).

---

## Core Features

### 1. Shopper Tracking & Behavioral Intelligence
Utilizes YOLOv8 and Kalman-filter smoothed ByteTrack shopper tracks to chart customer motion paths, velocity, and shopping dwell times within designated zone boundaries.

### 2. Shopper Segmentation
Executes background K-Means clustering to classify store visitors into actionable consumer profiles based on duration, path distances, and interaction counts:
* **Explorers**
* **Brand Loyal Customers**
* **Comparison Shoppers**
* **Impulse Buyers**
* **Quick Buyers**

### 3. Attention Heatmaps
Projects shopper dwell coordinates onto 2D floor plans using Gaussian Kernel Density Estimation (KDE) to visualize high-traffic "hotspots" and cold zones.

### 4. Product Attractiveness Scoring
Calculates real-time product interest scores by evaluating attention views, product pickups, and final checkouts:
$$\text{Attractiveness Score} = \frac{\text{Pickups} + \text{Comparisons}}{\text{Attention Views}} \times 100\%$$

### 5. Recommendation & Placement Optimization
Triggers algorithmic suggestions (High/Medium/Low priority) to swap under-performing items or restock highly viewed shelves based on calculated attraction matrices.

### 6. Role-Based Dashboards
* **Retail Analyst**: Visualizes Sankey visitor flow trajectories, shopper segmentation donut charts, and hourly traffic trends.
* **Store Manager**: Inspects 3x3 camera grids with live tracking trails, product detection bounding boxes, and active alarms.
* **Administrator**: Provides unified hardware and user access management panels.

### 7. Notification & Alert Engine
Scans database metrics and system states to generate live notifications:
* **Shelf Low-Performance**: Gaze records on a shelf $< 10$ in the last hour.
* **Product Low-Visibility**: Product views $< 5$ in the last hour.
* **Crowd Alert**: Overcrowded zones ($> 30$ distinct tracks in 5 minutes).
* **Traffic Drop**: Total traffic drops to $0$ during open hours ($09:00 - 21:00$).
* **Camera Disconnect**: Ingestion stream thread is offline or inactive.
* **Duplicate suppression**: Suppresses identical alerts for **2 hours** to avoid message floods.

### 8. Reporting & Export
* **PDF Export**: Generates executive ReportLab documents with styled tables of store conversion rates, shelf dwells, and camera events.
* **Excel Export**: Generates multi-tab openpyxl worksheets detailing store footprints, traffic dwell statistics, zone performance, and product interaction rates.

---

## Milestone 3 Implementation (Approved)
* Completed the core video ingestion pipeline with YOLOv8 person detection and ByteTrack tracking.
* Designed the 3x3 Store Manager surveillance grid and Retail Analyst flow metrics.
* Implemented K-Means clustering, Kalman coordinate filters, and 2D floorplan heatmaps.
* Integrated the main dashboard shell, navigation menus, and role permissions.

## Milestone 4 Implementation (Additive Updates)
* **Administrator dashboard integration**: Integrated `<UsersCRUD />` and `<CamerasCRUD />` to enable user provisioning, role assignments, stream state controls (start, stop, restart), and hardware removals.
* **Background alerting worker**: Extended `notification_worker.py` to evaluate shelf attention, product visibility, congestion spikes, traffic drops, and camera connection states with a 2-hour suppression window.
* **Analytical PDF & Excel exports**: Enriched the reports controller to query `AnalyticsService` and output fully populated PDF tables and multi-tab Excel sheets.

---

## Technology Stack
* **Frontend**: React, TypeScript, Vite, Axios, Recharts, TailwindCSS, Lucide Icons.
* **Backend**: Python 3.12, FastAPI, Uvicorn, SQLAlchemy ORM, openpyxl, ReportLab.
* **Database & Cache**: SQLite, PostgreSQL, Redis.
* **Machine Learning & CV**: OpenCV, YOLOv8, ByteTrack tracking, scikit-learn (K-Means), NumPy.
* **Infrastructure**: Docker, docker-compose, GitHub Actions.

---

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, cameras, reports, dashboards)
│   │   ├── core/            # Database and Redis configurations
│   │   ├── ml/              # YOLO, ByteTrack, gaze estimation, K-Means
│   │   ├── models/          # SQL database schemas
│   │   ├── services/        # Business logic & video ingestion stream threads
│   │   └── workers/         # Redis consumers, reports, and notification loops
│   └── tests/               # Backend Pytest suite
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (AdminDashboard, StoreManagerDashboard)
│   │   ├── layouts/         # Navigation and DashboardShell
│   │   └── pages/           # Analyst views, AlertCenter, and CRUD sheets
│   └── package.json
├── docker-compose.yml       # Production environment orchestrator
└── README.md
```

---

## Setup & Running the Project

### Prerequisites
* Python 3.12+
* Node.js 20+
* Redis (running locally or in Docker)

### Run Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the database and run the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Verification & Testing
* **Backend Pytest Suite**: 108/108 tests passed (`python -m pytest`).
* **Frontend Production Build**: Successful (`npm run build`).
* **Milestone 4 Status**: Verified; only the authorized files (`reports.py`, `notification_worker.py`, `AdminDashboard.tsx`, and `README.md`) have modifications.

---

## Implementation Demo Video

> 🎥 Implementation demonstration of the Consumer Attention Mapping System.

Below is a placeholder link for the screen-recording demo video.

* [Consumer Attention Mapping System - Implementation Demo](https://github.com/springboardmentor822-cloud/Consumer-Attention-Mapping-System-Group-/assets/demo_placeholder.mp4)

*(Note: To update this link with your uploaded video, drag and drop the local `D:\1000199304.mp4` file directly into a GitHub issue comment box to generate a static asset URL, and paste that URL here.)*
