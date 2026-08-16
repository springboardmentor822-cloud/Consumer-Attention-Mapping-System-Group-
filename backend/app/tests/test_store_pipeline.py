import datetime as dt


def _register_and_login(client, email="admin3@example.com", role="administrator"):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Admin",
            "email": email,
            "password": "AdminPass123",
            "role": role,
        },
    )
    resp = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "AdminPass123"}
    )
    return resp.json()["access_token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_store_and_camera(client):
    token = _register_and_login(client)
    headers = _auth_headers(token)

    store_resp = client.post(
        "/api/v1/stores",
        json={"name": "Test Store", "city": "Testville", "floor_width_m": 20, "floor_height_m": 10},
        headers=headers,
    )
    assert store_resp.status_code == 201
    store_id = store_resp.json()["id"]

    camera_resp = client.post(
        "/api/v1/cameras",
        json={"store_id": store_id, "name": "Cam 1", "camera_type": "webcam"},
        headers=headers,
    )
    assert camera_resp.status_code == 201
    assert camera_resp.json()["status"] == "configuring"


def test_product_and_score_pipeline(client):
    token = _register_and_login(client, email="admin4@example.com")
    headers = _auth_headers(token)

    store_id = client.post(
        "/api/v1/stores", json={"name": "Score Store"}, headers=headers
    ).json()["id"]

    shelf_id = client.post(
        "/api/v1/shelves",
        json={"store_id": store_id, "name": "Shelf X"},
        headers=headers,
    ).json()["id"]

    product_resp = client.post(
        "/api/v1/products",
        json={"sku": "SKU-TEST-1", "name": "Test Product", "shelf_id": shelf_id},
        headers=headers,
    )
    assert product_resp.status_code == 201
    product_id = product_resp.json()["id"]

    session_resp = client.post(
        "/api/v1/sessions",
        json={
            "store_id": store_id,
            "shopper_uid": "test-shopper-1",
            "entry_time": dt.datetime.utcnow().isoformat(),
        },
        headers=headers,
    )
    assert session_resp.status_code == 201
    session_id = session_resp.json()["id"]

    camera_id = client.post(
        "/api/v1/cameras",
        json={"store_id": store_id, "name": "Cam Score", "camera_type": "webcam"},
        headers=headers,
    ).json()["id"]

    now = dt.datetime.utcnow()
    attn_resp = client.post(
        "/api/v1/attention/events",
        json={
            "session_id": session_id,
            "shelf_id": shelf_id,
            "product_id": product_id,
            "camera_id": camera_id,
            "start_time": now.isoformat(),
            "duration_seconds": 12.5,
        },
        headers=headers,
    )
    assert attn_resp.status_code == 201

    interaction_resp = client.post(
        "/api/v1/attention/interactions",
        json={
            "session_id": session_id,
            "product_id": product_id,
            "interaction_type": "purchased",
            "timestamp": now.isoformat(),
        },
        headers=headers,
    )
    assert interaction_resp.status_code == 201

    period_start = (now - dt.timedelta(days=1)).isoformat()
    period_end = (now + dt.timedelta(days=1)).isoformat()
    score_resp = client.post(
        f"/api/v1/scores/compute?store_id={store_id}&period_start={period_start}&period_end={period_end}",
        headers=headers,
    )
    assert score_resp.status_code == 201
    scores = score_resp.json()
    assert len(scores) == 1
    assert scores[0]["product_id"] == product_id
    assert scores[0]["total_score"] >= 0


def test_duplicate_shelf_category_returns_clean_400_not_500(client):
    token = _register_and_login(client, email="admin5@example.com")
    headers = _auth_headers(token)

    first = client.post("/api/v1/shelves/categories", json={"name": "Beverages"}, headers=headers)
    assert first.status_code == 201

    duplicate = client.post("/api/v1/shelves/categories", json={"name": "Beverages"}, headers=headers)
    assert duplicate.status_code == 400
    assert "already exists" in duplicate.json()["detail"]


def test_duplicate_product_category_returns_clean_400_not_500(client):
    token = _register_and_login(client, email="admin6@example.com")
    headers = _auth_headers(token)

    first = client.post("/api/v1/products/categories", json={"name": "Snacks"}, headers=headers)
    assert first.status_code == 201

    duplicate = client.post("/api/v1/products/categories", json={"name": "Snacks"}, headers=headers)
    assert duplicate.status_code == 400
    assert "already exists" in duplicate.json()["detail"]
