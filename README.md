# Consumer Attention Mapping System (CAMS)

An AI-powered computer vision and analytics platform that analyzes consumer attention, dwell time, object interactions, and heatmaps from store surveillance camera feeds.

---

## 📌 Project Overview

The Consumer Attention Mapping System (CAMS) helps retail managers and marketers optimize product placement and store layouts using video analytics and AI-driven spatial mapping.

### Key Features
- **Store & Zone Management**: Create stores and configure spatial zones (shelves, checkout counters, displays).
- **Multi-Camera Management**: Register and configure streams across multiple store locations.
- **AI Analytics & Object Detection**: YOLOv8-powered detection for consumer tracking, dwell time computation, and product interaction.
- **Interactive Heatmaps & Metrics**: Dynamic visual analytics for store traffic, engagement hotspots, and conversion metrics.
- **Role-Based Access Control**: Tailored dashboards for Administrators, Store Managers, and Marketing Strategists.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Icons & Visuals**: Lucide React, Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: Python FastAPI
- **Database**: SQLite / PostgreSQL (SQLAlchemy ORM)
- **AI Engine**: YOLOv8 (Ultralytics) + OpenCV
- **Authentication**: JWT token-based auth

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup Backend

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python reinit_db.py
uvicorn app.main:app --reload
```
Backend API server will run at `http://localhost:8000`.

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend development server will run at `http://localhost:5173`.

---

## 📄 Documentation & Resources

- `AI_Consumer Attention Mapping System.pdf`: Detailed project architectural design & proposal.
- `LICENSE`: Project open source license terms.
