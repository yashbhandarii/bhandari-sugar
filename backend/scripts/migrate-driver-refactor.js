const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    console.log('Starting migration to refactor delivery sheets...');

    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        await client.query('BEGIN');

        // 1. Remove rate columns from delivery_sheets
        console.log('Removing rate columns from delivery_sheets...');
        await client.query(`
            ALTER TABLE delivery_sheets 
            DROP COLUMN IF EXISTS medium_rate,
            DROP COLUMN IF EXISTS super_small_rate;
        `);

        // 2. Create billing_rates table
        console.log('Creating billing_rates table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_rates (
                id SERIAL PRIMARY KEY,
                delivery_sheet_id INTEGER REFERENCES delivery_sheets(id) ON DELETE CASCADE,
                medium_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                super_small_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Ensure status column checks include 'submitted' (if not already compatible)
        // PostgreSQL constraint modification is tricky, usually requires dropping and re-adding.
        // Assuming current constraint name is 'delivery_sheets_status_check' or similar auto-generated.
        // But since 'submitted' was already in the list in previous schema ('draft', 'submitted', 'billed'), 
        // we might not need to do anything if the list hasn't effectively changed.
        // The previous schema was: CHECK (status IN ('draft', 'submitted', 'billed'))
        // So no change needed for status constraint.

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
