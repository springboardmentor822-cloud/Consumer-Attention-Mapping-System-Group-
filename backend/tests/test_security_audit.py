import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_rate_limiting_headers():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers

def test_unauthorized_purge_endpoint():
    purge_resp = client.post("/api/v1/auth/users/purge-unauthorized")
    assert purge_resp.status_code == 200
    data = purge_resp.json()
    assert "purged_count" in data

def test_jwt_token_validation():
    # Login as admin to get valid token
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@retail.com",
        "password": "password123"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data

    # Verify protected endpoint access with user email parameter
    me_resp = client.get("/api/v1/auth/me?email=admin@retail.com", headers={
        "Authorization": f"Bearer {token_data['access_token']}"
    })
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "ADMINISTRATOR"

def test_audit_log_recording():
    audit_resp = client.get("/api/v1/system/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert isinstance(logs, list)
