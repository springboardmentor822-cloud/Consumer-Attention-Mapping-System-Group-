"""
Tests for app/api/auth.py.

These exercise the real bug this project already fixed once: /register
used to be wide open (anyone could self-register as SuperAdmin). The
first two tests below are exactly the regression check for that - if
someone accidentally reverts the bootstrap-only guard, these fail.
"""


def test_register_first_user_becomes_bootstrap_no_auth_needed(client):
    """First-ever user: /register must work with zero auth (chicken-and-egg
    problem - there's no SuperAdmin yet to create one)."""
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "first-admin@test.com",
            "password": "StrongPass1!",
            "role_name": "SuperAdmin",
        },
    )
    assert resp.status_code == 201, resp.text
    assert "access_token" in resp.json()


def test_register_second_user_blocked_without_auth(client):
    """REGRESSION CHECK: once a user exists, /register must require an
    authenticated SuperAdmin. This is the exact vulnerability that used to
    let anyone self-register as SuperAdmin."""
    first = client.post(
        "/api/auth/register",
        json={"email": "admin@test.com", "password": "StrongPass1!", "role_name": "SuperAdmin"},
    )
    assert first.status_code == 201

    second = client.post(
        "/api/auth/register",
        json={"email": "intruder@test.com", "password": "StrongPass1!", "role_name": "SuperAdmin"},
    )
    assert second.status_code == 401, (
        "SECURITY REGRESSION: /register accepted a second user with no auth "
        "token at all - this is the exact bug already fixed once in this project."
    )


def test_register_second_user_blocked_for_non_superadmin(client, make_user, auth_header):
    """An authenticated non-SuperAdmin (e.g. Analyst) must not be able to
    register new accounts either."""
    client.post(
        "/api/auth/register",
        json={"email": "admin@test.com", "password": "StrongPass1!", "role_name": "SuperAdmin"},
    )
    analyst, pw = make_user(email="analyst@test.com", password="AnalystPass1!", role_name="Analyst")
    headers = auth_header(analyst.email, pw)

    resp = client.post(
        "/api/auth/register",
        json={"email": "new@test.com", "password": "StrongPass1!", "role_name": "Analyst"},
        headers=headers,
    )
    assert resp.status_code == 403


def test_register_weak_password_rejected(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "weak@test.com", "password": "weak", "role_name": "Analyst"},
    )
    assert resp.status_code == 422


def test_register_unknown_role_rejected(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "x@test.com", "password": "StrongPass1!", "role_name": "NotARealRole"},
    )
    assert resp.status_code == 400


def test_login_success(client, make_user):
    user, pw = make_user(email="login@test.com", password="LoginPass1!", role_name="Analyst")
    resp = client.post("/api/auth/login", data={"username": user.email, "password": pw})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password_rejected(client, make_user):
    user, _ = make_user(email="wrongpw@test.com", password="RealPass1!", role_name="Analyst")
    resp = client.post(
        "/api/auth/login", data={"username": user.email, "password": "WrongPass1!"}
    )
    assert resp.status_code in (400, 401)


def test_me_requires_valid_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_correct_user(client, make_user, auth_header):
    user, pw = make_user(email="me@test.com", password="MePass1!", role_name="StoreManager")
    headers = auth_header(user.email, pw)
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == user.email
    assert body["role_name"] == "StoreManager"
