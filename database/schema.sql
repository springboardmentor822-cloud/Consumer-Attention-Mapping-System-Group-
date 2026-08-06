-- Create database
CREATE DATABASE attention_db;

\c attention_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'store_manager',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    address TEXT,
    store_type VARCHAR(50) DEFAULT 'retail',
    total_area_sqft FLOAT,
    layout_type VARCHAR(50) DEFAULT 'grid',
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shelves Table with physical coordinates
CREATE TABLE IF NOT EXISTS shelves (
    id SERIAL PRIMARY KEY,
    shelf_id VARCHAR(50) NOT NULL UNIQUE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shelf_number VARCHAR(20),
    section VARCHAR(50),
    aisle VARCHAR(20),
    shelf_type VARCHAR(50) DEFAULT 'gondola',
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width FLOAT NOT NULL,
    height FLOAT NOT NULL,
    levels INTEGER DEFAULT 4,
    level_heights JSONB DEFAULT '[]',
    product_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL UNIQUE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    camera_type VARCHAR(50) DEFAULT 'fixed',
    camera_url VARCHAR(500),
    stream_url VARCHAR(500),
    position_x FLOAT,
    position_y FLOAT,
    height FLOAT,
    angle FLOAT,
    calibration_params JSONB DEFAULT '{}',
    zones TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    fps INTEGER DEFAULT 5,
    resolution VARCHAR(20) DEFAULT '640x480',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    price FLOAT,
    shelf_id INTEGER REFERENCES shelves(id) ON DELETE SET NULL,
    shelf_level INTEGER,
    position_x FLOAT,
    position_y FLOAT,
    product_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role) 
VALUES ('admin', 'admin@system.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'admin');

-- Insert sample store
INSERT INTO stores (store_id, name, location, address, store_type, total_area_sqft, layout_type, manager_id)
VALUES ('STORE001', 'Main Street Market', 'Downtown', '123 Main St, City', 'supermarket', 5000, 'grid', 1);

-- Insert sample shelf
INSERT INTO shelves (shelf_id, store_id, shelf_number, section, aisle, position_x, position_y, width, height, levels)
VALUES ('SHELF001', 1, 'A1', 'Produce', 'Aisle 1', 10, 20, 8, 6, 4);

-- Insert sample camera
INSERT INTO cameras (camera_id, store_id, name, camera_type, camera_url, fps, resolution, position_x, position_y)
VALUES ('CAM001', 1, 'Entrance Camera', 'fixed', 'rtsp://localhost:8554/stream', 5, '640x480', 0, 0);