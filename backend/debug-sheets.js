const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    await client.connect();

    console.log('--- ALL SHEETS ---');
    const res = await client.query('SELECT id, truck_number, created_by, is_deleted, date FROM delivery_sheets ORDER BY id');
    console.table(res.rows);

    console.log('\n--- ALL USERS ---');
    const uRes = await client.query('SELECT id, name, mobile, role FROM users ORDER BY id');
    console.table(uRes.rows);

    await client.end();
}
check();
