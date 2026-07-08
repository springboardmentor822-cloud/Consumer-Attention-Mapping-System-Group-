import sys
from pathlib import Path

# Ensure 'backend' package is importable regardless of working directory
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# Fix Passlib/Bcrypt version warning compatibility issue
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        class About:
            __version__ = getattr(bcrypt, "__version__", "4.0.0")
        bcrypt.__about__ = About()
except ImportError:
    pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.auth import router as auth_router
from backend.app.api.cameras import router as cameras_router
from backend.app.api.shelves import router as shelves_router
from backend.app.api.stores import router as stores_router
from backend.app.api.users import router as users_router
from backend.app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seeding default Administrator
    from backend.app.core.database import SessionLocal
    from backend.app.models.user import User
    from backend.app.models.role import Role
    from backend.app.core.security import get_password_hash
    from sqlalchemy import select

    db = SessionLocal()
    try:
        admin_email = "admin@consumerattention.com"
        statement = select(User).where(User.email == admin_email)
        admin_user = db.scalar(statement)
        if admin_user is None:
            role_statement = select(Role).where(Role.role_name == "Administrator")
            admin_role = db.scalar(role_statement)
            if admin_role:
                new_admin = User(
                    email=admin_email,
                    hashed_password=get_password_hash("Admin@123"),
                    role_id=admin_role.id,
                    is_active=True
                )
                db.add(new_admin)
                db.commit()
                print("Default Administrator seeded successfully!")
            else:
                print("Error: Administrator role not found. Run migrations/seeding first.")
    except Exception as e:
        print(f"Error seeding default Administrator: {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Week 1 backend foundation for the Consumer Attention Mapping System.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(stores_router, prefix=settings.api_v1_prefix)
app.include_router(shelves_router, prefix=settings.api_v1_prefix)
app.include_router(cameras_router, prefix=settings.api_v1_prefix)
