# 🛒 Consumer Attention Mapping System (CAMS)

<div align="center">

![CAMS Banner](https://img.shields.io/badge/CAMS-Consumer%20Attention%20Mapping%20System-blue?style=for-the-badge&logo=eye&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Object%20Detection-FF6B35?style=flat-square)](https://ultralytics.com/)

</div>

---

## 📖 Introduction

The **Consumer Attention Mapping System (CAMS)** is an AI-powered retail intelligence platform that leverages computer vision and real-time video analytics to help retail businesses understand how shoppers interact with their store environment. By combining state-of-the-art object detection models (YOLOv8 + ByteTrack) with a modern full-stack web application, CAMS transforms raw CCTV footage into actionable business insights — all in real time.

The system empowers store managers, marketing teams, and retail analysts with deep visibility into consumer behavior, product attractiveness, shelf performance, and campaign effectiveness — enabling smarter, data-driven decisions to boost revenue and improve the shopping experience.

---

## ❗ Problem Statement

Traditional retail stores have limited visibility into how consumers behave within their physical space. Key challenges include:

- **Lack of real-time insights** into foot traffic, dwell time, and zone-level activity
- **Inability to measure** which products or shelf sections attract the most consumer attention
- **No data-driven feedback loop** for marketing campaigns and in-store promotions
- **Manual, error-prone methods** for tracking store performance and customer engagement
- **No unified platform** connecting store operations, marketing analytics, and executive reporting

Without automated consumer attention mapping, retailers are forced to rely on guesswork and outdated reports, leading to missed revenue opportunities and poor customer experience.

---

## 🎯 Primary Objective

> **To build a real-time, AI-driven retail analytics platform that automatically detects, tracks, and analyses consumer attention and behavior using CCTV camera feeds — enabling data-backed decisions across store management, marketing, and executive layers.**

### Supporting Objectives:
- Provide **live camera monitoring** with real-time person detection and tracking
- Generate **heatmaps** of high-traffic and high-attention zones in the store
- Measure **product-level attractiveness** and shelf interaction metrics
- Track **campaign effectiveness** by correlating promotions with consumer behavior
- Offer **role-based dashboards** for different stakeholders (Admin, Store Manager, Marketing Manager, Retail Analyst)
- Deliver **automated alerts and recommendations** based on detected behavior patterns

---

## ✨ Main Features

### 🔴 Real-Time Video Analytics
- Live CCTV feed processing with **YOLOv8** object detection and **ByteTrack** multi-object tracking
- WebSocket-based streaming of detection events to the frontend
- Per-camera independent detection sessions
- Support for multiple simultaneous camera feeds (CAM-01 to CAM-04)

### 🔥 Heatmap Generation
- Dynamic store heatmaps showing consumer density and dwell zones
- Zone-level aggregation of foot traffic data
- Visual overlays on store layout maps

### 📦 Shelf & Product Analytics
- Product interaction tracking (picks, views, dwell time)
- Shelf performance scoring per zone/aisle
- Product attractiveness scoring powered by the AI attractiveness engine

### 📊 Consumer Behavior Intelligence
- Customer journey mapping across store zones
- Customer segmentation based on behavior patterns
- Dwell time analysis per product, shelf, and zone
- Traffic flow visualization and bottleneck detection

### 📣 Marketing & Campaign Analytics
- Campaign performance tracking tied to in-store behavior
- Promotion effectiveness measurement
- Product visibility and placement impact analysis
- Conversion analysis from attention to purchase intent

### 🔔 Alerts & Recommendations
- Automated store alerts for unusual activity or low-engagement zones
- AI-powered recommendations for shelf optimization and product placement
- Marketing action center for campaign adjustment

### 👥 Multi-Role Access Control
- JWT-based authentication and role-based access control (RBAC)
- Dedicated dashboards for Admin, Store Manager, Marketing Manager, and Retail Analyst
- User management, device management, and audit logging

### 🐳 Docker Support
- Full Dockerized deployment with docker-compose
- Containerized PostgreSQL, Redis, Node.js backend, and React frontend

---

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **React Router v6** | Client-side routing |
| **Recharts / Chart.js** | Data visualization and charts |
| **TailwindCSS** | Utility-first styling |
| **WebSocket API** | Real-time camera stream events |
| **TensorFlow.js + COCO-SSD** | In-browser object detection (supplementary) |

### Backend (Node.js / Express)
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **Sequelize ORM** | PostgreSQL database interaction |
| **PostgreSQL 15** | Primary relational database |
| **Redis** | Caching and session management |
| **JWT (jsonwebtoken)** | Authentication and authorization |
| **bcryptjs** | Password hashing |
| **Helmet + Morgan** | Security and logging middleware |

### AI / Python Detection Engine
| Technology | Purpose |
|---|---|
| **FastAPI** | Python AI microservice framework |
| **YOLOv8 (Ultralytics)** | Real-time object/person detection |
| **ByteTrack** | Multi-object tracking across frames |
| **OpenCV** | Video frame capture and processing |
| **Python asyncio** | Async WebSocket event streaming |
| **uvicorn** | ASGI server for FastAPI |

### Infrastructure & DevOps
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization |
| **PostgreSQL (Docker)** | Production-grade database |
| **Redis (Docker)** | In-memory caching |
| **.env configuration** | Environment-based secrets management |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAMS Architecture                        │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐        ┌───────────────────────────────┐
  │   React Frontend    │        │    Node.js REST API (5000)    │
  │   (Vite / Port 3000)│◄──────►│  Express + Sequelize + JWT    │
  │                     │  HTTP  │  Routes: auth, stores,        │
  │  4 Role Portals:    │        │  cameras, shelves, products,  │
  │  - Admin            │        │  zones, customers,            │
  │  - Store Manager    │        │  transactions, promotions,    │
  │  - Retail Analyst   │        │  analytics                    │
  │  - Marketing Mgr    │        └──────────────┬────────────────┘
  │                     │                       │
  │  Live Camera View ──┼──WebSocket────────────┼──►┐
  └─────────────────────┘                       │   │
                                                │   │
                                    ┌───────────▼───▼──────────────┐
                                    │  Python AI Engine (8000)      │
                                    │  FastAPI + Uvicorn            │
                                    │                               │
                                    │  ┌─────────────────────────┐  │
                                    │  │  detection_engine.py    │  │
                                    │  │  YOLOv8 + ByteTrack     │  │
                                    │  └─────────────────────────┘  │
                                    │  ┌─────────────────────────┐  │
                                    │  │  heatmap_engine.py      │  │
                                    │  └─────────────────────────┘  │
                                    │  ┌─────────────────────────┐  │
                                    │  │  behavior_engine.py     │  │
                                    │  └─────────────────────────┘  │
                                    │  ┌─────────────────────────┐  │
                                    │  │  attractiveness_engine  │  │
                                    │  └─────────────────────────┘  │
                                    │  ┌─────────────────────────┐  │
                                    │  │  recommendation_engine  │  │
                                    │  └─────────────────────────┘  │
                                    └──────────────┬────────────────┘
                                                   │
                              ┌────────────────────▼──────────────────┐
                              │           Data Layer                   │
                              │  ┌──────────────┐  ┌───────────────┐  │
                              │  │  PostgreSQL  │  │    Redis      │  │
                              │  │  (Port 5432) │  │  (Port 6379)  │  │
                              │  └──────────────┘  └───────────────┘  │
                              └────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │  Video Sources: store1.mp4 | aisle1.mp4 | checkout1.mp4 | ...   │
  │  YOLO Models: yolov8n.pt | yolov8s.pt | yolov8m.pt              │
  └──────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Video Ingestion** → OpenCV reads store camera video files (or live RTSP feeds)
2. **AI Detection** → YOLOv8 detects persons per frame; ByteTrack assigns persistent IDs
3. **Engine Processing** → Behavior, heatmap, and attractiveness engines compute metrics
4. **Storage** → Results are persisted to PostgreSQL via the Node.js API
5. **Real-Time Streaming** → FastAPI WebSocket broadcasts annotated frames to the frontend
6. **Dashboard Display** → React frontend renders live detections, charts, and heatmaps

---

## 🖥️ Portals

CAMS provides **4 role-based portals**, each with dedicated dashboards and analytics pages:

---

### 🔐 1. Admin Portal
Full system control and oversight for system administrators.

| Page | Description |
|---|---|
| Dashboard Overview | System-wide KPIs and health metrics |
| User Access Management | Create, manage, and assign roles to users |
| Store & Device Management | Register stores and manage camera devices |
| AI Infrastructure | Monitor AI engine status and model configurations |
| Shelf Management | Configure shelf zones and product placements |
| Consumer Analytics | High-level consumer behavior overview |
| Security & Audit | Login audit logs, access control events |
| Backup & Recovery | Database backup and restore management |
| Reports & Export | Generate and export system-wide reports |
| Admin Integrations | Manage third-party system integrations |
| System Settings | Platform-wide configuration settings |
| Notifications | System-level alerts and notifications |
| Profile & Support | Admin profile and helpdesk access |

---

### 🏪 2. Store Manager Portal
Real-time operational view of the physical store.

| Page | Description |
|---|---|
| Store Overview | Live summary of todays store performance |
| Live Cameras | Real-time CCTV feeds with AI person detection overlay |
| Store Heatmap | Visual heatmap of customer density zones |
| Store Traffic | Foot traffic trends and hourly visitor counts |
| Visitors Analytics | Visitor demographics and behavioral patterns |
| Product Interaction | Product pickup, dwell time, and engagement metrics |
| Shelf Performance | Shelf zone scoring and planogram compliance |
| Store Alerts | Real-time alerts for anomalies and low-traffic zones |
| Store Reports | Operational performance reports |
| Store Settings | Store-specific camera and zone configurations |

---

### 📣 3. Marketing Manager Portal
Campaign performance and consumer engagement analytics.

| Page | Description |
|---|---|
| Marketing Overview | High-level campaign and engagement summary |
| Campaigns | Active and past campaign management |
| Campaign Performance | ROI, impressions, and engagement per campaign |
| Campaign Reports | Downloadable campaign performance reports |
| Promotion Effectiveness | Before/after analysis of in-store promotions |
| Product Visibility | Share-of-shelf and product placement visibility scores |
| Product Attractiveness | AI-scored attractiveness by product/zone |
| Conversion Analysis | Attention-to-purchase funnel analytics |
| Attention Insights | Consumer attention hotspots per zone |
| Customer Engagement | Engagement trends and repeat visitor analysis |
| Traffic Insights | Traffic sources and peak time analysis |
| Marketing Recommendations | AI-generated recommendations for campaign optimization |
| Action Center | Quick actions for live campaign adjustments |
| Export Reports | Download analytics data as CSV/PDF |
| Settings | Marketing portal preferences |

---

### 📊 4. Retail Analyst Portal
Deep-dive analytics for data-driven retail insights.

| Page | Description |
|---|---|
| Analyst Overview | Comprehensive analytics summary dashboard |
| Consumer Behavior Intelligence | Advanced behavior pattern analysis |
| Attention Analytics | Zone-level attention heatmaps and metrics |
| Customer Journey | End-to-end shopper path visualization |
| Customer Segmentation | Segment shoppers by behavior profiles |
| Customer Behavior | Individual and aggregate behavior metrics |
| Traffic Flow | Store traffic flow patterns and bottlenecks |
| Dwell Time Analysis | Per-zone and per-product dwell time breakdown |
| Zone Performance | Performance scoring for each store zone |
| Category Performance | Analytics by product category |
| Product Analytics | SKU-level product performance data |
| AI Insights | AI-generated narratives and trend summaries |
| Reports | Custom report builder and history |
| Export Data | Raw data export for external analysis |
| Settings | Analyst portal preferences |

---

## 🚀 How to Run

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) 18.x or higher
- [Python](https://python.org/) 3.10 or higher
- [PostgreSQL](https://www.postgresql.org/) 15 (or use Docker)
- [Docker & Docker Compose](https://www.docker.com/) *(optional but recommended)*

---

### Option 1: Run with Docker Compose *(Recommended)*

```bash
# Clone the repository
git clone https://github.com/your-org/Consumer_Attention_Mapping_System.git
cd Consumer_Attention_Mapping_System

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Python AI Engine: http://localhost:8000
```

---

### Option 2: Run Manually (Step by Step)

#### Step 1 — Start the Database

```bash
docker run -d \
  --name attention_db \
  -e POSTGRES_USER=attention_user \
  -e POSTGRES_PASSWORD=attention_pass \
  -e POSTGRES_DB=attention_db \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Step 2 — Configure Environment Variables

```bash
# Edit backend/.env with your database credentials and JWT secret
```

#### Step 3 — Setup and Start the Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Seed the database (first time only)
node seed_db.js
node seed_users.js

# Start the backend server
npm run dev
# Backend runs on http://localhost:5000
```

#### Step 4 — Setup and Start the Python AI Engine

You can run the Python AI engine in a separate terminal:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Linux/macOS

# Install Python dependencies
pip install -r python_engine/requirements_detection.txt

# Start the FastAPI detection engine
cd python_engine
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# AI Engine runs on http://localhost:8000
```

> 💡 **Tip (Run both concurrently):** Once the Python environment is set up and activated, you can run both backend servers simultaneously from the `backend/` directory using:
> ```bash
> npm run dev:full
> ```


#### Step 5 — Setup and Start the Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# Frontend runs on http://localhost:5173
```

---

### Option 3: Quick Start (Windows Batch Script)

```bash
# Run the provided batch script from the project root
start.bat
```

---

### Default Login Credentials *(after seeding)*

| Role | Email | Password |
|---|---|---|
| Admin | admin@cams.com | admin123 |
| Store Manager | manager@cams.com | manager123 |
| Marketing Manager | marketing@cams.com | marketing123 |
| Retail Analyst | analyst@cams.com | analyst123 |

> ⚠️ **Note:** Change all default credentials before deploying to production.

---

## 🎬 Project Demonstration

### AI Detection Pipeline

```
CCTV Video Feed (MP4 / Live RTSP)
        |
        v
 YOLOv8 Detection
 (Persons, Objects per frame)
        |
        v
 ByteTrack Tracking
 (Unique ID assigned per person)
        |
        v
 Behavior Engine
 (Zone entry/exit, dwell time, path)
        |
        +-----> Heatmap Engine ---------> Store Heatmap Page
        +-----> Attractiveness Engine --> Product Attractiveness Page
        +-----> Recommendation Engine --> AI Recommendations Page
        +-----> WebSocket Stream -------> Live Cameras Page
```

### Portal Walkthroughs

**🔐 Admin Portal** — Full platform control: register users, assign roles, monitor camera devices, manage store zones, and review AI infrastructure health.

**🏪 Store Manager Portal** — Live Cameras page streams real-time CCTV footage with AI-powered person detection overlays. Each camera shows live bounding boxes, visitor count, and zone density.

**📣 Marketing Manager Portal** — Campaign Performance page shows real-time engagement metrics, consumer attention data correlated with promotional placements, and AI-driven recommendations.

**📊 Retail Analyst Portal** — Consumer Behavior Intelligence page offers the most detailed analytics: traffic heatmaps, dwell time breakdowns, customer journey paths, segmentation clusters, and AI-generated behavioral insights.

---

## 📈 Current Implementation Status

| Module | Status | Notes |
|---|---|---|
| **Authentication & RBAC** | ✅ Complete | JWT login, role-based routing, password hashing |
| **Admin Portal** | ✅ Complete | All 13 pages fully implemented |
| **Store Manager Portal** | ✅ Complete | All 10 pages fully implemented |
| **Marketing Manager Portal** | ✅ Complete | All 15 pages fully implemented |
| **Retail Analyst Portal** | ✅ Complete | All 15 pages fully implemented |
| **Node.js REST API** | ✅ Complete | All analytics and auth endpoints |
| **PostgreSQL Database** | ✅ Complete | Schema, seeds, and ORM models |
| **Python FastAPI Engine** | ✅ Complete | Detection, heatmap, behavior, attractiveness, recommendation engines |
| **YOLOv8 Detection** | ✅ Complete | YOLOv8n / YOLOv8s / YOLOv8m models supported |
| **ByteTrack Tracking** | ✅ Complete | Multi-object tracking across frames |
| **WebSocket Streaming** | ✅ Complete | Real-time detection events to frontend |
| **Live Camera Feed (Frontend)** | ✅ Complete | Per-camera detection overlay and stats |
| **Store Heatmap** | ✅ Complete | Zone-level density heatmap rendering |
| **Docker Compose** | ✅ Complete | Full containerized deployment |
| **Redis Caching** | 🔄 In Progress | Cache layer for analytics queries |
| **Mobile Responsive UI** | 🔄 In Progress | Responsive breakpoints for tablet/mobile |
| **Export (CSV / PDF)** | 🔄 In Progress | Report download functionality |
| **Live CCTV Integration** | 🔄 In Progress | RTSP stream support (currently uses MP4 files) |
| **Email Notifications** | 📋 Planned | Alert emails for critical events |
| **Multi-Store Support** | 📋 Planned | Cross-store comparison dashboards |

### Legend
- ✅ **Complete** — Fully implemented and functional
- 🔄 **In Progress** — Partially implemented or under active development
- 📋 **Planned** — Scoped for future sprints

---

## 📁 Project Structure

```
Consumer_Attention_Mapping_System/
├── backend/                        # Node.js + Express REST API
│   ├── config/                     # Database and app configuration
│   ├── controllers/                # Route controllers
│   ├── middleware/                 # Auth and error handling middleware
│   ├── models/                     # Sequelize ORM models
│   ├── routes/                     # Express route definitions
│   ├── python_engine/              # Python FastAPI AI microservice
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── detection_engine.py     # YOLOv8 + ByteTrack engine
│   │   ├── heatmap_engine.py       # Heatmap data aggregation
│   │   ├── behavior_engine.py      # Consumer behavior analytics
│   │   ├── attractiveness_engine.py# Product attractiveness scoring
│   │   └── recommendation_engine.py# AI recommendations
│   └── server.js                   # Express app entry point
├── frontend/                       # React 18 + Vite frontend
│   └── src/
│       └── pages/
│           ├── admin/              # Admin portal pages (13 pages)
│           ├── store_manager/      # Store Manager portal (10 pages)
│           ├── marketing_manager/  # Marketing Manager portal (15 pages)
│           ├── analyst/            # Retail Analyst portal (15 pages)
│           └── LoginPage.jsx       # Authentication page
├── database/                       # SQL schema and migrations
├── docker-compose.yml              # Multi-service Docker setup
├── start.bat                       # Windows quick-start script
└── README.md                       # This file
```

---

## 📄 License

This project is intended for educational and research purposes.

---

<div align="center">

**Built with React · Node.js · Python · YOLOv8 · FastAPI · PostgreSQL**

</div>
