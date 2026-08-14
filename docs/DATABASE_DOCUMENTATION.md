# Database Documentation - Consumer Attention Mapping System

## Database Technology & Schema Overview
- **ORM**: SQLAlchemy
- **Engine**: SQLite (local dev) / PostgreSQL 16 + TimeScaleDB (production)

---

## Data Models & Entity-Relationship Schema

### 1. `users`
- `id` (Integer, Primary Key)
- `full_name` (String 120)
- `email` (String 150, Unique, Indexed)
- `hashed_password` (String 255)
- `role` (Enum: `administrator`, `store_manager`, `retail_analyst`, `marketing_manager`)
- `is_active` (Boolean, Default True)
- `created_at` (DateTime)

### 2. `stores`
- `id` (Integer, Primary Key)
- `name` (String 150)
- `location` (String 255)
- `manager_name` (String 150)
- `contact_number` (String 50)
- `status` (String 50)
- `opening_hours` (String 100)
- `created_at` (DateTime)

### 3. `zones`
- `id` (Integer, Primary Key)
- `name` (String 120)
- `store_id` (Integer, Foreign Key `stores.id`)
- `assigned_camera_id` (Integer, Foreign Key `cameras.id`, Optional)
- `status` (String 50: `Optimal`, `Busy`, `High Traffic`)

### 4. `shelves`
- `id` (Integer, Primary Key)
- `label` (String 120)
- `store_id` (Integer, Foreign Key `stores.id`)
- `zone_id` (Integer, Foreign Key `zones.id`)
- `occupancy_percentage` (Float)
- `visitors_count` (Integer)
- `average_dwell_time` (Float)
- `attention_score` (Float)
- `shelf_status` (String 50)

### 5. `cameras`
- `id` (Integer, Primary Key)
- `label` (String 120)
- `location` (String 255)
- `stream_url` (String 500)
- `status` (String 20: `online`, `offline`, `unknown`)
- `store_id` (Integer, Foreign Key `stores.id`)

### 6. `products` & `product_metrics`
- `products`: Base product table with shelf and zone mapping.
- `product_metrics`:
  - `attention_duration` (Float)
  - `interaction_frequency` (Float)
  - `pickup_rate` (Float)
  - `conversion_rate` (Float)
  - `repeat_engagement` (Float)
  - `attractiveness_score` (Float)
  - `rank` (Integer)

### 7. `shopper_sessions` & `shopper_trajectories`
- Stores individual shopper tracking sessions, dwell times, visited zones, and 2D heatmap coordinate trajectory points.

### 8. `alerts`
- `id` (Integer, Primary Key)
- `store_id` (Integer, Foreign Key `stores.id`)
- `zone_id` (Integer, Foreign Key `zones.id`, Optional)
- `camera_id` (Integer, Foreign Key `cameras.id`, Optional)
- `product_id` (Integer, Foreign Key `products.id`, Optional)
- `shelf_id` (Integer, Foreign Key `shelves.id`, Optional)
- `alert_type` (String 50: `shelf_performance`, `product_visibility`, `traffic_anomaly`, `camera_health`)
- `severity` (String 20: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- `message` (String 500)
- `status` (String 20: `active`, `acknowledged`, `resolved`)
- `is_read` (Boolean, Default False)
- `created_at` (DateTime)
