# REST API Technical Specification Manual
**Platform**: AI-Powered Consumer Attention Intelligence Platform  
**Version**: 3.0.0 (Milestone 4 Production Release)  
**Base URL**: `http://localhost:8000/api/v1`

---

## 1. Authentication & Security Protocols

### Authentication Headers
All protected endpoints require HTTP Bearer Token authentication:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### OAuth2 Password Flow
- **Endpoint**: `POST /api/v1/auth/login`
- **Payload**:
  ```json
  {
    "email": "manager@retail.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "USR-001",
      "email": "manager@retail.com",
      "full_name": "Lathashree",
      "role": "STORE_MANAGER",
      "store_id": "STORE-812"
    }
  }
  ```

---

## 2. API Endpoints Reference

### System & Telemetry APIs

#### `GET /api/v1/system/status`
Returns live platform health, server resource utilization, database connectivity, and RTSP stream status.

#### `GET /api/v1/system/audit-logs`
Returns chronologically sorted security and operational audit logs for compliance verification.

---

### Executive Role Dashboards

#### `GET /api/v1/dashboard/store`
- **Query Params**: `store_id` (string, default: `STORE-812`)
- **Returns**: Store KPIs, hourly traffic, zone occupancy, shelf performance metrics, checkout conversion rate, RTSP camera list, recent alerts, and merchandising recommendations.

#### `GET /api/v1/dashboard/analyst`
- **Query Params**: `store_id` (string, default: `STORE-812`)
- **Returns**: Attention metrics, journey Sankey flow matrix, shopper segment distribution (Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, Brand Loyal), dwell time analysis, and product attractiveness rankings.

#### `GET /api/v1/dashboard/marketing`
- **Query Params**: `store_id` (string, default: `STORE-812`)
- **Returns**: Active promotional campaigns, promotion lift waterfall analysis, visibility radar telemetry, and conversion scatter matrix.

#### `GET /api/v1/dashboard/admin`
- **Query Params**: `store_id` (string, default: `STORE-812`)
- **Returns**: System uptime, user account distribution, camera grid health status, CPU/Memory/GPU infrastructure utilization, and API response latency.

---

### Notification & Alert Engine

#### `GET /api/v1/alerts`
- **Query Params**: `store_id`, `type` (`SHELF_PERFORMANCE`, `PRODUCT_VISIBILITY`, `TRAFFIC_ANOMALY`, `CAMERA_HEALTH`), `level`, `acknowledged`
- **Returns**: Array of evaluated alert objects.

#### `POST /api/v1/alerts/trigger`
- **Request Body**:
  ```json
  {
    "store_id": "STORE-812",
    "type": "SHELF_PERFORMANCE",
    "level": "WARNING",
    "title": "Low Shelf Pickup Rate",
    "description": "Shelf A1 pickup conversion dropped below 20%",
    "source_id": "SHELF-01"
  }
  ```

#### `POST /api/v1/alerts/{alert_id}/acknowledge`
Marks specified alert as acknowledged by store personnel.

---

### Reports & Export Engine

#### `GET /api/v1/reports/export`
- **Query Params**:
  - `store_id` (string)
  - `report_type` (`daily`, `weekly`, `monthly`, `custom`)
  - `format` (`csv`, `excel`, `pdf`, `json`)
  - `start_date`, `end_date`, `zone_id`
- **Returns**: Formatted document file stream (.csv download or HTML printable report).

---

## 3. Standard HTTP Status Codes

| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request succeeded cleanly. |
| `400 Bad Request` | Invalid payload or missing parameters. |
| `401 Unauthorized` | Missing or invalid JWT Bearer token. |
| `403 Forbidden` | Insufficient role permission for endpoint. |
| `429 Too Many Requests` | IP Rate limit exceeded (>200 req/min). |
| `500 Server Error` | Unexpected backend error. |
