# Consumer Attention Mapping System — Backend

FastAPI backend: auth, store/shelf management, and OpenCV stream verification.

## Local Setup

1. **Start Postgres:**
   ```
   docker compose up -d
   ```

2. **Create a virtual environment and install dependencies:**
   ```
   python -m venv .venv
   source .venv/bin/activate   # on Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```
   cp .env.example .env
   ```
   Edit `.env` and replace `JWT_SECRET_KEY` with a real random string.

4. **Run the API:**
   ```
   uvicorn app.main:app --reload
   ```
   Visit http://localhost:8000/docs for interactive API docs (Swagger UI).
   On startup, tables are created automatically and default roles
   (SuperAdmin, StoreManager, Analyst) are seeded.

5. **Verify the OpenCV stream script** (needs a sample .mp4, or use `0` for webcam):
   ```
   python -m app.services.video_stream path/to/sample.mp4
   ```

## API Endpoints

- `POST /api/auth/register` — create a user (email, password, role_name)
- `POST /api/auth/login` — OAuth2 form login, returns JWT
- `GET /api/stores` — list stores (requires auth)
- `POST /api/stores` — create store (requires StoreManager or SuperAdmin)
- `GET /api/stores/{store_id}/shelves` — list shelves for a store
- `POST /api/stores/{store_id}/shelves` — create shelf (requires StoreManager or SuperAdmin)

## Project Structure

```
backend/
├── app/
│   ├── api/          # Routers: auth.py, stores.py, shelves.py
│   ├── core/         # config, db session, JWT/security, role-based deps
│   ├── models/       # SQLModel schemas: user.py, store.py
│   ├── services/      # OpenCV frame-processing logic
│   └── main.py       # FastAPI app init
├── docker-compose.yml
├── requirements.txt
└── .env.example
```
