const { createCustomer, deleteCustomer } = require('../services/customer.service');
const { logAction } = require('../services/audit.service');
const { createDeliverySheet, deleteDeliverySheet, addItemInDeliverySheet, submitDeliverySheet } = require('../services/delivery.service');
const { generateInvoices } = require('../services/billing.service');
const db = require('../db');

const runVerification = async () => {
    console.log('Starting Verification...');
    const client = await db.pool.connect();

    try {
        // 1. Create a Test Customer
        console.log('Creating Test Customer...');
        const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000);
        const customer = await createCustomer({ name: 'Backup Test Customer', mobile: randomMobile, address: 'Test Address' });
        console.log('Customer Created:', customer.id);

        // 2. Create a Test Delivery Sheet
        console.log('Creating Test Delivery Sheet...');
        const randomTruck = 'TEST-' + Math.floor(Math.random() * 10000);
        const sheet = await createDeliverySheet({ truck_number: randomTruck, created_by: 1 });
        console.log('Delivery Sheet Created:', sheet.id);

        // 3. Verify Soft Delete on Customer
        console.log('Deleting Customer (Soft Delete)...');
        // Passing userId=1 for audit log
        await deleteCustomer(customer.id, 1);

        // Verify is_deleted = true
        const custCheck = await client.query('SELECT is_deleted FROM customers WHERE id = $1', [customer.id]);
        if (custCheck.rows[0].is_deleted === true) {
            console.log('Customer Soft Delete Verified: is_deleted = true');
        } else {
            console.error('Customer Soft Delete Failed!');
        }

        // 2.5 Add Items, Submit, and Verify Billing (Fix Verification)
        console.log('Adding Items to Delivery Sheet...');
        // Need to update rates first as created with 0
        await db.query('UPDATE delivery_sheets SET medium_rate = $1, super_small_rate = $2 WHERE id = $3', [1000, 2000, sheet.id]);

        await addItemInDeliverySheet({ delivery_sheet_id: sheet.id, customer_id: customer.id, medium_bags: 10, super_small_bags: 5 });

        console.log('Submitting Delivery Sheet...');
        await submitDeliverySheet(sheet.id);

        console.log('Generating Invoices...');
        const billingRes = await generateInvoices(sheet.id, 1);
        console.log('Invoices Generated:', billingRes.invoice_ids);

        if (billingRes.invoice_ids.length > 0) {
            console.log('Billing Logic Verified: Invoices generated successfully ✅');
        } else {
            console.error('Billing Logic Failed: No invoices generated ❌');
            process.exit(1);
        }

        // 4. Verify Soft Delete on Delivery Sheet
        console.log('Deleting Delivery Sheet (Soft Delete)...');
        await deleteDeliverySheet(sheet.id, 1);

        const sheetCheck = await client.query('SELECT is_deleted FROM delivery_sheets WHERE id = $1', [sheet.id]);
        if (sheetCheck.rows[0].is_deleted === true) {
            console.log('Delivery Sheet Soft Delete Verified: is_deleted = true');
        } else {
            console.error('Delivery Sheet Soft Delete Failed!');
        }

        // 5. Verify Audit Logs
        console.log('Checking Audit Logs...');
        const logs = await client.query('SELECT * FROM audit_logs WHERE entity_id IN ($1, $2) ORDER BY timestamp DESC', [customer.id, sheet.id]);
        if (logs.rows.length >= 2) {
            console.log(`Audit Logs Verified: Found ${logs.rows.length} entries.`);
            logs.rows.forEach(log => console.log(`- ${log.action} on ${log.entity_type} ${log.entity_id}`));
        } else {
            console.error('Audit Logs Missing!');
        }

        console.log('Verification Completed Successfully.');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

runVerification();
