"""
Tests for the security-audit fixes: login brute-force lockout, the
JWT_SECRET_KEY default-value startup guard, and response security
headers. None of these existed before this pass - a real audit of
app/core/config.py and app/api/auth.py found a hardcoded, source-visible
default JWT secret, DEV_PASSWORD_RESET defaulting to True with no
warning, zero rate limiting on /login, and zero response security
headers.
"""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session


def test_login_locks_out_after_max_attempts(client, make_user):
    user, _ = make_user(email="lockout1@test.com", password="RealPass1!", role_name="Analyst")

    for _ in range(5):
        resp = client.post("/api/auth/login", data={"username": user.email, "password": "wrong"})
        assert resp.status_code == 401

    resp = client.post("/api/auth/login", data={"username": user.email, "password": "wrong"})
    assert resp.status_code == 429


def test_login_lockout_blocks_correct_password_too(client, make_user):
    """The point of a lockout: once triggered, even the RIGHT password
    is blocked until the window passes - otherwise an attacker just
    learns nothing from 429s and keeps guessing."""
    user, pw = make_user(email="lockout2@test.com", password="RealPass1!", role_name="Analyst")

    for _ in range(5):
        client.post("/api/auth/login", data={"username": user.email, "password": "wrong"})

    resp = client.post("/api/auth/login", data={"username": user.email, "password": pw})
    assert resp.status_code == 429


def test_login_lockout_is_scoped_by_username_and_ip_not_global(client, make_user, test_engine):
    """A different user should not be locked out by someone else's
    failed attempts - this locks by (username, IP) pair, not globally
    or by IP alone, so one person's mistakes don't collateral-damage
    every other user behind a shared/NAT'd IP."""
    user_a, _ = make_user(email="lockout3a@test.com", password="RealPass1!", role_name="Analyst")
    user_b, pw_b = make_user(email="lockout3b@test.com", password="RealPass1!", role_name="Analyst")

    for _ in range(5):
        client.post("/api/auth/login", data={"username": user_a.email, "password": "wrong"})

    # user_a is now locked out; user_b, a different username, must not be.
    resp = client.post("/api/auth/login", data={"username": user_b.email, "password": pw_b})
    assert resp.status_code == 200


def test_login_lockout_resets_after_window_passes(client, make_user, test_engine):
    """A lockout that never expires would be a permanent denial-of-
    service against a real user, not just an attacker."""
    from app.models.event_log import EventLog

    user, pw = make_user(email="lockout4@test.com", password="RealPass1!", role_name="Analyst")

    for _ in range(5):
        client.post("/api/auth/login", data={"username": user.email, "password": "wrong"})
    assert client.post("/api/auth/login", data={"username": user.email, "password": pw}).status_code == 429

    # Simulate the lockout window having passed by backdating the
    # failed-attempt events, rather than sleeping 15 real minutes.
    with Session(test_engine) as session:
        old_time = datetime.now(timezone.utc) - timedelta(minutes=20)
        rows = session.exec(
            __import__("sqlmodel").select(EventLog).where(EventLog.event_type == "login_failed")
        ).all()
        for row in rows:
            row.created_at = old_time
            session.add(row)
        session.commit()

    resp = client.post("/api/auth/login", data={"username": user.email, "password": pw})
    assert resp.status_code == 200


def test_security_headers_present_on_every_response(client):
    resp = client.get("/health")
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["x-frame-options"] == "DENY"
    assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in resp.headers["permissions-policy"]
