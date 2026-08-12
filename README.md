# AI-Based Consumer Attention Mapping System

## 📌 Project Overview

The AI-Based Consumer Attention Mapping System is an intelligent retail analytics platform designed to understand and analyze consumer attention, behaviour, movement, engagement, and interaction in retail environments using Artificial Intelligence and Computer Vision.

The system processes camera and video data and converts customer activity into meaningful analytics and actionable retail insights.

## 🎯 Objectives

- Detect customers using AI-based computer vision.
- Track customers throughout the monitored environment.
- Analyze customer behaviour and movement.
- Calculate customer dwell time in different areas.
- Analyze consumer attention and engagement.
- Monitor store, shelf, camera, and zone activity.
- Visualize analytics through interactive dashboards.
- Generate actionable retail recommendations.
- Support data-driven retail decision making.

## 🚀 Key Features

### 👤 AI-Based Customer Detection

The system uses YOLOv8 for detecting people from camera and video input.

It provides information such as:

- Current customers
- Total customers
- Customer tracking IDs
- Customer presence
- Customer movement

### 🎯 Customer Tracking

Customer tracking maintains unique identities while customers move through the monitored environment.

This enables the system to analyze customer movement and behaviour across video frames.

### ⏱️ Dwell Time Analytics

The system analyzes how much time customers spend in different areas.

Dwell time analytics helps identify:

- High-interest areas
- Frequently visited zones
- Customer engagement duration
- Low-engagement areas
- Potentially important product zones

### 🧠 Consumer Attention Analysis

The platform provides attention-related analytics to understand customer engagement with the retail environment.

The system can be used to analyze:

- Attention levels
- Customer engagement
- Product interaction
- High-interest areas
- Customer attention patterns

### 📊 Customer Behaviour Analysis

The Customer Behaviour Dashboard provides an organized view of customer activity and behavioural patterns.

This helps retailers understand how customers move through and interact with the retail environment.

### 🏪 Store, Shelf and Zone Analysis

The system supports analysis of store and shelf zones to understand customer activity around specific areas.

This can help retailers identify areas receiving higher customer attention.

### 📈 Interactive Analytics Dashboard

The project provides interactive dashboards containing important retail analytics such as:

- Total Users
- Stores
- Products
- Cameras
- Current Customers
- Total Customers
- Attention Metrics
- Customer Behaviour
- Analytics Charts
- Recommendation Insights

### 🤖 Recommendation Engine

A dedicated Recommendation Engine converts customer and store analytics into actionable recommendations.

The recommendation system can help identify:

- Customer engagement opportunities
- High-performing areas
- Product placement opportunities
- Attention-based insights
- Store optimization opportunities

### 💡 Recommendations Dashboard

The Recommendations Dashboard presents generated recommendations in an organized and user-friendly interface.

### 📄 Report Generation

The system supports analytical report generation to summarize important customer and store insights.

## 🏗️ System Workflow

```text
Camera / Video Input
        ↓
YOLOv8 Person Detection
        ↓
Customer Tracking
        ↓
Customer Behaviour Analysis
        ↓
Dwell Time Analysis
        ↓
Attention Analysis
        ↓
Store / Shelf / Zone Analytics
        ↓
FastAPI Backend
        ↓
PostgreSQL Database
        ↓
React Dashboard
        ↓
Recommendation Engine
        ↓
Actionable Retail Insights

## 🧩 Main Modules

### Backend

- Authentication and Authorization
- User Management
- Store Management
- Shelf Management
- Camera Management
- AI Detection
- Customer Tracking
- Behaviour Analytics
- Dwell Time Analytics
- Attention Analytics
- Recommendation Engine
- Analytics APIs
- Report Generation

### Frontend

- Login
- Dashboard
- Store Management
- Shelf Management
- Camera Management
- Customer Behaviour
- Customer Insights
- Analytics
- Recommendation Engine
- Recommendations
- Reports
- Live Camera Monitoring

## 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- React Router

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### AI and Computer Vision

- YOLOv8
- Ultralytics
- OpenCV
- ByteTrack
- Object Tracking

### Database

- PostgreSQL

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Python Virtual Environment

## 📊 Analytics and Insights

The system combines AI-generated information and behavioural analytics to provide meaningful retail insights.

The platform can help retailers understand:

- How many customers are currently present
- Total customers detected
- Customer movement patterns
- Customer dwell time
- High-attention areas
- Customer engagement
- Store and shelf activity
- Actionable recommendations

## 🤖 AI Analytics Pipeline

```text
Video / Camera Feed
        ↓
YOLOv8 Detection
        ↓
ByteTrack Tracking
        ↓
Customer Identification
        ↓
Behaviour Processing
        ↓
Dwell Time Calculation
        ↓
Attention Analysis
        ↓
Analytics Processing
        ↓
Dashboard Visualization
        ↓
Recommendation Generation

## 🎥 Project Demo

A complete screen recording demonstrates the overall workflow of the AI-Based Consumer Attention Mapping System, including the dashboard, customer analytics, behaviour analysis, attention analytics, store and shelf analytics, recommendation engine, recommendations dashboard, reports, and overall system navigation.

**Demo Video:** `Demo Video.mp4`

## 🌟 Benefits

The system can help retailers:

- Understand customer behaviour
- Monitor customer movement
- Identify high-interest areas
- Analyze customer dwell time
- Measure customer engagement
- Improve product placement
- Optimize shelf positioning
- Generate data-driven recommendations
- Support better retail decision making

## 🔮 Future Enhancements

Potential future improvements include:

- Real-time multi-camera analytics
- Advanced customer journey mapping
- Improved product recognition
- Advanced heatmap generation
- Predictive customer behaviour analysis
- Personalized product recommendations
- Cloud deployment
- Real-time notifications
- Mobile application support
- Advanced business intelligence analytics

## 👥 Project Development

This project was developed as a collaborative group project involving:

- Artificial Intelligence
- Machine Learning
- Computer Vision
- Backend Development
- Frontend Development
- Database Integration
- Data Analytics
- Recommendation Systems
- UI/UX Design
- Git and GitHub Collaboration

## 📌 Current Project Status

- ✅ AI-based person detection
- ✅ Customer tracking
- ✅ Customer behaviour analytics
- ✅ Dwell time analytics
- ✅ Attention analytics
- ✅ Store and shelf analytics
- ✅ Interactive dashboards
- ✅ Recommendation Engine
- ✅ Recommendations Dashboard
- ✅ Report generation
- ✅ FastAPI backend
- ✅ React frontend
- ✅ PostgreSQL integration

## 📜 License

This project is licensed under the MIT License.
