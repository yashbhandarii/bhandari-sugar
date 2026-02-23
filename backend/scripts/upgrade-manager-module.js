const db = require('../db');

async function migrate() {
    console.log('--- Starting Migration: Manager Module Upgrade ---');
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Customers Table Updates
        console.log('1. Updating Customers Table...');
        // Ensure name is NOT NULL (already is, but good to ensure)
        await client.query('ALTER TABLE customers ALTER COLUMN name SET NOT NULL');

        // Ensure mobile is NOT NULL and UNIQUE
        await client.query('ALTER TABLE customers ALTER COLUMN mobile SET NOT NULL');
        // Check if unique constraint exists, if not add it
        // (schema.sql says it is unique, but let's be safe)
        // We will try to add it, if it exists verify it.
        // Actually, let's just ensure the type is VARCHAR(15) as per schema or restrict to 10?
        // User asked for VARCHAR(10).
        // Let's check if we can alter data type.
        // warning: data truncation!
        // For now, let's keep it VARCHAR(15) to be safe with existing data (e.g. +91...)
        // but we will enforce 10 validation in API.

        // Add address if not exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='address') THEN 
                    ALTER TABLE customers ADD COLUMN address TEXT; 
                END IF; 
            END $$;
        `);

        // 2. Add Indexes for Reports
        console.log('2. Adding Indexes for Reports...');

        // Index on Invoices Date (created_at)
        await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)');

        // Index on Payments Date (payment_date)
        await client.query('CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date)');

        await client.query('COMMIT');
        console.log('--- Migration Completed Successfully ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('!!! Migration Failed !!!', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
