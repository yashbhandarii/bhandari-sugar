const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setupGodownDb() {
    console.log('Starting godown database setup...');

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

        console.log('Creating godown_stock...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS godown_stock (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) UNIQUE NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Initialize the two categories required
        await client.query(`
            INSERT INTO godown_stock (category, quantity)
            VALUES ('Medium', 0), ('Super Small', 0)
            ON CONFLICT (category) DO NOTHING;
        `);

        console.log('Creating godown_invoices...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS godown_invoices (
                id SERIAL PRIMARY KEY,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id INTEGER REFERENCES customers(id),
                invoice_date DATE NOT NULL,
                base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Creating godown_invoice_items...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS godown_invoice_items (
                id SERIAL PRIMARY KEY,
                godown_invoice_id INTEGER REFERENCES godown_invoices(id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                bags INTEGER NOT NULL CHECK (bags >= 0),
                rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0)
            );
        `);

        console.log('Creating godown_payments...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS godown_payments (
                id SERIAL PRIMARY KEY,
                godown_invoice_id INTEGER REFERENCES godown_invoices(id) ON DELETE CASCADE,
                amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
                payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'cheque', 'bank')),
                payment_date DATE NOT NULL,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('Godown tables created successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating Godown tables:', err);
    } finally {
        await client.end();
    }
}

setupGodownDb();
