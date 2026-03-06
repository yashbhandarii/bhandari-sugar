-- ============================================================
-- BHANDARI SUGAR - FULL DATA RESET SCRIPT
-- Run this in the Supabase SQL Editor.
-- This DELETES all financial / operational data and resets
-- all auto-increment sequences to 1.
-- Users table is KEPT but all other tables are wiped.
-- After running this, the app will start completely fresh.
-- ============================================================

-- Disable FK checks temporarily via deferred constraints
BEGIN;

-- 1. Clear all financial / operational tables (order matters for FK)
TRUNCATE TABLE
    payment_adjustments,
    payments,
    invoices,
    billing_rates,
    delivery_quantities,
    delivery_items,
    delivery_sheets,
    stock_movements,
    audit_logs,
    financial_year_summary,
    financial_years,
    customers
RESTART IDENTITY CASCADE;

COMMIT;

-- ============================================================
-- After running the above, all records are gone.
-- The 'users' table is intentionally left intact so you can
-- still log in with your existing Owner / Manager / Driver
-- accounts.
-- ============================================================
