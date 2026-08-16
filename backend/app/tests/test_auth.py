def test_register_and_login(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Analyst",
            "email": "analyst@example.com",
            "password": "SuperSecret123",
            "role": "retail_analyst",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "analyst@example.com"
    assert body["is_verified"] is False

    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "analyst@example.com", "password": "SuperSecret123"},
    )
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens


def test_login_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": "user2@example.com",
            "password": "CorrectPass123",
            "role": "retail_analyst",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "user2@example.com", "password": "WrongPass"},
    )
    assert resp.status_code == 401


def test_duplicate_registration_fails(client):
    payload = {
        "full_name": "Dup User",
        "email": "dup@example.com",
        "password": "SomePass123",
        "role": "store_manager",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_rbac_blocks_non_admin_from_user_list(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Analyst",
            "email": "analyst2@example.com",
            "password": "SuperSecret123",
            "role": "retail_analyst",
        },
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "analyst2@example.com", "password": "SuperSecret123"},
    )
    access_token = login_resp.json()["access_token"]

    resp = client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert resp.status_code == 403
