# Consumer Attention Mapping System

Week 1 backend foundation for the Infosys Springboard Virtual Internship project. The platform prepares a production-ready FastAPI backend for future retail analytics features without implementing any AI models yet.

## Project Overview

The system turns normal CCTV infrastructure into a backend foundation for retail attention analytics. Week 1 establishes the API, database, authentication, role-based access control, and stream verification scaffolding needed for later AI and analytics work.

## Problem Statement

Retail stores already have video infrastructure, but they lack software to capture actionable business signals such as shelf attention, product engagement, movement patterns, and store traffic. This project creates the backend base that will later support those capabilities.

## Architecture

The code follows Clean Architecture principles:

API Layer -> Service Layer -> Database Layer -> PostgreSQL

Business rules stay inside services. Route handlers only validate requests, enforce authorization, and forward work to services.

## Folder Structure

```text
backend/
  app/
    api/
    core/
    models/
    schemas/
    services/
    utils/
    migrations/
    main.py
requirements.txt
.env.example
postman/consumer_attention_mapping_system.postman_collection.json
```

## Installation

1. Create and activate a Python 3.12 virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update the values for your environment.

## Running Locally

From the repository root:

```bash
uvicorn backend.app.main:app --reload
```

Swagger UI will be available automatically at `/docs`.

## Database Migration

Alembic is configured under `backend/alembic.ini`.

```bash
cd backend
alembic upgrade head
```

This creates the initial schema and seeds the default roles:

- SuperAdmin
- StoreManager
- Analyst

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET_KEY`: Secret used to sign access tokens.
- `JWT_ALGORITHM`: JWT algorithm, defaults to `HS256`.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token lifetime, defaults to `60`.
- `DEFAULT_VIDEO_SOURCE`: Default OpenCV source, `0` for webcam.

## Swagger URL

- Swagger UI: `/docs`
- ReDoc: `/redoc`

## API Documentation

The backend exposes documented endpoints for:

- Authentication
- Current user lookup
- Store management
- Shelf management
- Camera management

All protected endpoints require a Bearer token. Login and register are the only public endpoints.

## Video Verification

The `backend/app/services/video_service.py` module verifies that the backend can read webcam or MP4 video streams, resize frames, overlay FPS, frame number, and timestamp, and exit on `Q`.

## Postman Collection

A complete Postman collection is available at `postman/consumer_attention_mapping_system.postman_collection.json`.
