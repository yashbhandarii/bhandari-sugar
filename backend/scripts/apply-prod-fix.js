const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbPassword = process.argv[2];
if (!dbPassword) {
    console.error('❌ Usage: node backend/scripts/apply-prod-fix.js <DB_PASSWORD>');
    process.exit(1);
}

// Encode the password for safe inclusion in the URL
const encodedPassword = encodeURIComponent(dbPassword);

// Use the Supabase connection pooler (AWS AP-South region via Transaction Pooler - port 6543)
// and also try the session pooler
const connectionString = `postgresql://postgres:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function applyProdFix() {
    console.log('--- APPLYING PRODUCTION DATABASE FIXES ---');
    const fixSqlPath = path.join(__dirname, '../../database/fix_missing_tables.sql');

    let client;
    try {
        console.log('Connecting to production database via pooler...');
        client = await pool.connect();
        console.log('SUCCESS: Connected to production database.');

        const sql = fs.readFileSync(fixSqlPath, 'utf8');
        console.log('Executing fix_missing_tables.sql on PRODUCTION...');
        await client.query(sql);
        console.log('SUCCESS: Production tables and columns created.');

        // Seed Financial Year
        console.log('Seeding production financial year...');
        const today = new Date();
        const start = new Date(today.getFullYear(), 3, 1); // April 1st
        if (today < start) start.setFullYear(start.getFullYear() - 1);
        const end = new Date(start.getFullYear() + 1, 2, 31); // March 31st next year
        const yearLabel = `FY ${start.getFullYear()}-${end.getFullYear().toString().slice(-2)}`;

        await client.query(`
            INSERT INTO financial_years (year_label, start_date, end_date, is_closed)
            VALUES ($1, $2, $3, false)
            ON CONFLICT (year_label) DO NOTHING
        `, [yearLabel, start, end]);

        // Seed Categories
        console.log('Seeding production categories...');
        await client.query(`
            INSERT INTO categories (name, default_weight, is_active) 
            VALUES 
                ('medium', 50, true),
                ('super_small', 50, true)
            ON CONFLICT (name) DO NOTHING
        `);

        console.log(`✅ PRODUCTION RECOVERY COMPLETE. Active Year: ${yearLabel}`);

    } catch (err) {
        console.error('PRODUCTION FIX FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        if (client) client.release();
        await pool.end();
        process.exit(0);
    }
}

applyProdFix();
