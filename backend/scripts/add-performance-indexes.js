/**
 * Performance Indexes Script
 * ============================================
 * Adds ALL missing indexes for optimal query performance.
 * Safe to run multiple times (uses IF NOT EXISTS).
 * 
 * Includes indexes from previous scripts PLUS new ones
 * for: invoices.customer_id, invoices.is_deleted,
 *       payments(method+date), payment_adjustments, customers.is_deleted
 * 
 * Run: node scripts/add-performance-indexes.js
 */

const db = require('../db');

async function addPerformanceIndexes() {
    const indexes = [
        // ── Invoices ──────────────────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);',
            desc: 'Invoices → customer_id (JOIN/WHERE lookups)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);',
            desc: 'Invoices → created_at (date range filters)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_customer_created_at ON invoices(customer_id, created_at);',
            desc: 'Invoices → customer + date (composite for reports)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_is_deleted ON invoices(is_deleted) WHERE is_deleted = false;',
            desc: 'Invoices → partial index on non-deleted rows'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_sheet ON invoices(delivery_sheet_id);',
            desc: 'Invoices → delivery_sheet_id (billing lookups)'
        },

        // ── Payments ──────────────────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);',
            desc: 'Payments → customer_id'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);',
            desc: 'Payments → payment_date'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_customer_payment_date ON payments(customer_id, payment_date);',
            desc: 'Payments → customer + date (composite)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method, payment_date);',
            desc: 'Payments → method + date (cash collection report)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);',
            desc: 'Payments → invoice_id'
        },

        // ── Payment Adjustments ───────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_payment_adjustments_invoice_id ON payment_adjustments(invoice_id);',
            desc: 'Payment Adjustments → invoice_id (JOIN for pending calc)'
        },

        // ── Customers ─────────────────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);',
            desc: 'Customers → name (ORDER BY / search)'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted) WHERE is_deleted = false;',
            desc: 'Customers → partial index on active customers'
        },

        // ── Delivery Items ────────────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_delivery_items_sheet ON delivery_items(delivery_sheet_id);',
            desc: 'Delivery Items → sheet_id'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_delivery_items_customer ON delivery_items(customer_id);',
            desc: 'Delivery Items → customer_id'
        },

        // ── Stock Movements ───────────────────────────────
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_stock_movements_category_type ON stock_movements(category, movement_type);',
            desc: 'Stock Movements → category + type'
        },
        {
            sql: 'CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);',
            desc: 'Stock Movements → reference lookup'
        },
    ];

    console.log('╔══════════════════════════════════════════╗');
    console.log('║   Adding Performance Indexes             ║');
    console.log('╚══════════════════════════════════════════╝\n');

    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const idx of indexes) {
        try {
            await db.query(idx.sql);
            console.log(`  ✅ ${idx.desc}`);
            success++;
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ⏭️  ${idx.desc} (already exists)`);
                skipped++;
            } else {
                console.log(`  ❌ ${idx.desc}`);
                console.log(`     Error: ${error.message}`);
                failed++;
            }
        }
    }

    console.log(`\n── Summary ────────────────────────────────`);
    console.log(`  ✅ Created: ${success}`);
    console.log(`  ⏭️  Already existed: ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Total: ${indexes.length}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

addPerformanceIndexes();
