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
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='is_deleted') THEN
        ALTER TABLE customers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_sheets' AND column_name='is_deleted') THEN
        ALTER TABLE delivery_sheets ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='is_deleted') THEN
        ALTER TABLE invoices ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
