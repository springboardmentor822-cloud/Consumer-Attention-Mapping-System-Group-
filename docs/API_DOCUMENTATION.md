# API Documentation - Consumer Attention Mapping System

## Base URL
- **Local**: `http://localhost:8000`
- **Docker**: `http://localhost:8000` or via Nginx proxy `/`

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/login`
- **Description**: Authenticates user and returns JWT Bearer access token.
- **Request Body**:
  ```json
  {
    "email": "admin@cams.com",
    "password": "admin123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access_token": "<jwt_token>",
    "token_type": "bearer"
  }
  ```

### `GET /auth/me`
- **Description**: Returns current authenticated user profile.
- **Header**: `Authorization: Bearer <token>`

### `GET /auth/users`
- **Description**: Lists all registered platform users.
- **Role Required**: `ADMINISTRATOR` or `STORE_MANAGER`.

### `PUT /auth/users/{user_id}`
- **Description**: Admin endpoint to update user full_name, email, role, and active status.
- **Role Required**: `ADMINISTRATOR`.

### `PATCH /auth/users/{user_id}/status`
- **Description**: Admin endpoint to enable or disable a user account.
- **Role Required**: `ADMINISTRATOR`.

---

## 2. Store Manager Endpoints (`/store-manager`)

- `GET /store-manager/dashboard`: Live store traffic, customer count, zone traffic, and conversions.
- `GET /store-manager/live-cameras`: Camera feed statuses and active people counts.
- `GET /store-manager/shelf-performance`: Shelf occupancy, average dwell, and stock health.
- `GET /store-manager/product-interaction`: Product counts and interaction metrics.
- `GET /store-manager/alerts`: Operational alerts for store manager.
- **Role Required**: `STORE_MANAGER` or `ADMINISTRATOR`.

---

## 3. Retail Analyst Analytics Endpoints (`/analytics/analyst`)

- `GET /analytics/analyst/overview`: Executive summary of shopper behavior.
- `GET /analytics/analyst/segmentation`: Shopper segment distribution (Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer, Brand Loyal Customer).
- `GET /analytics/analyst/journey`: Zone transition probabilities and path flow analytics.
- `GET /analytics/analyst/heatmaps?heatmap_type=traffic|shelf|product_attention|hotspots`: 2D spatial heatmap coordinate arrays.
- `GET /analytics/analyst/product-attractiveness`: Product attractiveness scores based on formula:
  $$\text{Score} = 0.35 \times \text{Attn} + 0.25 \times \text{Inter} + 0.20 \times \text{Pick} + 0.15 \times \text{Conv} + 0.05 \times \text{Rep}$$
- `GET /analytics/analyst/recommendations`: AI layout and placement recommendations.
- **Role Required**: `RETAIL_ANALYST` or `ADMINISTRATOR`.

---

## 4. Marketing Manager Endpoints (`/analytics/marketing`)

- `GET /analytics/marketing/overview`: Campaign summary metrics and total reach.
- `GET /analytics/marketing/campaigns`: Active promotional campaign performance.
- `GET /analytics/marketing/visibility`: Product visibility and placement scores.
- `GET /analytics/marketing/sales-insights`: Sales lift and promotional conversion.
- **Role Required**: `MARKETING_MANAGER` or `ADMINISTRATOR`.

---

## 5. Alert & Notification System Endpoints (`/alerts`)

- `GET /alerts`: Retrieve and filter alerts by `alert_type`, `severity`, `status`, `is_read`.
- `GET /alerts/active`: Retrieve active unread alerts.
- `PATCH /alerts/{id}/read`: Mark alert as read.
- `POST /alerts/evaluate`: Trigger rule engine evaluation for shelf performance, product visibility, traffic anomalies, and camera health alerts.

---

## 6. Report Export Endpoints (`/analytics/export`)

- `GET /analytics/export/pdf`: Streaming PDF download formatted with ReportLab.
- `GET /analytics/export/excel`: Streaming multi-sheet XLSX download (Attention Logs, Product Attractiveness, Shelf Performance, Shopper Segmentation, Recommendations).
- `GET /analytics/export/csv`: Streaming CSV download.
