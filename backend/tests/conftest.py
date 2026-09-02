"""
Shared pytest fixtures.

Key design decision: tests must never touch the real Postgres/TimescaleDB
containers. We patch app.core.db.engine and app.core.timescale_db.timescale_engine
to a SQLite engine.

IMPORTANT - why the test engine is SESSION-scoped, not per-test:
24 different modules in this codebase (main.py, attractiveness_score.py,
report_export.py, campaigns.py, heatmaps.py, and 20 others) do
`from app.core.db import engine` directly at their own import time, instead
of using the get_session FastAPI dependency the way auth.py/users.py/
stores.py do. That import statement copies a name binding - it does NOT
create a live reference back to app.core.db.engine. So patching
app.core.db.engine AFTER any of these 24 modules have already been
imported once (e.g. by an earlier test) does nothing for them; they keep
pointing at whatever engine object existed the first time Python imported
them, which is cached in sys.modules for the rest of the process.
The only clean fix without patching all 24 modules individually: patch
app.core.db.engine to a single, persistent test engine ONCE per test
session, BEFORE app.main (and everything it cascades into importing) is
ever imported for the first time. Every test then gets a clean database
by dropping and recreating tables on that SAME engine object between
tests - the engine itself is never swapped out, so all 24 modules' stale
name bindings stay valid.
"""
import os
import sys
import uuid
from pathlib import Path

# Make the `app` package importable regardless of where/how pytest is
# invoked from. `backend/` (this file's parent directory) is where
# `app/` actually lives - without this, `import app.core.db` below fails
# with `ModuleNotFoundError: No module named 'app'` on some setups
# (confirmed on Windows: running `pytest -v` from inside `backend\` does
# NOT put `backend\` on sys.path automatically, since tests/ has no
# __init__.py and becomes pytest's own import root instead of its parent).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

# Must happen before any `from app...` import touches app.core.config,
# since Settings() reads these env vars at import time.
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-do-not-use-in-prod")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("TIMESCALE_DATABASE_URL", "sqlite://")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")


@pytest.fixture(scope="session")
def _session_engine_and_app():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    import app.core.db as db_module
    import app.core.timescale_db as ts_module

    db_module.engine = engine
    ts_module.timescale_engine = engine
    # Real init_timescale_db() calls create_hypertable(), Postgres/Timescale-only.
    ts_module.init_timescale_db = lambda: None

    # First-ever import of app.main happens here, AFTER the patches above,
    # so every one of the 24 modules it cascades into importing binds its
    # own `engine` name to this same test engine at their own import time.
    import app.main as main_module
    main_module.engine = engine
    main_module.init_timescale_db = lambda: None

    import app.models  # noqa: F401 - registers every table on SQLModel.metadata

    # app/services/heatmap_engine.py creates `redis_client = redis.from_url(...)`
    # at its own import time - same name-binding gotcha explained above for
    # `engine`. Patch it here, once, right after the module's first-ever
    # import (triggered by importing app.main above), to a fakeredis
    # instance so heatmap tests don't need a real Redis server running.
    import fakeredis
    import app.services.heatmap_engine as heatmap_engine_module
    heatmap_engine_module.redis_client = fakeredis.FakeRedis()

    return engine, main_module.app


@pytest.fixture()
def test_engine(_session_engine_and_app):
    engine, _ = _session_engine_and_app
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture()
def client(test_engine, _session_engine_and_app):
    _, app = _session_engine_and_app

    def get_session_override():
        with Session(test_engine) as session:
            yield session

    from app.core.db import get_session
    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


def _make_user(session: Session, email: str, password: str, role_name: str):
    from app.models.user import User, Role
    from app.core.security import hash_password

    role = session.exec(
        __import__("sqlmodel").select(Role).where(Role.name == role_name)
    ).first()
    if role is None:
        role = Role(name=role_name)
        session.add(role)
        session.commit()
        session.refresh(role)

    user = User(email=email, hashed_password=hash_password(password), role_id=role.id)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def make_user(test_engine):
    """Create a user directly in the DB (bypassing the API) with a given role.
    Returns (user, plaintext_password) so tests can log in as them."""

    def _create(email: str = None, password: str = "TestPass1!", role_name: str = "Analyst"):
        email = email or f"{uuid.uuid4().hex[:8]}@test.com"
        with Session(test_engine) as session:
            user = _make_user(session, email, password, role_name)
            return user, password

    return _create


@pytest.fixture()
def auth_header(client):
    """Returns a function that logs a user in via the real /login endpoint
    and returns an Authorization header dict."""

    def _login(email: str, password: str) -> dict:
        resp = client.post(
            "/api/auth/login",
            data={"username": email, "password": password},
        )
        assert resp.status_code == 200, resp.text
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _login
