-- ============================================
-- Enable Row Level Security (RLS) on ALL tables
-- ============================================
-- Your Express backend uses a direct PostgreSQL connection (pg Pool),
-- which connects as the 'postgres' role. The 'postgres' role is a
-- superuser and BYPASSES RLS entirely, so this will NOT affect your backend.
--
-- This WILL block unauthorized access via Supabase's PostgREST API
-- (anon/authenticated keys), which is what the Security Advisor flags.
-- ============================================

-- Core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Billing & Payments
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_adjustments ENABLE ROW LEVEL SECURITY;

-- Delivery
ALTER TABLE public.delivery_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_sheet_rates ENABLE ROW LEVEL SECURITY;

-- Godown / Inventory
ALTER TABLE public.godown_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.godown_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.godown_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.godown_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Financial & Audit
ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_year_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify: List all tables and their RLS status
-- ============================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
