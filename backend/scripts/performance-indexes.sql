-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bhandari Sugar — Performance Indexes                       ║
-- ║  Run this in Supabase SQL Editor → paste & click "RUN"      ║
-- ║  Safe to run multiple times (IF NOT EXISTS)                  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ── Invoices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_created_at ON invoices(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_is_deleted ON invoices(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_invoices_sheet ON invoices(delivery_sheet_id);

-- ── Payments ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer_payment_date ON payments(customer_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ── Payment Adjustments ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_adjustments_invoice_id ON payment_adjustments(invoice_id);

-- ── Customers ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted) WHERE is_deleted = false;

-- ── Delivery Items ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_delivery_items_sheet ON delivery_items(delivery_sheet_id);
CREATE INDEX IF NOT EXISTS idx_delivery_items_customer ON delivery_items(customer_id);

-- ── Stock Movements ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stock_movements_category_type ON stock_movements(category, movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
