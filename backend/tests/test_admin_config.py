"""
Tests for GET /api/admin/config (app/api/admin.py's get_system_configuration).

Two things matter here: role gating (SuperAdmin only, matching every
other admin endpoint), and that secrets never leak into the response -
that second one is the actual point of this endpoint's design, so it
gets a real test, not just a values-look-right check.
"""


def test_config_requires_auth(client):
    resp = client.get("/api/admin/config")
    assert resp.status_code == 401


def test_config_blocked_for_non_superadmin(client, make_user, auth_header):
    manager, pw = make_user(email="config-mgr@test.com", role_name="StoreManager")
    headers = auth_header(manager.email, pw)
    resp = client.get("/api/admin/config", headers=headers)
    assert resp.status_code == 403


def test_config_returns_real_values_for_superadmin(client, make_user, auth_header):
    admin, pw = make_user(email="config-admin@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get("/api/admin/config", headers=headers)
    assert resp.status_code == 200
    body = resp.json()

    # Spot-check against the actual constants these values are sourced
    # from, not just "some number came back".
    assert body["auth"]["jwt_algorithm"] == "HS256"
    assert body["recommendation_engine"]["high_attention_threshold"] == 0.6
    assert body["recommendation_engine"]["low_engagement_threshold"] == 0.4
    assert body["recommendation_scheduler"]["interval_minutes"] == 15
    assert body["recommendation_scheduler"]["retention_days"] == 7
    assert body["heatmap_cache"]["cache_ttl_seconds"] == 900


def test_config_never_leaks_secrets(client, make_user, auth_header):
    """The actual point of this endpoint's design: JWT_SECRET_KEY,
    DATABASE_URL, TIMESCALE_DATABASE_URL, and SMTP_PASSWORD must never
    appear anywhere in the response, even to a SuperAdmin - this
    endpoint travels over HTTP to a browser tab."""
    admin, pw = make_user(email="config-admin2@test.com", role_name="SuperAdmin")
    headers = auth_header(admin.email, pw)
    resp = client.get("/api/admin/config", headers=headers)
    raw = resp.text.lower()

    assert "jwt_secret" not in raw
    assert "change-this-in-your-env-file" not in raw  # the actual default secret value
    assert "postgresql://" not in raw  # would appear in DATABASE_URL/TIMESCALE_DATABASE_URL
    assert "smtp_password" not in raw
