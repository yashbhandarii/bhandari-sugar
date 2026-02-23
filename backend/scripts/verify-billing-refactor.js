const { createCustomer } = require('../services/customer.service');
const { createDeliverySheet, addItemInDeliverySheet, submitDeliverySheet } = require('../services/delivery.service');
const { generateInvoices } = require('../services/billing.service');
const db = require('../db');

const runVerification = async () => {
    console.log('Starting Billing Logic Refactor Verification...');
    const client = await db.pool.connect();

    try {
        // 1. SETUP: Create Customer
        const mobile = '9' + Math.floor(100000000 + Math.random() * 900000000);
        const customer = await createCustomer({ name: 'Billing Refactor Tester', mobile: mobile, address: 'Billing Test Address' });
        console.log('Customer Created:', customer.id);

        // 2. SETUP: Create Delivery Sheet
        console.log('Creating Delivery Sheet...');
        const truck = 'BILL-TEST-' + Math.floor(Math.random() * 10000);
        // Create with 0 rates initially to avoid potential constraints, then update
        const sheet = await createDeliverySheet({
            truck_number: truck,
            created_by: 1,
            medium_rate: 0,
            super_small_rate: 0
        });

        // Update rates to Test Case values: Medium=1000, Super Small=1200
        await client.query('UPDATE delivery_sheets SET medium_rate = 1000, super_small_rate = 1200 WHERE id = $1', [sheet.id]);

        // 3. SETUP: Add Items
        console.log('Adding Items (10 Medium, 5 Super Small)...');
        await addItemInDeliverySheet({
            delivery_sheet_id: sheet.id,
            customer_id: customer.id,
            medium_bags: 10,
            super_small_bags: 5
        });

        // 4. TEST: DUPLICATE BILLING (Negative Test)
        // Should FAIL because status is 'draft'
        console.log('Test 1: Generate Billing on DRAFT sheet (Should Fail)...');
        try {
            await generateInvoices(sheet.id, 1);
            console.error('❌ FAILED: Generated invoices for DRAFT sheet!');
            process.exit(1);
        } catch (error) {
            if (error.message.includes('must be submitted')) {
                console.log('✅ PASS: Blocked billing for DRAFT sheet.');
            } else {
                console.error('❌ FAILED: Unexpected error message:', error.message);
                process.exit(1);
            }
        }

        // 5. SETUP: Submit Sheet
        console.log('Submitting Sheet...');
        await submitDeliverySheet(sheet.id);

        // 6. TEST: SUCCESSFUL BILLING
        console.log('Test 2: Generate Billing on SUBMITTED sheet...');
        const billRes = await generateInvoices(sheet.id, 1);
        console.log('Generated Invoices:', billRes.invoice_ids);

        // 7. VERIFY MATH
        const invRes = await client.query('SELECT * FROM invoices WHERE id = $1', [billRes.invoice_ids[0]]);
        const inv = invRes.rows[0];

        // Expected:
        // Medium: 10 * 1000 = 10000
        // Super Small: 5 * 1200 = 6000
        // Subtotal: 16000
        // SGST: 16000 * 0.025 = 400
        // CGST: 16000 * 0.025 = 400
        // Total: 16800

        console.log('Verifying Math...');
        console.log(`Subtotal: ${inv.subtotal} (Expected: 16000)`);
        console.log(`SGST: ${inv.sgst_amount} (Expected: 400)`);
        console.log(`CGST: ${inv.cgst_amount} (Expected: 400)`);
        console.log(`Total: ${inv.total_amount} (Expected: 16800)`);

        if (Number(inv.subtotal) === 16000 &&
            Number(inv.sgst_amount) === 400 &&
            Number(inv.cgst_amount) === 400 &&
            Number(inv.total_amount) === 16800) {
            console.log('✅ PASS: Math Verification Successful.');
        } else {
            console.error('❌ FAILED: Math Verification Failed!');
            process.exit(1);
        }

        // 8. TEST: DUPLICATE BILLING (Negative Test)
        // Should FAIL because invoices already exist
        console.log('Test 3: Duplicate Billing check (Should Fail)...');
        try {
            await generateInvoices(sheet.id, 1);
            console.error('❌ FAILED: Allowed Duplicate Billing!');
            process.exit(1);
        } catch (error) {
            if (error.message.includes('Billing already generated')) {
                console.log('✅ PASS: Blocked Duplicate Billing.');
            } else {
                console.error('❌ FAILED: Unexpected error message:', error.message);
                process.exit(1);
            }
        }

        console.log('All Tests Passed Successfully! 🚀');

    } catch (error) {
        console.error('Verification Script Error:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

runVerification();
