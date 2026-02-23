const { Client } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path to .env if needed

async function addIndexes() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        console.log('Connected to database for indexing...');

        const queries = [
            // Delivery Items
            'CREATE INDEX IF NOT EXISTS idx_delivery_items_sheet ON delivery_items(delivery_sheet_id)',
            'CREATE INDEX IF NOT EXISTS idx_delivery_items_customer ON delivery_items(customer_id)',

            // Invoices
            'CREATE INDEX IF NOT EXISTS idx_invoices_sheet ON invoices(delivery_sheet_id)',
            'CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)',

            // Payments
            'CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)',
            'CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id)',

            // Stock Movements
            'CREATE INDEX IF NOT EXISTS idx_stock_movements_category_type ON stock_movements(category, movement_type)',
            'CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id)',

            // Customers
            'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)'
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await client.query(query);
        }

        console.log('All indexes added successfully.');

    } catch (err) {
        console.error('Error adding indexes:', err);
    } finally {
        await client.end();
    }
}

addIndexes();
