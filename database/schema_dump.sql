-- Consumer Attention Mapping System — PostgreSQL Schema Dump
-- Generated directly from the SQLAlchemy models in backend/app/models/
-- (not hand-written — this guarantees it matches the running code).
--
-- Regenerate any time with:
--   cd backend && python3 -c "
--   from sqlalchemy.schema import CreateTable
--   from sqlalchemy.dialects import postgresql
--   from app.database import Base
--   import app.models
--   for t in Base.metadata.sorted_tables:
--       print(str(CreateTable(t).compile(dialect=postgresql.dialect())).strip() + ';\n')
--   "
--
-- 20 tables covering: auth (users, tokens), store/camera/shelf/product
-- catalog, shopper sessions + tracking + attention events, and the
-- analytics layer (heatmaps, scores, reports, notifications,
-- recommendations). See documentation/ARCHITECTURE.md for the ER diagram.

CREATE TABLE product_categories (
	id SERIAL NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	description TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE shelf_categories (
	id SERIAL NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	description TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	full_name VARCHAR(150) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255), 
	role roleenum NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	oauth_provider VARCHAR(50), 
	oauth_sub VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE email_verification_tokens (
	id SERIAL NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	user_id INTEGER NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	used BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE password_reset_tokens (
	id SERIAL NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	user_id INTEGER NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	used BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE refresh_tokens (
	id SERIAL NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	user_id INTEGER NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	revoked BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE stores (
	id SERIAL NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	address TEXT, 
	city VARCHAR(100), 
	country VARCHAR(100), 
	timezone VARCHAR(50), 
	floor_width_m FLOAT, 
	floor_height_m FLOAT, 
	manager_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(manager_id) REFERENCES users (id)
);

CREATE TABLE reports (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	requested_by_id INTEGER NOT NULL, 
	report_type reporttypeenum NOT NULL, 
	report_format reportformatenum NOT NULL, 
	period_start TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	period_end TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	file_path VARCHAR(500), 
	status VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	completed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(requested_by_id) REFERENCES users (id)
);

CREATE TABLE store_zones (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	polygon_coordinates TEXT, 
	description TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id)
);

CREATE TABLE cameras (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	zone_id INTEGER, 
	name VARCHAR(150) NOT NULL, 
	camera_type cameratypeenum NOT NULL, 
	status camerastatusenum NOT NULL, 
	stream_url VARCHAR(500), 
	resolution_width INTEGER, 
	resolution_height INTEGER, 
	fps INTEGER, 
	calibration_data TEXT, 
	last_heartbeat_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(zone_id) REFERENCES store_zones (id)
);

CREATE TABLE shopper_sessions (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	shopper_uid VARCHAR(64) NOT NULL, 
	entry_time TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	exit_time TIMESTAMP WITHOUT TIME ZONE, 
	total_duration_seconds FLOAT, 
	entry_zone_id INTEGER, 
	exit_zone_id INTEGER, 
	zones_visited_count INTEGER, 
	total_distance_m FLOAT, 
	segment customersegmentenum, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(entry_zone_id) REFERENCES store_zones (id), 
	FOREIGN KEY(exit_zone_id) REFERENCES store_zones (id)
);

CREATE TABLE heatmaps (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	camera_id INTEGER, 
	heatmap_type heatmaptypeenum NOT NULL, 
	period_start TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	period_end TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	data TEXT NOT NULL, 
	generated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(camera_id) REFERENCES cameras (id)
);

CREATE TABLE shelves (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	camera_id INTEGER, 
	category_id INTEGER, 
	name VARCHAR(150) NOT NULL, 
	aisle VARCHAR(50), 
	position_coordinates TEXT, 
	frame_bounding_box TEXT, 
	shelf_width_m FLOAT, 
	shelf_height_m FLOAT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(camera_id) REFERENCES cameras (id), 
	FOREIGN KEY(category_id) REFERENCES shelf_categories (id)
);

CREATE TABLE tracking_data (
	id SERIAL NOT NULL, 
	session_id INTEGER NOT NULL, 
	camera_id INTEGER NOT NULL, 
	zone_id INTEGER, 
	timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	bbox_x FLOAT NOT NULL, 
	bbox_y FLOAT NOT NULL, 
	bbox_w FLOAT NOT NULL, 
	bbox_h FLOAT NOT NULL, 
	detection_confidence FLOAT, 
	floor_x FLOAT, 
	floor_y FLOAT, 
	track_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES shopper_sessions (id), 
	FOREIGN KEY(camera_id) REFERENCES cameras (id), 
	FOREIGN KEY(zone_id) REFERENCES store_zones (id)
);

CREATE TABLE products (
	id SERIAL NOT NULL, 
	sku VARCHAR(100) NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	brand VARCHAR(150), 
	price FLOAT, 
	category_id INTEGER, 
	shelf_id INTEGER, 
	shelf_position TEXT, 
	image_url VARCHAR(500), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(category_id) REFERENCES product_categories (id), 
	FOREIGN KEY(shelf_id) REFERENCES shelves (id)
);

CREATE TABLE attention_events (
	id SERIAL NOT NULL, 
	session_id INTEGER NOT NULL, 
	shelf_id INTEGER, 
	product_id INTEGER, 
	camera_id INTEGER NOT NULL, 
	start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	end_time TIMESTAMP WITHOUT TIME ZONE, 
	duration_seconds FLOAT, 
	head_pose_yaw FLOAT, 
	head_pose_pitch FLOAT, 
	head_pose_roll FLOAT, 
	gaze_vector_x FLOAT, 
	gaze_vector_y FLOAT, 
	is_repeat_attention INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES shopper_sessions (id), 
	FOREIGN KEY(shelf_id) REFERENCES shelves (id), 
	FOREIGN KEY(product_id) REFERENCES products (id), 
	FOREIGN KEY(camera_id) REFERENCES cameras (id)
);

CREATE TABLE notifications (
	id SERIAL NOT NULL, 
	store_id INTEGER, 
	camera_id INTEGER, 
	shelf_id INTEGER, 
	product_id INTEGER, 
	notification_type notificationtypeenum NOT NULL, 
	severity notificationseverityenum, 
	message TEXT NOT NULL, 
	is_read INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(camera_id) REFERENCES cameras (id), 
	FOREIGN KEY(shelf_id) REFERENCES shelves (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE product_attractiveness_scores (
	id SERIAL NOT NULL, 
	product_id INTEGER NOT NULL, 
	period_start TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	period_end TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	attention_duration_score FLOAT, 
	interaction_frequency_score FLOAT, 
	pickup_rate_score FLOAT, 
	conversion_rate_score FLOAT, 
	repeat_engagement_score FLOAT, 
	total_score FLOAT, 
	computed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE recommendations (
	id SERIAL NOT NULL, 
	store_id INTEGER NOT NULL, 
	shelf_id INTEGER, 
	product_id INTEGER, 
	recommendation_type recommendationtypeenum NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	description TEXT NOT NULL, 
	confidence_score FLOAT, 
	is_dismissed INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(store_id) REFERENCES stores (id), 
	FOREIGN KEY(shelf_id) REFERENCES shelves (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE product_interactions (
	id SERIAL NOT NULL, 
	session_id INTEGER NOT NULL, 
	product_id INTEGER NOT NULL, 
	attention_event_id INTEGER, 
	interaction_type interactiontypeenum NOT NULL, 
	timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(session_id) REFERENCES shopper_sessions (id), 
	FOREIGN KEY(product_id) REFERENCES products (id), 
	FOREIGN KEY(attention_event_id) REFERENCES attention_events (id)
);
