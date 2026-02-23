const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../db');

const updateSchema = async () => {
    const client = await pool.pool.connect();
    try {
        console.log('Starting schema update for Step 5...');

        await client.query('BEGIN');

        // 1. Create audit_logs table
        console.log('Creating audit_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(255),
                entity_id INTEGER,
                details JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add is_deleted column to tables
        const tables = ['customers', 'delivery_sheets', 'invoices'];
        for (const table of tables) {
            console.log(`Checking/Adding is_deleted column to ${table}...`);
            // Check if column exists
            const checkRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'is_deleted';
            `, [table]);

            if (checkRes.rowCount === 0) {
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN is_deleted BOOLEAN DEFAULT false;
                `);
                console.log(`Added is_deleted to ${table}.`);
            } else {
                console.log(`is_deleted already exists in ${table}.`);
            }
        }

        await client.query('COMMIT');
        console.log('Schema update completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Schema update failed:', error);
    } finally {
        client.release();
        pool.pool.end();
    }
};

updateSchema();
