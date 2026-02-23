/**
 * Add Advanced Reporting Indices
 * Adds performance indices for the advanced reporting system
 */

const db = require('../db');

async function addReportingIndices() {
    try {
        console.log('Adding advanced reporting indices...\n');

        const indices = [
            {
                name: 'idx_invoices_created_at',
                sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);',
                description: 'Index for invoice creation date lookups'
            },
            {
                name: 'idx_invoices_customer_created_at',
                sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_customer_created_at ON invoices(customer_id, created_at);',
                description: 'Composite index for customer + date queries'
            },
            {
                name: 'idx_payments_payment_date',
                sql: 'CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);',
                description: 'Index for payment date lookups'
            },
            {
                name: 'idx_payments_customer_id',
                sql: 'CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);',
                description: 'Index for customer payment lookups'
            },
            {
                name: 'idx_payments_customer_payment_date',
                sql: 'CREATE INDEX IF NOT EXISTS idx_payments_customer_payment_date ON payments(customer_id, payment_date);',
                description: 'Composite index for customer + date payment queries'
            }
        ];

        for (const idx of indices) {
            try {
                await db.query(idx.sql);
                console.log(`✓ ${idx.name}`);
                console.log(`  ${idx.description}\n`);
            } catch (error) {
                // Index might already exist, which is fine
                if (error.message.includes('already exists')) {
                    console.log(`✓ ${idx.name} (already exists)\n`);
                } else {
                    console.error(`✗ ${idx.name}`);
                    console.error(`  Error: ${error.message}\n`);
                }
            }
        }

        console.log('\n✓ All indices added successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    addReportingIndices();
}

module.exports = { addReportingIndices };
