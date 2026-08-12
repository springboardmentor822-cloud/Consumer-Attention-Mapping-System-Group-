# CAMS Frontend (Milestone 1)

React + Vite + Tailwind CSS frontend for the Consumer Attention Mapping System.

## Pages
- Login / Register (JWT auth, role selection)
- Dashboard (store overview)
- Stores (create stores, manage zones)
- Cameras (register cameras per store, check status)

## Setup

```bash
npm install
npm run dev
```

App runs at http://localhost:5173 by default.

Make sure the backend (cams_backend) is running at http://localhost:8000 first —
see `.env` to change the API URL if needed.

## Build for production

```bash
npm run build
```
