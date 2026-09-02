"""
Tests for app/core/deps.py's require_roles() and the endpoints that use it.

This project's history includes a real bug where several analytics
endpoints had zero auth at all. These tests check the gate actually
gates - both the "wrong role gets 403" and "right role gets through" side,
since a test that only ever checks 403 would still pass if the endpoint
started rejecting EVERYONE.
"""


def _bootstrap_superadmin(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "root@test.com", "password": "RootPass1!", "role_name": "SuperAdmin"},
    )
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_create_store_blocked_for_analyst(client, make_user, auth_header):
    _bootstrap_superadmin(client)
    analyst, pw = make_user(email="analyst2@test.com", password="AnalystPass1!", role_name="Analyst")
    headers = auth_header(analyst.email, pw)

    resp = client.post("/api/stores", json={"name": "Test Store"}, headers=headers)
    assert resp.status_code == 403


def test_create_store_allowed_for_store_manager(client, make_user, auth_header):
    _bootstrap_superadmin(client)
    manager, pw = make_user(email="mgr@test.com", password="MgrPass1!", role_name="StoreManager")
    headers = auth_header(manager.email, pw)

    resp = client.post("/api/stores", json={"name": "Test Store"}, headers=headers)
    assert resp.status_code == 201, resp.text


def test_create_store_requires_auth_at_all(client):
    """No token, no header - must be rejected, not silently allowed."""
    resp = client.post("/api/stores", json={"name": "No Auth Store"})
    assert resp.status_code == 401


def test_list_users_blocked_for_non_superadmin(client, make_user, auth_header):
    _bootstrap_superadmin(client)
    manager, pw = make_user(email="mgr2@test.com", password="MgrPass1!", role_name="StoreManager")
    headers = auth_header(manager.email, pw)

    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 403


def test_list_users_allowed_for_superadmin(client):
    admin_headers = _bootstrap_superadmin(client)
    resp = client.get("/api/users", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_inactive_user_rejected_even_with_valid_token(client, make_user, auth_header):
    # NOTE: create the SuperAdmin FIRST via make_user (direct DB insert),
    # not via _bootstrap_superadmin's /register call - that helper relies
    # on the DB being empty (the first-run bootstrap path). If a user
    # already exists when it runs, /register correctly returns 401 per
    # the app's own security rule, which broke this test until fixed.
    admin, admin_pw = make_user(email="lockout-admin2@test.com", password="AdminPass1!", role_name="SuperAdmin")
    admin_headers = auth_header(admin.email, admin_pw)

    user, pw = make_user(email="deactivated@test.com", password="DeactPass1!", role_name="Analyst")
    headers = auth_header(user.email, pw)
    # sanity: token works before deactivation
    assert client.get("/api/auth/me", headers=headers).status_code == 200

    resp = client.patch(
        f"/api/users/{user.id}/active", json={"is_active": False}, headers=admin_headers
    )
    assert resp.status_code == 200, resp.text

    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 401, (
        "A deactivated user's still-valid JWT must be rejected - "
        "get_current_user() is supposed to check is_active."
    )
