"""
Load test for the Consumer Attention Mapping backend, using Locust.

Simulates realistic dashboard usage: a user logs in once, then repeatedly
hits the same read-heavy analytics endpoints a real dashboard polls or
re-fetches on navigation - zone traffic, dwell-time, attractiveness, and
recommendations. Write endpoints (register, campaign creation) are
deliberately NOT load-tested here: hammering /register or /campaigns
with concurrent users doesn't represent real usage (a real deployment
has a handful of admins registering users, not hundreds of concurrent
writers) and would just create junk data in whatever database you point
this at. Read-heavy analytics endpoints are what a real camera-fed
retail deployment needs to hold up under - dozens of dashboard tabs
open across roles, polling on intervals (Admin's monitoring poll is
literally 10s - see admin/page.tsx) - which is exactly what this
simulates.

HOW TO RUN THIS FOR REAL (not against a toy SQLite instance):
    1. Start your actual stack: docker compose up -d postgres timescaledb redis
    2. Start the real backend: uvicorn app.main:app
    3. Create at least one store, shelf, camera, and a SuperAdmin user
       first (this script logs in as an existing user, it does not
       create test data - see the setup note below).
    4. Set the three env vars below to real values.
    5. Run: locust -f locustfile.py --headless -u 20 -r 2 -t 60s --host http://localhost:8000

Setup note: point LOAD_TEST_STORE_ID / LOAD_TEST_CAMERA_ID at real,
already-existing rows in whatever database you're testing against - a
load test against 404s measures nothing real about performance.
"""
import os
import random

from locust import HttpUser, task, between


LOAD_TEST_EMAIL = os.environ.get("LOAD_TEST_EMAIL", "loadtest@test.com")
LOAD_TEST_PASSWORD = os.environ.get("LOAD_TEST_PASSWORD", "LoadTest1!")
LOAD_TEST_STORE_ID = os.environ.get("LOAD_TEST_STORE_ID", "")
LOAD_TEST_CAMERA_ID = os.environ.get("LOAD_TEST_CAMERA_ID", "")


class DashboardUser(HttpUser):
    # Real dashboards don't hammer the API in a tight loop - a person
    # reading a chart, then clicking to another section, has real think
    # time between requests. 1-3s matches roughly how fast someone
    # actually navigates a dashboard, not how fast a script could fire
    # requests.
    wait_time = between(1, 3)

    def on_start(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": LOAD_TEST_EMAIL, "password": LOAD_TEST_PASSWORD},
            name="/api/auth/login",
        )
        if resp.status_code != 200:
            self.environment.runner.quit()
            raise RuntimeError(
                f"Login failed ({resp.status_code}): {resp.text}. "
                f"Set LOAD_TEST_EMAIL/LOAD_TEST_PASSWORD to a real existing user."
            )
        token = resp.json()["access_token"]
        self.client.headers.update({"Authorization": f"Bearer {token}"})

        if not LOAD_TEST_STORE_ID:
            self.environment.runner.quit()
            raise RuntimeError(
                "LOAD_TEST_STORE_ID is not set - point it at a real store in "
                "the database you're testing against."
            )

    @task(3)
    def zone_traffic(self):
        self.client.get(
            f"/api/stores/{LOAD_TEST_STORE_ID}/zone-traffic",
            name="/api/stores/[id]/zone-traffic",
        )

    @task(3)
    def dwell_time(self):
        if not LOAD_TEST_CAMERA_ID:
            return
        self.client.get(
            f"/api/stores/{LOAD_TEST_STORE_ID}/cameras/{LOAD_TEST_CAMERA_ID}/dwell-time",
            name="/api/stores/[id]/cameras/[id]/dwell-time",
        )

    @task(2)
    def attractiveness(self):
        if not LOAD_TEST_CAMERA_ID:
            return
        self.client.get(
            f"/api/stores/{LOAD_TEST_STORE_ID}/cameras/{LOAD_TEST_CAMERA_ID}/attractiveness",
            name="/api/stores/[id]/cameras/[id]/attractiveness",
        )

    @task(1)
    def recommendations(self):
        self.client.get(
            f"/api/stores/{LOAD_TEST_STORE_ID}/recommendations",
            name="/api/stores/[id]/recommendations",
        )

    @task(1)
    def me(self):
        # Cheap endpoint, included because it's real traffic - every
        # authenticated page load in this frontend calls /me at least
        # once (see RoleGuard.tsx).
        self.client.get("/api/auth/me", name="/api/auth/me")
