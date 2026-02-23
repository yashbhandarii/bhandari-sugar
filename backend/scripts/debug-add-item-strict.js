const deliveryService = require('../services/delivery.service');
const { Client } = require('pg');
require('dotenv').config();

async function runDebug() {
    console.log('Starting PRECISE debug of addItemInDeliverySheet...');

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

        // 1. Get Sheet ID (as String, simulating URL param)
        const sheetRes = await client.query("SELECT id FROM delivery_sheets WHERE status = 'draft' LIMIT 1");
        if (sheetRes.rows.length === 0) {
            const userRes = await client.query("SELECT id FROM users LIMIT 1");
            const userId = userRes.rows[0].id;
            const newSheet = await client.query("INSERT INTO delivery_sheets (truck_number, created_by, status, date) VALUES ('DEBUG-TRUCK', $1, 'draft', CURRENT_DATE) RETURNING id", [userId]);
            sheetId = newSheet.rows[0].id.toString();
        } else {
            sheetId = sheetRes.rows[0].id.toString();
        }

        // 2. Create Unique Customer for this test run
        const randomMobile = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const newCust = await client.query("INSERT INTO customers (name, mobile) VALUES ($1, $2) RETURNING id", ['Debug Frontend ' + randomMobile, randomMobile]);
        const customerId = newCust.rows[0].id.toString(); // Simulating Select value

        // 3. Get Category
        const catRes = await client.query("SELECT id FROM categories LIMIT 1");
        categoryId = catRes.rows[0].id; // Keep as int because frontend parseInts it? 
        // Frontend: category_id: parseInt(catId). So it is int.

        console.log(`Using Sheet: "${sheetId}" (string), Customer: "${customerId}" (string), Category: ${categoryId} (int)`);

        // 4. Call Service with String IDs
        const data = {
            delivery_sheet_id: sheetId,
            customer_id: customerId,
            quantities: [
                { category_id: categoryId, bags: 10 }
            ]
        };

        console.log('Calling addItemInDeliverySheet with:', data);
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
