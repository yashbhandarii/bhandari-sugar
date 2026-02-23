-- Enable UUID extension if needed, though serial/integer IDs are fine for this scale.
-- Using SERIAL for auto-incrementing IDs as per standard practice.

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'manager', 'owner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Sheets Table
-- One truck = One delivery sheet.
-- Rates are stored here as they change weekly.
CREATE TABLE delivery_sheets (
    id SERIAL PRIMARY KEY,
    truck_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'billed')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing Rates Table
-- Stores rates for a specific delivery sheet, entered by Manager during billing.
CREATE TABLE billing_rates (
    id SERIAL PRIMARY KEY,
    delivery_sheet_id INTEGER REFERENCES delivery_sheets(id) ON DELETE CASCADE,
    medium_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    super_small_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Items Table
-- Links a delivery sheet to specific customers and bag counts.
CREATE TABLE delivery_items (
    id SERIAL PRIMARY KEY,
    delivery_sheet_id INTEGER REFERENCES delivery_sheets(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id),
    medium_bags INTEGER NOT NULL DEFAULT 0,
    super_small_bags INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
-- Calculated from delivery sheet data.
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    delivery_sheet_id INTEGER REFERENCES delivery_sheets(id),
    customer_id INTEGER REFERENCES customers(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    sgst_amount DECIMAL(12, 2) NOT NULL, -- 2.5%
    cgst_amount DECIMAL(12, 2) NOT NULL, -- 2.5%
    expense_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_type VARCHAR(50) DEFAULT NULL CHECK (discount_type IN ('percentage', 'fixed', NULL)),
    discount_value DECIMAL(10, 2) DEFAULT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
-- Tracks payments against invoices.
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    customer_id INTEGER REFERENCES customers(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'cheque', 'bank')),
    payment_date DATE DEFAULT CURRENT_DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Adjustments Table
-- Tracks discounts given at the payment stage.
CREATE TABLE payment_adjustments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL DEFAULT 'discount',
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements Table
-- Tracks inventory changes.
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('medium', 'super_small')),
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('factory_in', 'delivery_out', 'godown_in')),
    bags INTEGER NOT NULL,
    reference_type VARCHAR(50), -- e.g., 'delivery_sheet', 'purchase'
    reference_id INTEGER, -- ID of the related record
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_delivery_sheets_date ON delivery_sheets(date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_customer_created_at ON invoices(customer_id, created_at);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_customer_payment_date ON payments(customer_id, payment_date);
CREATE INDEX idx_payment_adjustments_invoice ON payment_adjustments(invoice_id);
