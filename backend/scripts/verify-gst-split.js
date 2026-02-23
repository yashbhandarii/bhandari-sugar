const db = require('../db');
const billingService = require('../services/billing.service');

// Unique suffix for this run
const runId = Date.now().toString().slice(-6);

async function runTest() {
    console.log('--- STARTING GST SPLIT VERIFICATION ---');

    // Test Values
    const testData = {
        medium_bags: 10,
        super_small_bags: 5,
        medium_rate: 1050,
        super_small_rate: 1260,
        // Expected values (Inclusive Logic)
        expected: {
            inclusive_total: 16800.00, // (10*1050) + (5*1260)
            base_total: 16000.00,      // 16800 / 1.05
            gst_total: 800.0,         // 16800 - 16000
            sgst: 400.0,
            cgst: 400.0
        }
    };

    let sheetId, customerId, itemId;
    let client;

    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Create Test Customer with Unique ID
        const customerName = `GST_TEST_${runId}`;
        const customerMobile = `9${runId}999`; // Ensure 10 digits

        console.log(`Creating customer: ${customerName}`);
        const custRes = await client.query(`
            INSERT INTO customers (name, mobile) 
            VALUES ($1, $2) 
            RETURNING id
        `, [customerName, customerMobile]);
        customerId = custRes.rows[0].id;
        console.log(`Created Test Customer ID: ${customerId}`);

        // 2. Create Test Delivery Sheet
        const sheetRes = await client.query(`
            INSERT INTO delivery_sheets (date, truck_number, medium_rate, super_small_rate, status)
            VALUES (CURRENT_DATE, $1, $2, $3, 'submitted')
            RETURNING id
        `, [`TRUCK-${runId}`, testData.medium_rate, testData.super_small_rate]);
        sheetId = sheetRes.rows[0].id;
        console.log(`Created Test Delivery Sheet ID: ${sheetId}`);

        // 3. Create Test Delivery Item
        const itemRes = await client.query(`
            INSERT INTO delivery_items (delivery_sheet_id, customer_id, medium_bags, super_small_bags)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [sheetId, customerId, testData.medium_bags, testData.super_small_bags]);
        itemId = itemRes.rows[0].id;
        console.log(`Created Test Delivery Item ID: ${itemId}`);

        // Commit setup so service can see it in a new transaction
        await client.query('COMMIT');

        // 4. Generate Invoices
        console.log('Generating Invoices...');
        const result = await billingService.generateInvoices(sheetId, null); // null userId
        console.log(`Generation Result: ${result.message}`);

        // 5. Fetch and Verify Invoice
        const invRes = await client.query(`
            SELECT * FROM invoices WHERE delivery_sheet_id = $1 AND customer_id = $2
        `, [sheetId, customerId]);

        if (invRes.rows.length === 0) {
            throw new Error('Invoice not found!');
        }

        const invoice = invRes.rows[0];
        console.log('\n--- INVOICE DATA ---');
        console.log(`Subtotal: ${invoice.subtotal}`);
        console.log(`SGST: ${invoice.sgst_amount}`);
        console.log(`CGST: ${invoice.cgst_amount}`);
        console.log(`Total: ${invoice.total_amount}`);

        // Validation against Expected
        const actualTotal = parseFloat(invoice.total_amount);
        const actualBase = parseFloat(invoice.subtotal);
        const actualSGST = parseFloat(invoice.sgst_amount);
        const actualCGST = parseFloat(invoice.cgst_amount);

        console.log('\n--- VERIFICATION ---');
        console.log(`Expected Total: ${testData.expected.inclusive_total.toFixed(2)} | Actual: ${actualTotal.toFixed(2)}`);
        console.log(`Expected Base:  ${testData.expected.base_total.toFixed(2)} | Actual: ${actualBase.toFixed(2)}`);
        const totalTax = actualSGST + actualCGST;
        console.log(`Expected GST:   ${testData.expected.gst_total.toFixed(2)}  | Actual: ${totalTax.toFixed(2)}`);

        const totalDiff = Math.abs(actualTotal - testData.expected.inclusive_total);
        const baseDiff = Math.abs(actualBase - testData.expected.base_total);

        if (totalDiff < 0.05 && baseDiff < 0.05) {
            console.log('\n✅ PASS: GST Split Logic is Correct');
        } else {
            console.log('\n❌ FAIL: GST Split Logic is Incorrect');
            console.log(`Total Diff: ${totalDiff.toFixed(2)}, Base Diff: ${baseDiff.toFixed(2)}`);
        }

    } catch (error) {
        console.error('Error in test:', error);
        if (client) await client.query('ROLLBACK').catch(() => { });
    } finally {
        // Cleanup
        try {
            if (client) {
                // Determine if we need to clean up
                // If we committed, we need to clean up
                if (sheetId && customerId) {
                    await client.query('DELETE FROM invoices WHERE delivery_sheet_id = $1', [sheetId]);
                    await client.query('DELETE FROM delivery_items WHERE delivery_sheet_id = $1', [sheetId]);
                    await client.query('DELETE FROM delivery_sheets WHERE id = $1', [sheetId]);
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                    console.log('Cleanup complete.');
                }
            }
        } catch (e) {
            console.error('Cleanup failed:', e.message);
        }

        if (client) client.release();

        // Force exit
        setTimeout(() => process.exit(0), 100);
    }
}

runTest();
