-- Database initialization script
-- This script creates the necessary tables and initial data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create grocery items table
CREATE TABLE IF NOT EXISTS grocery_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    store VARCHAR(255),
    category VARCHAR(100),
    notes TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category ON grocery_items(category);
CREATE INDEX IF NOT EXISTS idx_grocery_items_is_purchased ON grocery_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grocery_items_updated_at ON grocery_items;
CREATE TRIGGER update_grocery_items_updated_at
    BEFORE UPDATE ON grocery_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample categories for reference
CREATE TABLE IF NOT EXISTS grocery_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO grocery_categories (name) VALUES
    ('Fruits & Vegetables'),
    ('Meat & Seafood'),
    ('Dairy & Eggs'),
    ('Bakery'),
    ('Pantry'),
    ('Frozen'),
    ('Beverages'),
    ('Snacks'),
    ('Health & Beauty'),
    ('Household')
ON CONFLICT (name) DO NOTHING;