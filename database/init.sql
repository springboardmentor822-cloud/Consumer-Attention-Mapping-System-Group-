CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(160) NOT NULL,
    store_code VARCHAR(40) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    manager_name VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    camera_name VARCHAR(100) NOT NULL,
    camera_ip VARCHAR(80) NOT NULL,
    camera_location VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Online',
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS shelves (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shelf_name VARCHAR(120) NOT NULL,
    zone VARCHAR(80) NOT NULL,
    description TEXT,
    camera_id INTEGER REFERENCES cameras(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    shelf_id INTEGER NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
    product_name VARCHAR(160) NOT NULL,
    sku VARCHAR(80) UNIQUE NOT NULL,
    category VARCHAR(120) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    people_count INTEGER NOT NULL DEFAULT 0,
    attention_score DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stores_code ON stores(store_code);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
