const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');

const updateSchema = async () => {
    const client = await pool.pool.connect();
    try {
        console.log('Starting schema update for discount feature...');

        await client.query('BEGIN');

        // Add discount columns to invoices table
        console.log('Checking/Adding discount columns to invoices table...');

        // Check if discount_type column exists
        const checkDiscountType = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'invoices' AND column_name = 'discount_type';
        `);

        if (checkDiscountType.rowCount === 0) {
            await client.query(`
                ALTER TABLE invoices
                ADD COLUMN discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'fixed', NULL));
            `);
            console.log('Added discount_type column to invoices.');
        } else {
            console.log('discount_type already exists in invoices.');
        }

        // Check if discount_value column exists
        const checkDiscountValue = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'invoices' AND column_name = 'discount_value';
        `);

        if (checkDiscountValue.rowCount === 0) {
            await client.query(`
                ALTER TABLE invoices
                ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT NULL;
            `);
            console.log('Added discount_value column to invoices.');
        } else {
            console.log('discount_value already exists in invoices.');
        }

        // Check if discount_amount column exists
        const checkDiscountAmount = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'invoices' AND column_name = 'discount_amount';
        `);

        if (checkDiscountAmount.rowCount === 0) {
            await client.query(`
                ALTER TABLE invoices
                ADD COLUMN discount_amount DECIMAL(12, 2) DEFAULT 0.00;
            `);
            console.log('Added discount_amount column to invoices.');
        } else {
            console.log('discount_amount already exists in invoices.');
        }

        // Add constraint: discount_amount cannot exceed total_amount (enforce at application level with validation)
        console.log('Schema validation will be enforced at the application level.');

        await client.query('COMMIT');
        console.log('\n✅ Schema update completed successfully!');
        console.log('\nNew columns added to invoices table:');
        console.log('  - discount_type: VARCHAR(50) - "percentage", "fixed", or NULL');
        console.log('  - discount_value: DECIMAL(10, 2) - The percentage (0-100) or fixed amount');
        console.log('  - discount_amount: DECIMAL(12, 2) - Calculated discount amount');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Schema update failed:', error);
        process.exit(1);
    } finally {
        client.release();
        pool.pool.end();
    }
};

updateSchema();
