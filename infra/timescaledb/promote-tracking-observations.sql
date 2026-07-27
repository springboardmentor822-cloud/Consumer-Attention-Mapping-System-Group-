\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS timescaledb;

DO $block$
BEGIN
    IF to_regclass('public.tracking_observations') IS NULL THEN
        RAISE EXCEPTION
            'tracking_observations does not exist; start the backend once so SQLAlchemy can create the schema';
    END IF;
END
$block$;

-- The SQLAlchemy model uses (id, observed_at) as its primary key, so every
-- unique constraint includes the TimescaleDB partitioning column.
SELECT create_hypertable(
    'tracking_observations',
    'observed_at',
    if_not_exists => TRUE,
    migrate_data => TRUE
);
