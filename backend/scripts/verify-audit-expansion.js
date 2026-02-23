const { addPayment } = require('../services/payment.service');
const { generateInvoices } = require('../services/billing.service');
const { createCustomer } = require('../services/customer.service');
const { createDeliverySheet, addItemInDeliverySheet, submitDeliverySheet } = require('../services/delivery.service');
const db = require('../db');

const runVerification = async () => {
    console.log('Starting Audit Expansion Verification...');
    const client = await db.pool.connect();

    try {
        const mobileNum = '9999999999'; // Test mobile
        const userCheck = await client.query("SELECT id FROM users WHERE mobile = $1", [mobileNum]);
        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0].id;
            console.log('Using existing Audit Tester:', userId);
        } else {
            // Include username if it exists or just use mobile as name if schema allows?
            // Assuming username might be required or name is used.
            // Let's safe-bet and include username if table was created with it.
            // But auth.service didn't show username. 
            // Let's assume 'username' column exists and is NOT NULL if the previous error was constraint.
            // Or maybe 'name' is NOT NULL.
            // I'll insert BOTH name and username if possible, or just standard fields.
            // create-test-user.js will reveal the schema.
            // Update: I will wait for view_file result before applying this replacement.
            // Logic placeholder:
            const authRes = await client.query("INSERT INTO users (name, mobile, password, role) VALUES ('Audit Tester', $1, 'password', 'owner') RETURNING id", [mobileNum]);
            userId = authRes.rows[0].id;
            console.log('Created Audit Tester:', userId);
        }

        // 1. Create Data for Invoice Generation
        console.log('Creating Customer...');
        // Unique mobile to avoid duplicates on re-run
        const mobile = '9' + Math.floor(100000000 + Math.random() * 900000000); // Ensure 9 digits + '9' = 10 digits
        const customer = await createCustomer({ name: 'Audit Test Customer', mobile: mobile, address: 'Audit Address' });

        console.log('Creating Delivery Sheet...');
        const sheet = await createDeliverySheet({ truck_number: 'TEST-' + Math.floor(Math.random() * 10000), created_by: userId, medium_rate: 0, super_small_rate: 0 });

        // Update rates manually because passing them during creation might be causing check violation (unconfirmed why, but verify-step5 works without them)
        const client2 = await db.pool.connect();
        await client2.query('UPDATE delivery_sheets SET medium_rate = $1, super_small_rate = $2 WHERE id = $3', [1000, 2000, sheet.id]);
        client2.release();
        await addItemInDeliverySheet({ delivery_sheet_id: sheet.id, customer_id: customer.id, medium_bags: 10, super_small_bags: 5 });

        console.log('Submitting Sheet...');
        await submitDeliverySheet(sheet.id);

        // 2. Generate Invoices
        console.log('Generating Invoices (Audit Check)...');
        const invResult = await generateInvoices(sheet.id, userId);
        console.log('Invoices Generated:', invResult.invoice_ids);

        // Verify GENERATE_INVOICES Audit
        const genLog = await client.query('SELECT * FROM audit_logs WHERE action = $1 AND entity_id = $2', ['GENERATE_INVOICES', sheet.id]);
        if (genLog.rows.length > 0) {
            console.log('GENERATE_INVOICES Audit Verified ✅');
        } else {
            console.error('GENERATE_INVOICES Audit Failed ❌');
            process.exit(1);
        }

        // 3. Add Payment
        if (invResult.invoice_ids.length > 0) {
            const invoiceId = invResult.invoice_ids[0];
            console.log('Adding Payment (Audit Check)...');
            const payment = await addPayment({
                invoice_id: invoiceId,
                customer_id: customer.id,
                amount: 500,
                payment_method: 'Cash',
                created_by: userId
            });

            // Verify CREATE PAYMENT Audit
            const payLog = await client.query('SELECT * FROM audit_logs WHERE action = $1 AND entity_id = $2', ['CREATE', payment.id]);
            if (payLog.rows.length > 0 && payLog.rows[0].entity_type === 'PAYMENT') {
                console.log('CREATE PAYMENT Audit Verified ✅');
            } else {
                console.error('CREATE PAYMENT Audit Failed ❌');
                process.exit(1);
            }
        }

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.detail) console.error('Error Detail:', error.detail);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
};

runVerification();
