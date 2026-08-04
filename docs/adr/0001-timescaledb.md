# ADR 0001: Selection of TimescaleDB for Retail Telemetry Logs

## Status
Proposed & Approved

## Context
The Consumer Attention Mapping System consumes high-velocity coordinate paths, shelf intersections, and product interactions (5 FPS from multiple cameras). Standard relational databases experience query degradation on large tables over time. We need to perform efficient time-bucketed aggregations (e.g., average attention times per shelf per hour, dwell time distributions) while preserving relational integrity for store configurations, user credentials, and product metadata.

## Decision
We choose **TimescaleDB** (an extension of PostgreSQL) to store all shopper telemetry:
1. **Hypertables**: We immediately convert telemetry tables (`tracking_logs`, `interaction_logs`, `camera_events`, `attention_logs`, `heatmap_points`) to hypertables.
2. **Partitioning**: Partitioning is done automatically based on the `timestamp` column.
3. **Composite Primary Keys**: To satisfy TimescaleDB constraints, the primary key of all log tables is declared as a composite key `(id, timestamp)`.
4. **Dialect Checks**: All hypertable conversion SQL commands in Alembic migrations are wrapped in dialect checks (`bind.dialect.name == "postgresql"`) to maintain compatibility with SQLite in-memory databases used in Pytest suites.

## Consequences
- **Pros**: Fast time-bucket analytics, automatic table chunking, zero performance degradation on large tables, retaining the SQL query parser.
- **Cons**: Requires composite keys `(id, timestamp)` which shifts identity management in SQLAlchemy.
