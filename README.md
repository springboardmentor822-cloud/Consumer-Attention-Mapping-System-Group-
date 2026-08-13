# 🛒 AI-Powered Consumer Attention Mapping System

> **A real-time Computer Vision & Behavioral Intelligence platform that transforms physical retail CCTV feeds into actionable merchandising analytics, foot traffic heatmaps, and AI product attractiveness scores.**

[![Repository Link](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/springboardmentor822-cloud/Consumer-Attention-Mapping-System-Group-/tree/chandana-s-consumer-attention-mapping-system)
[![Project Demo Video](https://img.shields.io/badge/Google%20Drive-Watch%20Project%20Demo%20Video-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1IAAbHM6YBYtJJiLKWgiLkWwVY8TLMVt1/view?usp=sharing)
[![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![OpenCV & YOLOv8](https://img.shields.io/badge/AI%20Vision-OpenCV%20%7C%20YOLOv8-FF6F00?style=for-the-badge&logo=opencv)](https://opencv.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite%20Auto--Fallback-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

> 📹 **Project Demo Video:** [Click here to watch full video demonstration on Google Drive](https://drive.google.com/file/d/1IAAbHM6YBYtJJiLKWgiLkWwVY8TLMVt1/view?usp=sharing)

---

## 📌 Table of Contents
- [✨ What is Available in the System](#-what-is-available-in-the-system)
- [🚀 How to Open and Run the Project](#-how-to-open-and-run-the-project)
- [🔑 Default Login Credentials](#-default-login-credentials)
- [📹 How to Upload & Analyze Real MP4 Retail Videos](#-how-to-upload--analyze-real-mp4-retail-videos)
- [🖥️ User Roles & Dashboard Tour](#️-user-roles--dashboard-tour)
- [🧮 AI Formulas & Machine Learning Models](#-ai-formulas--machine-learning-models)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Folder Structure](#-project-folder-structure)
- [🧪 Running Verification & Test Suites](#-running-verification--test-suites)
- [🤝 Contributing & License](#-contributing--license)

---

## ✨ What is Available in the System

The **Consumer Attention Mapping System** provides an end-to-end retail vision pipeline with the following ready-to-use features:

1. **🔐 Authentication & Role-Based Access Control (RBAC):**
   - User Registration with auto-seeded Role Dropdown (`Administrator`, `Store Manager`, `Retail Analyst`, `Marketing Manager`).
   - Secure JWT token authentication with bcrypt password hashing.

2. **🎥 Live AI Computer Vision Stream & Video Upload:**
   - Real-time MJPEG camera stream with OpenCV HOG / YOLOv8 person detection.
   - **Upload Real Retail Videos:** Upload any `.mp4`, `.avi`, or `.mov` store recording (e.g. DMart store clip) to process real shoppers with bounding boxes, gaze direction vectors, and dwell times.

3. **🗺️ 2D Homography Perspective Heatmaps:**
   - Maps 3D camera pixel coordinates into flat 2D store floorplan coordinates $(X_{map}, Y_{map})$.
   - Generates 4 Gaussian KDE heatmap layers: *Store Traffic*, *Zone Activity*, *Product Gaze Focus*, and *Shelf Hotspots*.

4. **🧠 ML Shopper Behavior Segmentation (K-Means):**
   - Automatically clusters shoppers into 5 personas: **Explorers**, **Quick Buyers**, **Comparison Shoppers**, **Impulse Buyers**, and **Brand Loyalists**.

5. **⭐ Product Attractiveness Scoring Engine:**
   - Evaluates product SKUs using a 5-metric weighted score ($0 - 100$) based on Attention, Interaction, Pickup Rate, Conversion Rate, and Repeat Engagement.

6. **💡 Diagnostic Merchandising Recommendations:**
   - Automated rule engine offering recommendations (e.g., relocating top-performing bottom-shelf products to eye level, pricing reviews for high attention / low pickup SKUs).

7. **📊 Custom Role Dashboards:**
   - Tailored interactive views for Store Managers, Retail Analysts, Marketing Managers, and Administrators.

8. **📥 Audit Reports & CSV Exports:**
   - Export downloadable CSV datasets and formatted audit reports for attractiveness and behavior analytics.

---

## 🚀 How to Open and Run the Project

Follow these simple steps to launch the backend API and frontend user interface on your local machine:

### 1️⃣ Prerequisites
Make sure you have the following installed:
- **Python:** Version 3.11 or higher ([Download Python](https://www.python.org/downloads/))
- **Node.js:** Version 18 or higher ([Download Node.js](https://nodejs.org/))
- **Git:** ([Download Git](https://git-scm.com/))

---

### 2️⃣ Clone the Repository
Open PowerShell or your command terminal:
```bash
git clone https://github.com/your-username/Consumer-Attention-Mapping-System-Group-.git
cd Consumer-Attention-Mapping-System-Group-
```

---

### 3️⃣ Step 1: Launch the Backend (FastAPI Server)
Open terminal window #1:
```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: The backend automatically checks if PostgreSQL is running. If offline, it seamlessly falls back to SQLite (`local_dev.db`), creates all database tables, and seeds the default admin user and roles automatically.*

The API documentation (FastAPI Swagger UI) will be live at: **`http://127.0.0.1:8000/docs`**

---

### 4️⃣ Step 2: Launch the Frontend (React Application)
Open terminal window #2:
```bash
# Navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Start Vite dev server
npm run dev
```

The Web Application will open automatically in your browser at: **`http://localhost:5173/`**

---

## 🔑 Default Login Credentials

You can log into the system immediately using the default credentials or register a new user:

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access to users, roles, and stores |
| **Store Manager** | *(Register via UI or log in)* | *(Your password)* | Camera feeds, real MP4 uploads, floorplan |
| **Retail Analyst** | *(Register via UI or log in)* | *(Your password)* | Dwell time, traffic flow, shopper clustering |
| **Marketing Manager** | *(Register via UI or log in)* | *(Your password)* | Product visibility, attractiveness, campaigns |

---

## 📹 How to Upload & Analyze Real MP4 Retail Videos

Want to analyze your own retail store footage (e.g. DMart CCTV recording)?

1. Log into the app as **Store Manager** or **Administrator**.
2. Go to the **Store Operations Overview** tab.
3. On the **AI Vision Camera Stream** panel, click the **`Upload Real Video (MP4)`** button.
4. Select your `.mp4`, `.avi`, or `.mov` video file from your computer.
5. The backend OpenCV Computer Vision Engine will process the video, detect real shoppers, draw bounding boxes & gaze vectors, and stream the annotated video live back to your screen!

---

## 🖥️ User Roles & Dashboard Tour

### 👔 1. Administrator Dashboard (`/admin`)
- Manage registered users and user roles.
- Monitor active database mode (PostgreSQL / SQLite fallback).
- Inspect system health metrics and camera connection statuses.

### 🏬 2. Store Manager Dashboard (`/store-manager`)
- View real-time store foot traffic (IN / OUT counters & live occupancy).
- Access interactive 2D canvas floorplan layout mapping cameras to shelf bays.
- Provision virtual store layouts and upload custom retail CCTV video streams.

### 📈 3. Retail Analyst Dashboard (`/retail-analyst`)
- **Combined Dwell & Traffic Flow Analysis Page:** Dwell time hourly trends, entrance/exit ratios, and zone flow distribution.
- **Shopper Behavior Segmentation:** K-Means clustering breakdown (*Explorers*, *Quick Buyers*, *Comparison Shoppers*, *Impulse Buyers*).
- Downloadable PDF / CSV consumer insight reports.

### 🎯 4. Marketing Manager Dashboard (`/marketing-manager`)
- **Combined Product Visibility & Attractiveness Page:** Radar metrics, visibility ranking, and attention vs. conversion scatter plots.
- **Combined Attention & Traffic Insights Page:** Impression timelines and conversion funnel charts.
- AI Promotional suggestions for endcap optimization and campaign extension.

---

## 🧮 AI Formulas & Machine Learning Models

### 1. Multi-Metric Product Attractiveness Score
$$\text{Product Attractiveness Score} = 0.35(A) + 0.25(I) + 0.20(P) + 0.15(C) + 0.05(R)$$
- $A$: Normalized Attention Duration ($35\%$)
- $I$: Physical Interaction Count ($25\%$)
- $P$: Pickup Rate ($20\%$)
- $C$: Conversion Rate ($15\%$)
- $R$: Repeat Engagement ($5\%$)

### 2. 2D Homography Perspective Transformation Matrix
$$\begin{bmatrix} x' \\ y' \\ w' \end{bmatrix} = H \begin{bmatrix} x_{cam} \\ y_{cam} \\ 1 \end{bmatrix}, \quad X_{map} = \frac{x'}{w'}, \quad Y_{map} = \frac{y'}{w'}$$

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Custom SVG Chart Components
- **Backend API:** Python 3.11+, FastAPI, Uvicorn, Pydantic, SQLAlchemy ORM
- **Computer Vision:** OpenCV, HOG Person Detector, YOLOv8 (Ultralytics), MediaPipe
- **Machine Learning:** Scikit-learn (K-Means Clustering), NumPy, SciPy (Gaussian KDE)
- **Databases:** PostgreSQL, SQLite (Automatic fallback), Redis / MockRedis stream cache

---

## 📁 Project Folder Structure

```text
Consumer-Attention-Mapping-System-Group-/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI routers (auth, stores, video, reports, behavior)
│   │   ├── core/            # Database config, security, JWT, Redis
│   │   ├── models/          # SQLAlchemy DB models (User, Role, Store, Camera, Shelf)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # AI engines (attractiveness, heatmap, segmentation, optimization)
│   │   └── utils/           # OpenCV video stream processor & frame generator
│   ├── tests/               # Backend unit test suite (test_attractiveness, test_homography, etc.)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (AICameraStream, HeatmapCanvas, Charts)
│   │   ├── contexts/        # Auth Context & State Management
│   │   ├── lib/             # Axios API client
│   │   └── pages/           # Admin, StoreManager, RetailAnalyst, MarketingManager dashboards
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## 🧪 Running Verification & Test Suites

### Backend Unit Tests
To verify all AI mathematical formulas, homography matrices, and K-Means segmentation algorithms:
```bash
cd backend
python -c "
import unittest
loader = unittest.TestLoader()
suite = loader.discover('tests')
runner = unittest.TextTestRunner()
res = runner.run(suite)
assert res.wasSuccessful()
"
```
*Expected Output: `Ran 4 tests in ~4s - OK (100% Passed)`.*

### Frontend Production Compilation
To verify frontend TypeScript type checking and production build:
```bash
cd frontend
npm.cmd run build
```
*Expected Output: `built in ~2.5s with 0 errors`.*

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! 

This project is open-source and available under the **MIT License**.
