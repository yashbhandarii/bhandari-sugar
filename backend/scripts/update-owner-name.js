const { Client } = require('pg');
require('dotenv').config();

async function updateOwnerName() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        const res = await client.query("UPDATE users SET name = 'Bhandari Owner' WHERE name = 'Suresh Owner' OR role = 'owner'");
        console.log(`Updated ${res.rowCount} rows.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

updateOwnerName();
