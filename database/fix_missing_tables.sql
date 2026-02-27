-- Fix for missing tables and columns in Bhandari Sugar database

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    default_weight DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255),
    entity_id INTEGER,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Financial Years Table
CREATE TABLE IF NOT EXISTS financial_years (
    id SERIAL PRIMARY KEY,
    year_label VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_soft_locked BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMP,
    closed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Financial Year Summary Table
CREATE TABLE IF NOT EXISTS financial_year_summary (
    id SERIAL PRIMARY KEY,
    financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE CASCADE,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    total_discount DECIMAL(15, 2) DEFAULT 0.00,
    total_gst_collected DECIMAL(15, 2) DEFAULT 0.00,
    total_payments DECIMAL(15, 2) DEFAULT 0.00,
    total_pending DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add is_deleted column to existing tables if missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE delivery_sheets ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 5b. Add missing columns to delivery_sheets
ALTER TABLE delivery_sheets ADD COLUMN IF NOT EXISTS temp_id VARCHAR(255) UNIQUE;
ALTER TABLE delivery_sheets ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

-- 5c. Seed categories (must exist before delivery_quantities can ref them)
INSERT INTO categories (name, default_weight, is_active)
VALUES ('Medium', 50, true), ('Super Small', 50, true)
ON CONFLICT (name) DO NOTHING;

-- 5d. Delivery Sheet Rates Table (replaces old medium_rate/super_small_rate)
CREATE TABLE IF NOT EXISTS delivery_sheet_rates (
    id SERIAL PRIMARY KEY,
    delivery_sheet_id INTEGER REFERENCES delivery_sheets(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    UNIQUE(delivery_sheet_id, category_id)
);

-- 5e. Delivery Quantities Table (replaces old medium_bags/super_small_bags)
CREATE TABLE IF NOT EXISTS delivery_quantities (
    id SERIAL PRIMARY KEY,
    delivery_item_id INTEGER REFERENCES delivery_items(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    bags INTEGER NOT NULL DEFAULT 0,
    UNIQUE(delivery_item_id, category_id)
);

-- 5f. Remove old hardcoded category CHECK constraint from stock_movements
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_category_check;

-- 6. Create Godown Stock Table
CREATE TABLE IF NOT EXISTS godown_stock (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) UNIQUE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Seed: Initialize godown stock rows
INSERT INTO godown_stock (category, quantity)
VALUES ('Medium', 0), ('Super Small', 0)
ON CONFLICT (category) DO NOTHING;

-- 7. Create Godown Invoices Table
CREATE TABLE IF NOT EXISTS godown_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Godown Invoice Items Table
CREATE TABLE IF NOT EXISTS godown_invoice_items (
    id SERIAL PRIMARY KEY,
    godown_invoice_id INTEGER REFERENCES godown_invoices(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    bags INTEGER NOT NULL CHECK (bags >= 0),
    rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0)
);

-- 9. Create Godown Payments Table
CREATE TABLE IF NOT EXISTS godown_payments (
    id SERIAL PRIMARY KEY,
    godown_invoice_id INTEGER REFERENCES godown_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'cheque', 'bank')),
    payment_date DATE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
