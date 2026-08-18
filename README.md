# 🛒 Consumer Attention Mapping System (CAMS)

An AI-powered retail intelligence platform that uses computer vision to track consumer attention, analyze in-store behavior, and deliver real-time insights across role-based dashboards.

---

### 📖 Introduction
The **Consumer Attention Mapping System (CAMS)** leverages YOLOv8 person detection and ByteTrack object tracking to transform raw store CCTV feeds into spatial intelligence. It enables retailers to analyze customer traffic patterns, dwell times, and product engagement through modern web dashboards.

### ❗ Problem Statement
Physical retail stores lack real-time visibility into customer shopping journeys. It is difficult to measure shelf/product visual engagement, analyze in-store traffic flow, and gather data on how visual displays or campaigns impact customer behavior before checkout.

### 🎯 Primary Objective
To build a real-time, AI-driven analytics system that processes CCTV video feeds to monitor customer attention, generate traffic heatmaps, and deliver role-specific operational insights.

### ✨ Main Features
*   **Real-Time Tracking:** YOLOv8 bounding boxes and ByteTrack persistent IDs overlaid on live video.
*   **Store Heatmaps:** Dynamic density heatmaps visualizing high-traffic and dwell zones.
*   **Shelf Intelligence:** Attention-rate scoring, product pickup events, and dwell time analysis.
*   **Access Control:** Secure JWT authentication with dedicated views for multiple roles.

### 🛠️ Technologies Used
*   **Frontend:** React 18, Vite, Recharts, TailwindCSS, HTML5 WebSockets.
*   **REST API:** Node.js, Express, Sequelize ORM, PostgreSQL, Redis.
*   **AI Engine:** FastAPI (Python), OpenCV, YOLOv8, ByteTrack.

### 🏗️ System Architecture
```
[ Video Feed ] ──► [ Python FastAPI AI Engine ] (YOLOv8 + ByteTrack)
                          │                       │
                 (WebSocket stream)        (Save metrics)
                          ▼                       ▼
                  [ React Frontend ] ◄─────► [ Node.js API ] ◄──► [ PostgreSQL ]
```

### 🖥️ Portals
*   **🔐 Admin:** Manage users, device registries, database backups, and system integrations.
*   **🏪 Store Manager:** Monitor live CCTV streams, traffic trends, floor heatmaps, and alerts.
*   **📣 Marketing Manager:** Track campaign ROI, product attractiveness, and promotion lift.
*   **📊 Retail Analyst:** Deep-dive journey mapping, bottleneck analysis, and export data.

### 🚀 How to Run
1.  **Start Services (Docker):** `docker-compose up -d`
2.  **Run Backend (Node):**
    ```bash
    cd backend && npm install && node seed_db.js && node seed_users.js && npm run dev
    ```
3.  **Run AI Engine (FastAPI):**
    ```bash
    cd backend && python -m venv venv && venv\Scripts\activate && pip install -r python_engine/requirements_detection.txt && npm run dev:detection
    ```
4.  **Run Frontend (React):**
    ```bash
    cd frontend && npm install && npm run dev
    ```
*(Or run `start.bat` on Windows for an automated setup)*

### 🎬 Project Demonstration
*   **Live Feeds:** Streams annotated video overlays for `CAM-01` through `CAM-04` using WebSockets.
*   **Dwell Heatmaps:** Displays consumer foot traffic density maps based on coordinate data.
*   **AI Metrics:** Attractiveness scoring and layout optimization suggestions.

### 📈 Current Implementation Status
*   **✅ Complete:** Auth/RBAC, Admin/Manager/Marketing portals, REST API routes, YOLOv8/ByteTrack engine, WebSocket stream, Heatmaps, Database schema & seeding, Docker Compose.
*   **🔧 In Progress:** Retail Analyst deep-dives, Redis caching, PDF export, responsive design.
*   **📋 Planned:** RTSP stream integration, automated email notification alerts.
