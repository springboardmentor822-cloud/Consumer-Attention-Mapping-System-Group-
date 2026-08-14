"""
test_rbac_security.py
---------------------
Automated Security & Role-Based Access Control (RBAC) Verification Test.
Verifies JWT authentication and role isolation across all 4 roles.
"""

import time
import threading
import requests
import uvicorn
from app.main import app

BASE_URL = "http://127.0.0.1:8009"


def start_test_server():
    uvicorn.run(app, host="127.0.0.1", port=8009, log_level="warning")


def test_rbac_matrix():
    print("==================================================")
    print("RUNNING RBAC & SECURITY ISOLATION VERIFICATION")
    print("==================================================")

    # Start server thread
    server_thread = threading.Thread(target=start_test_server, daemon=True)
    server_thread.start()
    time.sleep(2)

    # 1. Login all 4 roles
    tokens = {}
    users_credentials = [
        ("admin@cams.com", "admin123", "administrator"),
        ("manager@cams.com", "manager123", "store_manager"),
        ("analyst@cams.com", "analyst123", "retail_analyst"),
        ("market@cams.com", "market123", "marketing_manager"),
    ]

    for email, password, role in users_credentials:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        tokens[role] = resp.json()["access_token"]
        print(f"[✓] Login successful for role: {role}")

    # 2. Test Invalid Token / No Token Security
    unauth_resp = requests.get(f"{BASE_URL}/auth/users")
    assert unauth_resp.status_code == 401, f"Expected 401 Unauthorized, got {unauth_resp.status_code}"
    print("[✓] Unauthenticated request correctly rejected with 401 Unauthorized")

    # 3. Test Admin-Only User Management Endpoints
    admin_headers = {"Authorization": f"Bearer {tokens['administrator']}"}
    admin_users_resp = requests.get(f"{BASE_URL}/auth/users", headers=admin_headers)
    assert admin_users_resp.status_code == 200, f"Admin users failed: {admin_users_resp.text}"
    print("[✓] Administrator successfully accessed /auth/users")

    # Retail Analyst should be forbidden (403) from user management updates
    analyst_headers = {"Authorization": f"Bearer {tokens['retail_analyst']}"}
    analyst_update_resp = requests.put(f"{BASE_URL}/auth/users/1", json={"full_name": "Hack Test"}, headers=analyst_headers)
    assert analyst_update_resp.status_code == 403, f"Expected 403 Forbidden, got {analyst_update_resp.status_code}"
    print("[✓] Retail Analyst forbidden from Admin User Updates (403 Forbidden)")

    # Marketing Manager should be forbidden (403) from Store Manager module
    market_headers = {"Authorization": f"Bearer {tokens['marketing_manager']}"}
    market_sm_resp = requests.get(f"{BASE_URL}/store-manager/dashboard", headers=market_headers)
    assert market_sm_resp.status_code == 403, f"Expected 403 Forbidden, got {market_sm_resp.status_code}"
    print("[✓] Marketing Manager forbidden from Store Manager Dashboard (403 Forbidden)")

    # Store Manager should be forbidden (403) from Marketing Analytics
    sm_headers = {"Authorization": f"Bearer {tokens['store_manager']}"}
    sm_market_resp = requests.get(f"{BASE_URL}/analytics/marketing/overview", headers=sm_headers)
    assert sm_market_resp.status_code == 403, f"Expected 403 Forbidden, got {sm_market_resp.status_code}"
    print("[✓] Store Manager forbidden from Marketing Analytics (403 Forbidden)")

    # Store Manager can access Store Manager Dashboard (200)
    sm_dash_resp = requests.get(f"{BASE_URL}/store-manager/dashboard", headers=sm_headers)
    assert sm_dash_resp.status_code == 200, f"Store Manager dashboard failed: {sm_dash_resp.text}"
    print("[✓] Store Manager successfully accessed Store Manager Dashboard")

    print("==================================================")
    print("ALL RBAC & SECURITY ISOLATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_rbac_matrix()
