# 🏪 Consumer Attention Mapping System

## 📌 Project Overview
AI-powered retail intelligence platform that tracks customer attention, heatmaps, and store analytics.

## 🚀 Features
- ✅ User Authentication (JWT)
- ✅ 3 Roles: Super Admin, Store Manager, Analyst
- ✅ Store & Shelf Management
- ✅ Analytics Charts (Bar, Doughnut, Line)
- ✅ Heatmap Visualization
- ✅ Live Camera Integration
- ✅ Dashboard with Stats

## 🛠️ Tech Stack
- **Backend:** Python, FastAPI, SQLite
- **Frontend:** React, Chart.js
- **Auth:** JWT

## 👥 Test Users
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@store.com | password123 |
| Store Manager | manager@store.com | password123 |
| Analyst | analyst@store.com | password123 |

## 🚀 How to Run
```bash
# Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm run dev