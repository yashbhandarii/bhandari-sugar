const deliveryService = require('../services/delivery.service');
const { Client } = require('pg');
require('dotenv').config();

async function runDebug() {
    console.log('Starting debug of addItemInDeliverySheet WITH QUANTITIES...');

    // Connect to DB directly to fetch supporting IDs
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();

        let sheetId, categoryId;

        // 1. Get/Create Sheet
        const sheetRes = await client.query("SELECT id FROM delivery_sheets WHERE status = 'draft' LIMIT 1");
        if (sheetRes.rows.length === 0) {
            const userRes = await client.query("SELECT id FROM users LIMIT 1");
            const userId = userRes.rows[0].id;
            const newSheet = await client.query("INSERT INTO delivery_sheets (truck_number, created_by, status, date) VALUES ('DEBUG-TRUCK', $1, 'draft', CURRENT_DATE) RETURNING id", [userId]);
            sheetId = newSheet.rows[0].id;
        } else {
            sheetId = sheetRes.rows[0].id;
        }

        // 2. Create Unique Customer for this test run
        const randomMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const newCust = await client.query("INSERT INTO customers (name, mobile) VALUES ($1, $2) RETURNING id", ['Debug Customer ' + randomMobile, randomMobile]);
        const customerId = newCust.rows[0].id;

        // 3. Get Category
        const catRes = await client.query("SELECT id FROM categories LIMIT 1");
        if (catRes.rows.length === 0) throw new Error('No categories found');
        categoryId = catRes.rows[0].id;

        console.log(`Using Sheet: ${sheetId}, New Customer: ${customerId}, Category: ${categoryId}`);

        // 4. Call Service
        const data = {
            delivery_sheet_id: sheetId,
            customer_id: customerId,
            quantities: [
                { category_id: categoryId, bags: 10 }
            ]
        };

        console.log('Calling addItemInDeliverySheet with:', JSON.stringify(data));
        const result = await deliveryService.addItemInDeliverySheet(data);
        console.log('Success:', result);

    } catch (err) {
        console.error('CAUCHT ERROR:', err);
    } finally {
        await client.end();
        process.exit();
    }
}

runDebug();
