const db = require('../db');

async function migrate() {
    console.log('--- Starting Migration: Unique Customer per Delivery Sheet ---');
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check for existing duplicates and remove them (keeping the latest one)
        // This is crucial because adding a UNIQUE constraint will fail if duplicates exist.
        console.log('1. Cleaning up existing duplicates...');

        const cleanupQuery = `
            DELETE FROM delivery_items a USING delivery_items b
            WHERE a.id < b.id
            AND a.delivery_sheet_id = b.delivery_sheet_id
            AND a.customer_id = b.customer_id;
        `;
        const cleanupRes = await client.query(cleanupQuery);
        console.log(`   -> Removed ${cleanupRes.rowCount} duplicate entries.`);

        // 2. Add Unique Constraint
        console.log('2. Adding UNIQUE constraint...');
        await client.query(`
            ALTER TABLE delivery_items
            ADD CONSTRAINT unique_customer_per_sheet UNIQUE (delivery_sheet_id, customer_id);
        `);
        console.log('   -> Constraint added successfully.');

        await client.query('COMMIT');
        console.log('--- Migration Completed Successfully ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('!!! Migration Failed !!!', error);
        // Don't exit with error code if constraint already exists to allow re-runs
        if (error.code === '42710') { // duplicate_object
            console.log('   -> Constraint already exists. Skipping.');
        } else {
            process.exit(1);
        }
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
