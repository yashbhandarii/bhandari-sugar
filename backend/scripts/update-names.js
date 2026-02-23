const { Client } = require('pg');
require('dotenv').config();

async function updateNames() {
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

        // Update Driver
        await client.query("UPDATE users SET name = 'Driver Name' WHERE name = 'Raju Driver' OR role = 'driver'");
        console.log('Updated Driver name.');

        // Update Manager
        await client.query("UPDATE users SET name = 'Somnath Manager' WHERE name = 'Amit Manager' OR role = 'manager'");
        console.log('Updated Manager name.');

        console.log('--- Name Updates Complete ---');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

updateNames();
