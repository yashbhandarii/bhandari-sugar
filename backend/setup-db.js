const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaPath = path.join(__dirname, '../database/schema.sql');

async function setupDatabase() {
    console.log('Starting database setup...');

    // 1. Connect to 'postgres' system database to create our app database
    const sysClient = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', // Connect to default DB
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await sysClient.connect();
        console.log('Connected to system database.');

        // Check if database exists
        const res = await sysClient.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rows.length === 0) {
            console.log(`Creating database "${process.env.DB_NAME}"...`);
            await sysClient.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log('Database created successfully.');
        } else {
            console.log(`Database "${process.env.DB_NAME}" already exists.`);
        }

        await sysClient.end();

        // 2. Connect to the App Database to run schema
        const appClient = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        await appClient.connect();
        console.log(`Connected to "${process.env.DB_NAME}" database.`);

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema.sql...');
        await appClient.query(schemaSql);
        console.log('Schema executed successfully! Tables created.');

        await appClient.end();

    } catch (err) {
        console.error('Error during setup:', err);
        console.log('\n--> TIP: Make sure your PostgreSQL server is running and credentials in .env are correct.');
    }
}

setupDatabase();
