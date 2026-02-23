const db = require('../db');
const API_URL = 'http://localhost:5000/api';

async function request(method, url, data = null, token = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) options.body = JSON.stringify(data);

    // console.log(`Request: ${method} ${url}`, data);

    const res = await fetch(`${API_URL}${url}`, options);
    // We expect errors for duplicates, so return the raw response to check status
    return res;
}

async function runTest() {
    console.log("--- Starting Unique Customer Validation Test ---");

    const client = await db.pool.connect();
    let sheetId = null;
    let userId = null;
    let token = null;

    try {
        // 0. Login
        console.log("\n0. Logging in...");
        const loginResRaw = await request('POST', '/auth/login', {
            mobile: '9876543210',
            password: 'password123'
        });
        const loginRes = await loginResRaw.json();
        token = loginRes.token;
        userId = loginRes.user.id;
        console.log("   -> Logged in.");

        // 1. Create Delivery Sheet
        console.log("\n1. Creating Delivery Sheet...");
        const sheetResRaw = await request('POST', '/delivery-sheets', {
            truck_number: 'UNIQUE-TEST',
            driver_name: 'Test Driver',
            created_by: userId
        }, token);
        const sheetRes = await sheetResRaw.json();
        sheetId = sheetRes.id;
        console.log("   -> Sheet Created:", sheetRes);

        // 2. Fetch Customer
        const custRes = await client.query('SELECT id FROM customers LIMIT 1');
        const customerId = custRes.rows[0]?.id;
        if (!customerId) throw new Error("No customers found");

        // 3. Add Item (First time - Should Succeed)
        console.log(`\n3. Adding Customer ${customerId} (First Time)...`);
        const itemResRaw = await request('POST', '/delivery-items', {
            delivery_sheet_id: sheetId,
            customer_id: customerId,
            quantities: []
        }, token);

        if (itemResRaw.ok) {
            console.log("   -> Success (Expected)");
        } else {
            const txt = await itemResRaw.text();
            console.error("   -> FAILURE: Could not add first item.", txt);
        }

        // 4. Add Same Item (Second time - Should Fail with 400 or 500)
        console.log(`\n4. Adding Customer ${customerId} (Second Time) -> Expecting Failure...`);
        const dupResRaw = await request('POST', '/delivery-items', {
            delivery_sheet_id: sheetId,
            customer_id: customerId,
            quantities: []
        }, token);

        if (!dupResRaw.ok) {
            const txt = await dupResRaw.text();
            console.log(`   -> SUCCESS: API rejected duplicate. Status: ${dupResRaw.status}. Message: ${txt}`);
        } else {
            console.error("   -> FAILURE: API allowed duplicate insertion!");
        }

    } catch (error) {
        console.error("!!! TEST FAILED !!!", error);
    } finally {
        if (sheetId) {
            // Cleanup
            try {
                // We need to delete in order due to foreign keys
                console.log("\n--- Cleanup ---");
                await client.query("DELETE FROM delivery_quantities WHERE delivery_item_id IN (SELECT id FROM delivery_items WHERE delivery_sheet_id=$1)", [sheetId]);
                await client.query("DELETE FROM delivery_items WHERE delivery_sheet_id=$1", [sheetId]);
                await client.query("DELETE FROM delivery_sheets WHERE id=$1", [sheetId]);
            } catch (e) {
                console.error("Cleanup error (ignoring):", e.message);
            }
        }
        client.release();
        // Force exit to avoid hanging
        setTimeout(() => process.exit(0), 100);
    }
}

runTest();
