import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system_health_and_status():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

    status_resp = client.get("/api/v1/system/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "OPERATIONAL"
    assert "metrics" in status_data

def test_authentication_workflow():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "manager@retail.com",
        "password": "password123"
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STORE_MANAGER"

    invalid_resp = client.post("/api/v1/auth/login", json={
        "email": "invalid@retail.com",
        "password": "wrongpassword"
    })
    assert invalid_resp.status_code == 401

def test_store_manager_dashboard():
    response = client.get("/api/v1/dashboard/store?store_id=STORE-812")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "hourly_traffic" in data
    assert "shelf_performance" in data
    assert "cameras" in data

def test_analyst_dashboard():
    response = client.get("/api/v1/dashboard/analyst?store_id=STORE-812")
    assert response.status_code == 200
    data = response.json()
    assert "attention_metrics" in data
    assert "segment_distribution" in data
    assert "attractiveness_rankings" in data

def test_admin_dashboard_and_users():
    response = client.get("/api/v1/dashboard/admin?store_id=STORE-812")
    assert response.status_code == 200
    data = response.json()
    assert "system_status" in data
    assert "infrastructure" in data

    users_resp = client.get("/api/v1/auth/users")
    assert users_resp.status_code == 200
    users_data = users_resp.json()
    assert len(users_data) >= 4

def test_alerts_engine_workflow():
    alerts_resp = client.get("/api/v1/alerts?store_id=STORE-812")
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert len(alerts) > 0

    trigger_resp = client.post("/api/v1/alerts/trigger", json={
        "store_id": "STORE-812",
        "type": "SHELF_PERFORMANCE",
        "level": "WARNING",
        "title": "Low Engagement Warning",
        "description": "Shelf A1 engagement dropped 20% in past hour"
    })
    assert trigger_resp.status_code == 200
    triggered = trigger_resp.json()
    assert "id" in triggered

    ack_resp = client.post(f"/api/v1/alerts/{triggered['id']}/acknowledge")
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "SUCCESS"

def test_reports_export_engine():
    csv_resp = client.get("/api/v1/reports/export?store_id=STORE-812&report_type=daily&format=csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Store Operational Daily Report" in csv_resp.text

    pdf_resp = client.get("/api/v1/reports/export?store_id=STORE-812&report_type=weekly&format=pdf")
    assert pdf_resp.status_code == 200
    assert "text/html" in pdf_resp.headers["content-type"]
    assert "Weekly Performance Report" in pdf_resp.text

def test_session_ingestion_and_heatmaps():
    sess_id = f"SES-TEST-{uuid.uuid4().hex[:6]}"
    ingest_payload = {
        "session_id": sess_id,
        "store_id": "STORE-812",
        "shopper_id": "SHOP-TEST-999",
        "points": [
            {"session_id": sess_id, "shopper_id": "SHOP-TEST-999", "x": 120.0, "y": 150.0, "camera_id": "CAM-01"},
            {"session_id": sess_id, "shopper_id": "SHOP-TEST-999", "x": 125.0, "y": 160.0, "camera_id": "CAM-01"},
            {"session_id": sess_id, "shopper_id": "SHOP-TEST-999", "x": 130.0, "y": 170.0, "camera_id": "CAM-01"}
        ]
    }
    ingest_resp = client.post("/api/v1/sessions/ingestion/session", json=ingest_payload)
    assert ingest_resp.status_code == 200
    ingest_data = ingest_resp.json()
    assert "session_id" in ingest_data

    heatmap_resp = client.get("/api/v1/heatmaps/store?store_id=STORE-812&layer=TRAFFIC")
    assert heatmap_resp.status_code == 200
    heatmap_data = heatmap_resp.json()
    assert "grid_matrix" in heatmap_data
