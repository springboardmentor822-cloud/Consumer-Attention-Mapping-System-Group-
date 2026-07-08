# Consumer Attention Mapping System - Project Summary

This document provides a comprehensive overview of the technical stack and the complete folder structure of the Consumer Attention Mapping System project.

## Technical Stack

### **Backend**
The backend is built as a robust, production-ready REST API using clean architecture principles.
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- **Database:** PostgreSQL
- **ORM & Migrations:** SQLAlchemy 2.0 & Alembic
- **Authentication:** JWT (JSON Web Tokens) with Passlib & bcrypt
- **Video Processing:** OpenCV (`opencv-python`) for stream verification
- **Data Validation:** Pydantic V2
- **Environment Management:** `python-dotenv` & `pydantic-settings`
- **Server:** Uvicorn

### **Frontend**
The frontend is a modern Single Page Application (SPA) with role-based access control and an enterprise-grade UI design.
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with `clsx` and `tailwind-merge`)
- **Routing:** React Router v6 (`react-router-dom`)
- **Form Management:** React Hook Form & Zod (validation)
- **HTTP Client:** Axios
- **Icons:** Lucide React

---

## Project Structure

```text
Consumer Attention Mapping System/
├── backend/                     # FastAPI Backend Application
│   ├── alembic.ini              # Alembic database migration configuration
│   └── app/
│       ├── api/                 # API Route Handlers (Controllers)
│       │   ├── auth.py          # Login and registration routes
│       │   ├── cameras.py       # Camera management endpoints
│       │   ├── shelves.py       # Shelf configuration endpoints
│       │   ├── stores.py        # Store management endpoints
│       │   └── users.py         # User retrieval endpoints
│       ├── core/                # Core Configuration and Security
│       │   ├── config.py        # Environment variables and app settings
│       │   ├── database.py      # SQLAlchemy engine and session makers
│       │   └── security.py      # Password hashing and JWT utilities
│       ├── migrations/          # Alembic migration scripts
│       ├── models/              # SQLAlchemy Database Models
│       │   ├── camera.py
│       │   ├── role.py
│       │   ├── shelf.py
│       │   ├── store.py
│       │   └── user.py
│       ├── schemas/             # Pydantic Schemas (Request/Response validation)
│       │   ├── auth.py
│       │   ├── camera.py
│       │   ├── shelf.py
│       │   ├── store.py
│       │   └── user.py
│       ├── services/            # Business Logic Layer
│       │   ├── auth_service.py
│       │   ├── camera_service.py
│       │   ├── shelf_service.py
│       │   ├── store_service.py
│       │   └── video_service.py # OpenCV video stream validation
│       ├── utils/               # Helper Utilities
│       └── main.py              # FastAPI application entry point
│
├── frontend/                    # React + Vite Frontend Application
│   ├── index.html               # Main HTML template
│   ├── package.json             # NPM dependencies and scripts
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite bundler configuration
│   └── src/
│       ├── App.tsx              # Main application routing
│       ├── main.tsx             # React DOM entry point
│       ├── index.css            # Global CSS styles
│       ├── assets/              # Static assets (images, fonts)
│       ├── components/          # Reusable React Components
│       │   ├── common/          # Shared components (EmptyState, PageHeader, Dialogs)
│       │   ├── layout/          # Layout wrappers (Sidebar, Topbar, AppLayout)
│       │   └── ui/              # Base UI elements (Buttons, Cards, Inputs, Tables)
│       ├── contexts/            # React Context Providers
│       │   └── AuthContext.tsx  # Authentication state management
│       ├── hooks/               # Custom React Hooks
│       │   └── useTheme.ts      # Dark/Light mode toggle
│       ├── pages/               # Application Pages (Views)
│       │   ├── Cameras/
│       │   ├── Dashboard/
│       │   ├── Login/
│       │   ├── Profile/
│       │   ├── Register/
│       │   ├── Shelves/
│       │   └── Stores/
│       ├── routes/              # Routing Components
│       │   └── ProtectedRoute.tsx # Route guard for authenticated users
│       ├── services/            # API Communication Layer (Axios calls)
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   ├── camera.ts
│       │   ├── shelf.ts
│       │   └── store.ts
│       ├── types/               # TypeScript Interface Definitions
│       └── utils/               # Frontend Utility Functions
│           ├── cn.ts            # Tailwind class merging
│           ├── json.ts          # Safe JSON parsing
│           └── storage.ts       # LocalStorage wrappers
│
├── postman/                     # API Testing Collection
│   └── consumer_attention_mapping_system.postman_collection.json
│
├── .env                         # Environment variables (Database URL, JWT keys)
├── requirements.txt             # Python dependencies
└── README.md                    # Project overview and setup instructions
```
