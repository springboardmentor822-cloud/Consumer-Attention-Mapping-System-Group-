from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_schema_compatibility(engine: Engine) -> None:
    """Apply small idempotent repairs for databases created before models changed."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    if "cameras" in tables:
        camera_columns = {column["name"] for column in inspector.get_columns("cameras")}
        with engine.begin() as connection:
            if "location" in camera_columns:
                connection.execute(text("ALTER TABLE cameras ALTER COLUMN location DROP NOT NULL"))

            if "camera_ip" not in camera_columns:
                connection.execute(text("ALTER TABLE cameras ADD COLUMN camera_ip VARCHAR(80)"))
                connection.execute(text("UPDATE cameras SET camera_ip = '0.0.0.0' WHERE camera_ip IS NULL"))
                connection.execute(text("ALTER TABLE cameras ALTER COLUMN camera_ip SET NOT NULL"))

            if "camera_location" not in camera_columns:
                connection.execute(text("ALTER TABLE cameras ADD COLUMN camera_location VARCHAR(160)"))
                if "location" in camera_columns:
                    connection.execute(text("UPDATE cameras SET camera_location = location WHERE camera_location IS NULL"))
                connection.execute(text("UPDATE cameras SET camera_location = 'Unknown' WHERE camera_location IS NULL"))
                connection.execute(text("ALTER TABLE cameras ALTER COLUMN camera_location SET NOT NULL"))

    if "detections" in tables:
        detection_columns = {column["name"] for column in inspector.get_columns("detections")}
        if "zone_id" not in detection_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE detections ADD COLUMN zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL")
                )

    if "users" in tables:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "store_id" not in user_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL")
                )
