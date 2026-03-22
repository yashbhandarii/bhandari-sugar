require('dotenv').config();
const db = require('../db');

async function main() {
    try {
        await db.query(`
            ALTER TABLE godown_invoices
            ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)
        `);

        await db.query(`
            ALTER TABLE godown_invoices
            ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(20)
        `);

        console.log('Added godown invoice customer_name/customer_mobile columns if missing.');
    } catch (error) {
        console.error('Failed to update godown_invoices schema:', error);
        process.exitCode = 1;
    } finally {
        await db.pool.end();
    }
}

main();
