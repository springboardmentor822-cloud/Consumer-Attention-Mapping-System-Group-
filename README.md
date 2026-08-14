# Consumer Attention Mapping System (CAMS)

An enterprise-grade, AI-powered Computer Vision and Retail Analytics platform that transforms store video feeds into actionable consumer attention, spatial dwell times, shelf performance, product engagement, and operational alerts.

---

## 📌 Project Overview & System Architecture

The **Consumer Attention Mapping System (CAMS)** equips retail executives, store managers, retail analysts, and marketing managers with real-time visual spatial intelligence to optimize store layouts, product shelf placement, and promotional effectiveness.

```
Surveillance / Video Streams
             ↓
    Video Ingestion Engine
             ↓
 YOLOv8 Detection + ByteTrack
             ↓
 Dwell & Attention Calculation
             ↓
  Spatial & Milestone 3 Analytics
             ↓
    FastAPI REST Backend
             ↓
 React Multi-Role UI Dashboards & Alert Engine
```

---

## 👥 Four Isolated Role Dashboards

CAMS enforces strict Role-Based Access Control (RBAC) across both the React frontend and FastAPI backend:

1. **Administrator (`administrator`)**: Platform control center, User management (view/create/update/disable users, assign roles), Camera Hardware management, and System Health monitoring.
2. **Store Manager (`store_manager`)**: Real-time store footfall traffic, zone density, customer count, shelf dwell performance, purchase conversion, and store-level operational insights.
3. **Retail Analyst (`retail_analyst`)**: Shopper segmentation (Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer, Brand Loyal), journey transitions, store/shelf/product heatmaps, product attractiveness rankings, and AI placement recommendations.
4. **Marketing Manager (`marketing_manager`)**: Campaign tracking, promotional reach, product visibility scores, engagement lift, sales conversion, and marketing ROI.

---

## 🛠 Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts, Axios.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic, ReportLab (PDF), OpenPyXL / Pandas (Excel).
- **Computer Vision & AI**: YOLOv8 (Ultralytics), ByteTrack, OpenCV.
- **Database & Cache**: PostgreSQL / TimeScaleDB, Redis.
- **Containerization & CI/CD**: Docker, Docker Compose, Nginx, GitHub Actions.

---

## 🚀 Quick Start & Local Execution

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python reinit_db.py
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. Swagger API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend app will run at `http://localhost:5173`.

---

## 🐳 Docker Containerization

To build and run the entire CAMS stack (Database, Redis, FastAPI Backend, React Frontend):

```bash
docker compose up --build
```

- **Frontend**: `http://localhost`
- **Backend API**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`

---

## 🧪 Automated Testing

Run the comprehensive automated test suites:

```bash
# 1. Milestone 3 Analytics & Recommendation Engine Test
python backend/test_m3_pipeline.py

# 2. RBAC & Security Isolation Test
python backend/test_rbac_security.py

# 3. Complete End-to-End Pipeline Test
python backend/test_e2e_pipeline.py
```

---

## 📄 Comprehensive Documentation

Detailed documentation files are available in the [`docs/`](file:///c:/Users/arunk/OneDrive/Downloads/consumer_attention_mapping/docs/) directory:
- [API Documentation](file:///c:/Users/arunk/OneDrive/Downloads/consumer_attention_mapping/docs/API_DOCUMENTATION.md)
- [Database Documentation](file:///c:/Users/arunk/OneDrive/Downloads/consumer_attention_mapping/docs/DATABASE_DOCUMENTATION.md)
- [Deployment Guide](file:///c:/Users/arunk/OneDrive/Downloads/consumer_attention_mapping/docs/DEPLOYMENT_GUIDE.md)
- [User Manual](file:///c:/Users/arunk/OneDrive/Downloads/consumer_attention_mapping/docs/USER_MANUAL.md)
