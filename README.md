# AI Consumer Attention Mapping & Retail Intelligence Platform

An operational enterprise retail intelligence platform that ingests shopper trajectories and interactions, computes kinematic metrics via Kalman filtering, generates 2D planar homography & Gaussian KDE spatial heatmaps, classifies shopper sessions into 5 behavioral profiles, scores product attractiveness using category-normalized multi-factor weighting, generates automated merchandising recommendations, and exposes role-tailored enterprise BI dashboards.

---

## 📹 Platform Demonstration Video

https://github.com/user-attachments/assets/demo_recording (View locally or on GitHub repository):

<video src="./media/demo_recording.mp4" controls width="100%" style="max-width: 100%; border-radius: 12px; border: 1px solid #334155;">
  Your browser does not support embedded videos. You can <a href="./media/demo_recording.mp4">download the demo video file directly</a>.
</video>

> 🎬 **Demonstration Preview**: Watch the complete operational platform video walkthrough in [`./media/demo_recording.mp4`](file:///c:/Users/nande/Desktop/Parvath%20infosys/media/demo_recording.mp4).

---


## 🚀 Target Architecture & Features

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts + HTML5 Canvas Spatial Engine + Zustand state management.
- **Backend API**: FastAPI + Pydantic + SQLAlchemy + SQLite / PostgreSQL.
- **Analytics & CV Engine**: NumPy, SciPy, OpenCV (`cv2`), and scikit-learn.
  - **Trajectory Engine**: Constant velocity 2D Kalman filter, ray-casting point-in-polygon zone dwell calculation, and velocity tracking.
  - **Shopper Segmentation**: 5 behavioral profiles (*Explorers*, *Quick Buyers*, *Comparison Shoppers*, *Impulse Buyers*, *Brand Loyal Customers*).
  - **Planogram Homography & Spatial Heatmap Engine**: `cv2.findHomography` transformation & Gaussian KDE matrix evaluation for 4 distinct layers (*Store Traffic*, *Zone Activity Density*, *Product Gaze Focus*, *Shelf Hotspots*).
  - **Product Attractiveness Engine**: Category min-max metric normalization and weighted formula:
    $$\text{Score} = 0.35 \times A + 0.25 \times I + 0.20 \times P + 0.15 \times C + 0.05 \times R$$
  - **Merchandising Recommendation Engine**: Rule-based decision matrix for packaging, pricing, and planogram layout optimizations.
- **4 Role-Based Dashboards**:
  1. **Store Manager Dashboard**: KPIs, Store Traffic, Zone Occupancy, Shelf Performance, Product Interactions, Conversion Funnel, Live RTSP Camera Grid, Recent Alerts, High-Priority Actions.
  2. **Retail Analyst Dashboard**: Dwell & Attention analysis, 2D Interactive Floor Plan & Heatmap Engine, Shopper Segment Distribution, Behavior Scatter Bubble Chart, Filterable Attractiveness Table.
  3. **Marketing Manager Dashboard**: Campaign performance comparison, Promotion Sales-Lift Waterfall, Visibility Radar, Attractiveness Radar, High-Impact Priority Matrix.
  4. **Administrator Dashboard**: Platform Uptime, Active Users by Role, Camera Status & Grid, CPU/Memory/GPU/Network Telemetry, API Latency & Endpoint Stats, Security Audit Logs.

---

## 💻 Quick Start & Running Locally

### 1. Backend Setup & Seeding

```bash
cd backend
pip install -r requirements.txt
python scripts/seed.py
uvicorn app.main:app --port 8000 --reload
```

### 2. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Visit the dashboard in your browser at `http://localhost:3000`.

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```
"# Parvathrajr-consumer-attention-mapping-system" 
