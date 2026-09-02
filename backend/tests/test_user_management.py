"""
Tests for the self-lockout guards in app/api/users.py - a SuperAdmin
must not be able to demote or deactivate their OWN account, since that
could lock the last admin out of the whole system with no one left to
undo it.
"""


def _register_superadmin(client, email="lockout-admin@test.com"):
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "AdminPass1!", "role_name": "SuperAdmin"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _get_self_id(client, headers):
    return client.get("/api/auth/me", headers=headers).json()["id"]


def test_superadmin_cannot_demote_self(client):
    headers = _register_superadmin(client)
    self_id = _get_self_id(client, headers)

    resp = client.patch(
        f"/api/users/{self_id}/role", json={"role_name": "Analyst"}, headers=headers
    )
    assert resp.status_code == 400, (
        "A SuperAdmin demoting themselves should be blocked - "
        "otherwise a single mistaken call locks out the whole system."
    )


def test_superadmin_can_change_someone_elses_role(client, make_user):
    headers = _register_superadmin(client)
    other, _ = make_user(email="other@test.com", role_name="Analyst")

    resp = client.patch(
        f"/api/users/{other.id}/role", json={"role_name": "StoreManager"}, headers=headers
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["role_name"] == "StoreManager"


def test_superadmin_cannot_deactivate_self(client):
    headers = _register_superadmin(client)
    self_id = _get_self_id(client, headers)

    resp = client.patch(
        f"/api/users/{self_id}/active", json={"is_active": False}, headers=headers
    )
    assert resp.status_code == 400, (
        "A SuperAdmin deactivating their own account should be blocked - "
        "same self-lockout risk as the role guard."
    )


def test_superadmin_can_deactivate_someone_else(client, make_user):
    headers = _register_superadmin(client)
    other, _ = make_user(email="deactivate-me@test.com", role_name="Analyst")

    resp = client.patch(
        f"/api/users/{other.id}/active", json={"is_active": False}, headers=headers
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["is_active"] is False
