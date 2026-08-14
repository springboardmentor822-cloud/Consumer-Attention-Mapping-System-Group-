"""
test_e2e_pipeline.py
--------------------
Automated End-to-End Pipeline Verification Test.
Verifies complete flow: Camera -> Analytics -> Alerts -> Reports Export.
"""

import time
import threading
import requests
import uvicorn
from app.main import app

BASE_URL = "http://127.0.0.1:8010"


def start_test_server():
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="warning")


def run_e2e_pipeline():
    print("==================================================")
    print("RUNNING END-TO-END SYSTEM PIPELINE VERIFICATION")
    print("==================================================")

    # Start server thread
    server_thread = threading.Thread(target=start_test_server, daemon=True)
    server_thread.start()
    time.sleep(2)

    # 1. Login
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@cams.com", "password": "admin123"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[✓] Step 1: Authentication & Token Retrieval")

    # 2. System Health Check
    health_resp = requests.get(f"{BASE_URL}/health")
    assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
    print(f"[✓] Step 2: Health Check - Database: {health_resp.json().get('database')}")

    # 3. Camera Pipeline Check
    cam_resp = requests.get(f"{BASE_URL}/cameras/1", headers=headers)
    assert cam_resp.status_code == 200, f"Cameras endpoint failed: {cam_resp.text}"
    cams = cam_resp.json()
    print(f"[✓] Step 3: Camera Pipeline - {len(cams)} cameras active in database")

    # 4. Live Analytics Endpoint Check
    analytics_resp = requests.get(f"{BASE_URL}/analytics/live", headers=headers)
    assert analytics_resp.status_code == 200, f"Live analytics failed: {analytics_resp.text}"
    print("[✓] Step 4: Live Consumer Dwell & Attention Analytics Engine")

    # 5. Alert Evaluation & Retrieval Check
    eval_resp = requests.post(f"{BASE_URL}/alerts/evaluate", headers=headers)
    assert eval_resp.status_code == 200, f"Alert evaluation failed: {eval_resp.text}"
    
    alerts_resp = requests.get(f"{BASE_URL}/alerts", headers=headers)
    assert alerts_resp.status_code == 200, f"Get alerts failed: {alerts_resp.text}"
    alerts = alerts_resp.json()
    print(f"[✓] Step 5: Operational Alert Engine - {len(alerts)} alerts generated and retrieved")

    # 6. PDF Report Stream Check
    pdf_resp = requests.get(f"{BASE_URL}/analytics/export/pdf", headers=headers)
    assert pdf_resp.status_code == 200, f"PDF export failed: {pdf_resp.text}"
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 500, "PDF content appears empty"
    print(f"[✓] Step 6: Real PDF Report Engine - Generated {len(pdf_resp.content)} bytes PDF stream")

    # 7. Excel Report Stream Check
    excel_resp = requests.get(f"{BASE_URL}/analytics/export/excel", headers=headers)
    assert excel_resp.status_code == 200, f"Excel export failed: {excel_resp.text}"
    assert "spreadsheetml" in excel_resp.headers["content-type"]
    assert len(excel_resp.content) > 500, "Excel content appears empty"
    print(f"[✓] Step 7: Real Excel Report Engine - Generated {len(excel_resp.content)} bytes XLSX stream")

    print("==================================================")
    print("ALL END-TO-END PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_pipeline()
