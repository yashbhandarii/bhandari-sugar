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

    const sheets = await client.query('SELECT id, truck_number, created_by, is_deleted, date FROM delivery_sheets ORDER BY id');
    const users = await client.query('SELECT id, name, mobile, role FROM users ORDER BY id');

    console.log('DATA_START');
    console.log(JSON.stringify({ sheets: sheets.rows, users: users.rows }));
    console.log('DATA_END');

    await client.end();
}
check().catch(e => console.error(e));
