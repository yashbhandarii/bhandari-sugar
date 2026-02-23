require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bhandari_sugar',
    password: process.env.DB_PASSWORD || '1133',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function check() {
    const client = await pool.connect();
    try {
        const fy = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'financial_years'");
        const cat = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'");

        console.log('FY Columns:', fy.rows.map(r => r.column_name).join(', '));
        console.log('Cat Columns:', cat.rows.map(r => r.column_name).join(', '));
    } finally {
        client.release();
        process.exit(0);
    }
}

check();
