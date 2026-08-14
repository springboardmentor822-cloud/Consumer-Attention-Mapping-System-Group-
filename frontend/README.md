# Consumer Attention Mapping System (CAMS)
**Infosys Springboard Virtual Internship Project**

An AI-powered retail analytics platform designed to bridge the gap between physical retail stores and digital e-commerce analytics. CAMS uses edge computing and computer vision to translate raw security camera footage into actionable business intelligence.

## 🚀 Key Features
* **AI-Powered Telemetry:** Real-time object detection and tracking using YOLOv8 to monitor shopper movement and dwell times.
* **Interactive Layout Studio:** A dynamic UI allowing store managers to map physical spaces to digital analytics grids.
* **Spatial Analytics:** Live thermal rendering and heatmaps highlighting store traffic, shelf engagement, and product attention.
* **Data Fusion Engine:** An algorithmic backend that blends camera-observed behavior with simulated sales data to calculate a "Product Attractiveness Score."

## 💻 Tech Stack
* **Frontend:** React, Next.js, Tailwind CSS
* **Backend:** Python, FastAPI, SQLAlchemy, SQLite
* **Machine Learning:** Ultralytics YOLOv8, OpenCV, Scikit-learn

## 📂 Project Structure
Following a standard full-stack architecture, the repository is split into two main directories:
* `/frontend`: Contains the Next.js interactive dashboard and UI components.
* `/backend`: Contains the FastAPI server, database models, and YOLOv8 computer vision pipeline.

## 🛠️ How to Run Locally

Because the project is separated, you will need to run the frontend and backend in **two separate terminals**.

### 1. Start the Backend (FastAPI & AI Engine)
Open a terminal and run:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload