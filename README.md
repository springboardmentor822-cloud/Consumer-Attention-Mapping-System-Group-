🚀 Working Demo: The full working demo video is available here. Please open the link below to watch the demo:
https://github.com/user-attachments/assets/81e6bfad-0f59-4598-8f72-a63066ad8863


# 🛒 CAMS — Consumer Attention Mapping System

> **AI-Powered Retail Intelligence Platform** | YOLOv8 · ByteTrack · KDE Heatmaps · Next.js 14 · FastAPI

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Person%20Detection-FF6B6B?style=flat-square)](https://ultralytics.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📌 Problem Statement

Modern retail environments lack a seamless, automated way to understand how customers interact with physical store shelves. CAMS provides a rock-solid, secure, and scalable infrastructure capable of managing store layouts, user access, and high-throughput video streams — powering computer vision tracking models for real-time consumer behavior intelligence.

---

## 🎯 Project Overview

CAMS is a full-stack retail analytics platform that:
- 📹 **Monitors 6 live CCTV camera feeds** simultaneously in real time
- 🧠 **Detects & tracks shoppers** using YOLOv8 (person class) + ByteTrack MOT
- 🔥 **Generates 2D KDE heatmaps** to visualize spatial attention density
- 📊 **Scores product attractiveness** using dwell time + gaze engagement metrics
- 👁️ **Traces gaze rays** from shopper head coordinates toward product shelves
- 🏪 **Maps camera coordinates** to store floor plans via Homography Transformation
- 🔐 **Provides 4 role-based dashboards** for different business stakeholders

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CAMS Platform                        │
├─────────────────┬───────────────────┬───────────────────┤
│   Frontend      │    Backend API    │   CV Pipeline     │
│   Next.js 14    │    FastAPI        │   YOLOv8 +        │
│   React 18      │    Python 3.14    │   ByteTrack MOT   │
│   TailwindCSS   │    SQLAlchemy     │   OpenCV Streams  │
│   Canvas API    │    JWT Auth       │   KDE Heatmaps    │
└─────────────────┴───────────────────┴───────────────────┘
```

---

## 🚀 Features by Milestone

### ✅ Milestone 1 — Structural Foundations & Core Infrastructure
- **Project Architecture**: Next.js 14 App Router + FastAPI dual-server setup
- **JWT Authentication**: Role-based access control (4 user roles)
- **REST API Contracts**: Full CRUD for Stores, Shelves, Users
- **Database Schema**: PostgreSQL via SQLAlchemy ORM
- **6-Camera Fleet Management**: Live RTSP/OpenCV stream handling

### ✅ Milestone 2 — Computer Vision & Real-Time Tracking
- **YOLOv8 Person Detection**: Filters exclusively `class=person` — no false positives on shelves/products
- **ByteTrack MOT**: Persistent shopper IDs (`Shopper #101`, `#201`...) across frames
- **Canvas Overlay**: Transparent bounding boxes + gaze rays rendered over live video
- **6 Distinct Camera Zones**: Each feed seeks to a unique store zone timestamp

### ✅ Milestone 3 — Consumer Behavior Intelligence Engine
- **Dwell Time Tracking**: Measures seconds spent per shelf zone per shopper
- **Gaze Ray Tracing**: Red ray from shopper head → product focus point
- **2D KDE Heatmaps**: Kernel Density Estimation of spatial foot traffic density
- **Product Attractiveness Score**: Formula-based scoring engine (0–100)
- **AI Recommendations**: Rule-based diagnostic suggestions per product/zone

---

## 👥 Role-Based Dashboards

| Role | Dashboard | Key Features |
|------|-----------|--------------|
| 🏪 **Store Manager** | Fleet Camera View | Live 6-feed monitoring, zone alerts, shopper count |
| 📊 **Retail Analyst** | Analytics Deep-Dive | KDE heatmaps, homography floor plan, traffic flow |
| 📣 **Marketing Manager** | Campaign Intelligence | Product attractiveness scores, promo lift metrics |
| 🛡️ **System Administrator** | Platform Control | User management, camera health, API logs |

---

## 🖥️ Getting Started

### Prerequisites
- Node.js 18+
- Python 3.14+
- npm or yarn

### Frontend Setup (Next.js)

```bash
# Clone the repository
git clone https://github.com/springboardmentor822-cloud/Consumer-Attention-Mapping-System-Group-.git
cd Consumer-Attention-Mapping-System-Group-

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup (FastAPI)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

API Docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🏪 Store Manager | `store.manager@cams.ai` | `password123` |
| 📊 Retail Analyst | `analyst@cams.ai` | `password123` |
| 📣 Marketing Manager | `marketing@cams.ai` | `password123` |
| 🛡️ System Admin | `admin@cams.ai` | `password123` |

---

## 📡 REST API Endpoints

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@cams.ai", "password": "password123" }
```

### Store Layouts
```http
GET  /api/stores                          # List all stores with zones
GET  /api/stores/:storeId/shelves         # List shelves in a store
POST /api/stores/:storeId/shelves         # Create new shelf zone
PUT  /api/stores/:storeId/shelves/:id     # Update shelf zone
DELETE /api/stores/:storeId/shelves/:id   # Delete shelf zone
```

### Example Store Layout Response
```json
{
  "layout_id": "store_01",
  "name": "Store 01 - City Mall Flagship",
  "zones": [
    { "zone_id": 1, "name": "Zone 1: Entrance/Exit Foyer", "coordinates": [[10,20],[400,300]] },
    { "zone_id": 2, "name": "Zone 2: Main Grocery Aisle", "coordinates": [[50,60],[550,450]] },
    { "zone_id": 3, "name": "Zone 3: Checkout Lanes",     "coordinates": [[100,100],[600,500]] }
  ]
}
```

---

## 🔬 Computer Vision Pipeline

```
Video Frame (MP4/RTSP)
        │
        ▼
┌─────────────────┐
│  YOLOv8 Detect  │  ← class=person ONLY (strict filter)
│  Bounding Box   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ByteTrack MOT  │  ← Persistent ID across frames
│  ID Assignment  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gaze Ray Calc  │  ← Head centroid → shelf focus point
│  Dwell Timer    │  ← Time in zone bounding box
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  KDE Heatmap    │  ← (x,y) aggregated over time intervals
│  Floor Mapping  │  ← Homography → store planogram coords
└─────────────────┘
```

---

## 📁 Project Structure

```
cams-app/
├── app/
│   ├── api/
│   │   ├── auth/login/route.js          # JWT Auth endpoint
│   │   └── stores/
│   │       ├── route.js                  # Store CRUD API
│   │       └── [storeId]/shelves/
│   │           └── route.js              # Shelf CRUD API
│   ├── globals.css                       # Global styles
│   ├── layout.js                         # Root layout
│   └── page.js                           # Role-based router
├── components/
│   ├── LiveVideoCanvas.jsx               # YOLOv8 + ByteTrack canvas overlay
│   ├── StoreManagerDashboardView.jsx     # Fleet camera management
│   ├── RetailAnalystDashboardView.jsx    # KDE heatmaps + floor plans
│   ├── MarketingManagerDashboardView.jsx # Campaign & product scoring
│   └── AdminDashboardView.jsx            # System administration
├── lib/
│   └── cams-data.js                      # Data engine, scoring, recommendations
├── backend/
│   └── app/
│       ├── main.py                       # FastAPI application entry
│       ├── api/                          # Route handlers
│       ├── models/                       # SQLAlchemy ORM models
│       └── core/                         # Auth, DB, security config
└── public/
    └── images/                           # Store CCTV snapshot images
```

---

## 👩‍💻 Developer

**Manaswini** — Springboard Mentorship Program

> Built end-to-end: Frontend (Next.js 14), Backend (FastAPI), Computer Vision Pipeline (YOLOv8 + ByteTrack), and 4 role-based dashboards.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ for Retail Intelligence · Powered by YOLOv8 & Next.js
</div>
