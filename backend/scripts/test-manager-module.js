const db = require('../db');
const customerService = require('../services/customer.service');
const reportService = require('../services/report.service');

async function runTests() {
    console.log('--- Starting Manager Module Verification ---');
    const client = await db.pool.connect();

    let testCustomerId;
    const testMobile = '9998887776';

    try {
        // Cleanup potential existing test data
        await client.query('DELETE FROM payments WHERE customer_id IN (SELECT id FROM customers WHERE mobile = $1)', [testMobile]);
        await client.query('DELETE FROM invoices WHERE customer_id IN (SELECT id FROM customers WHERE mobile = $1)', [testMobile]);
        await client.query('DELETE FROM customers WHERE mobile = $1', [testMobile]);

        // 1. Test Customer CRUD
        console.log('\n[1] Testing Customer CRUD...');

        // Create
        const newCustomer = {
            name: 'Test Setup Customer',
            mobile: testMobile,
            address: 'Test Address'
        };
        const created = await customerService.createCustomer(newCustomer);
        console.log(' - Created Customer:', created.id, created.name);
        testCustomerId = created.id;

        // Update
        const updated = await customerService.updateCustomer(testCustomerId, { ...newCustomer, name: 'Verified Customer' });
        console.log(' - Updated Customer:', updated.name);
        if (updated.name !== 'Verified Customer') throw new Error('Update failed');

        // 2. Test Report Data
        console.log('\n[2] Testing Report Data...');
        // Insert dummy invoice and payment
        const today = new Date().toISOString().split('T')[0];

        await client.query('BEGIN');
        const invRes = await client.query(`
            INSERT INTO invoices (customer_id, subtotal, sgst_amount, cgst_amount, total_amount, status)
            VALUES ($1, 100, 2.5, 2.5, 105, 'unpaid') RETURNING id
        `, [testCustomerId]);
        console.log(' - Inserted Dummy Invoice:', invRes.rows[0].id);

        const payRes = await client.query(`
            INSERT INTO payments (customer_id, amount, payment_method, payment_date)
            VALUES ($1, 50, 'cash', $2) RETURNING id
        `, [testCustomerId, today]);
        console.log(' - Inserted Dummy Payment:', payRes.rows[0].id);
        await client.query('COMMIT');

        // Fetch Day Report
        const report = await reportService.getDayReport(today);
        const reportItem = report.find(r => r.id === testCustomerId);

        console.log(' - Report Item:', reportItem);

        if (!reportItem) throw new Error('Customer not found in report');
        // Report logic: pending_amount = lifetime sales - lifetime paid
        // Here lifetime sales = 105, paid = 50. Pending = 55.
        // It matches.

        if (reportItem.total_sale !== 105) throw new Error(`Expected Sale 105, got ${reportItem.total_sale}`);
        if (reportItem.total_paid !== 50) throw new Error(`Expected Paid 50, got ${reportItem.total_paid}`);
        if (reportItem.pending_amount !== 55) throw new Error(`Expected Pending 55, got ${reportItem.pending_amount}`);
        console.log(' - Report Calculation Verified.');

        // 3. Test Delete Constraints
        console.log('\n[3] Testing Delete Constraints...');
        try {
            await customerService.deleteCustomer(testCustomerId);
            throw new Error('Delete should have failed due to existing records');
        } catch (error) {
            console.log(' - Delete prevented as expected:', error.message);
        }

        // Cleanup Data to allow delete
        await client.query('DELETE FROM payments WHERE customer_id = $1', [testCustomerId]);
        await client.query('DELETE FROM invoices WHERE customer_id = $1', [testCustomerId]);

        // 4. Test Successful Delete
        await customerService.deleteCustomer(testCustomerId);

        const check = await client.query('SELECT * FROM customers WHERE id = $1', [testCustomerId]);
        if (check.rows.length === 0) {
            console.log(' - Customer deleted successfully.');
        } else {
            throw new Error('Customer still exists');
        }

        console.log('\n--- Verification Passed Successfully ---');

    } catch (error) {
        console.error('\n!!! Verification Failed !!!', error);
        await client.query('ROLLBACK');
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

runTests();
