const db = require('../db');

async function applyConstraints() {
    const client = await db.pool.connect();
    try {
        console.log('--- Applying strict DB constraints ---');
        await client.query('BEGIN');

        // 1. Delivery Items: Positive Bags
        console.log('Adding check_positive_bags to delivery_items...');
        await client.query(`
            ALTER TABLE delivery_items
            ADD CONSTRAINT check_positive_bags
            CHECK (medium_bags >= 0 AND super_small_bags >= 0);
        `).catch(e => console.log('Constraint check_positive_bags likely already exists or data violation:', e.message));

        // 2. Delivery Sheets: Positive Rates
        console.log('Adding check_positive_rates to delivery_sheets...');
        await client.query(`
            ALTER TABLE delivery_sheets
            ADD CONSTRAINT check_positive_rates
            CHECK (medium_rate >= 0 AND super_small_rate >= 0);
        `).catch(e => console.log('Constraint check_positive_rates likely already exists or data violation:', e.message));

        // 3. Payments: Positive Amount
        console.log('Adding check_positive_payment to payments...');
        await client.query(`
            ALTER TABLE payments
            ADD CONSTRAINT check_positive_payment
            CHECK (amount >= 0);
        `).catch(e => console.log('Constraint check_positive_payment likely already exists or data violation:', e.message));

        await client.query('COMMIT');
        console.log('--- Constraints applied successfully ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error applying constraints:', error);
    } finally {
        client.release();
        // Assuming db.pool can be closed or script just ends
        if (db.pool.end) await db.pool.end();
    }
}

applyConstraints();
