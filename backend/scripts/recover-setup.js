require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bhandari_sugar',
    password: process.env.DB_PASSWORD || '1133',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function recover() {
    console.log('--- RESTORING SYSTEM SETUP DATA ---');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Seed Categories
        console.log('Seeding categories...');
        await client.query(`
            INSERT INTO categories (name, default_weight, is_active) 
            VALUES 
                ('medium', 50, true),
                ('super_small', 50, true)
            ON CONFLICT DO NOTHING
        `);

        // 2. Seed Financial Year
        console.log('Seeding financial year...');
        const today = new Date();
        const start = new Date(today.getFullYear(), 3, 1); // April 1st
        if (today < start) start.setFullYear(start.getFullYear() - 1);

        const end = new Date(start.getFullYear() + 1, 2, 31); // March 31st next year

        const yearLabel = `FY ${start.getFullYear()}-${end.getFullYear().toString().slice(-2)}`;

        await client.query(`
            INSERT INTO financial_years (year_label, start_date, end_date, is_closed)
            VALUES ($1, $2, $3, false)
            ON CONFLICT DO NOTHING
        `, [yearLabel, start, end]);

        await client.query('COMMIT');
        console.log(`SUCCESS: Restored categories and active year (${yearLabel}).`);
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('RECOVERY FAILED:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

recover();
