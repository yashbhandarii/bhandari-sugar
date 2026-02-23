const db = require('../db');
const paymentService = require('../services/payment.service');

async function runValidationTests() {
    console.log('--- STARTING FINANCIAL VALIDATION TESTS ---');
    const client = await db.pool.connect();

    let customerId, sheetId;

    try {
        await client.query('BEGIN');

        // 1. Setup Data
        const custSuffix = Date.now();
        const custRes = await client.query(`
            INSERT INTO customers (name, mobile) 
            VALUES ($1, $2) RETURNING id
        `, [`VAL_TEST_${custSuffix}`, `9${custSuffix.toString().slice(-9)}`]);
        customerId = custRes.rows[0].id;

        // 2. TEST DB CONSTRAINT: Negative Bags
        console.log('\n[TEST 1] DB Constraint: Negative Bags');
        await client.query('SAVEPOINT t1');
        try {
            // Need a valid sheet first
            const sheetRes = await client.query(`
                INSERT INTO delivery_sheets (truck_number, medium_rate, super_small_rate, status)
                VALUES ('TEST', 100, 100, 'draft') RETURNING id
            `);
            sheetId = sheetRes.rows[0].id;

            await client.query(`
                INSERT INTO delivery_items (delivery_sheet_id, customer_id, medium_bags, super_small_bags)
                VALUES ($1, $2, -5, 0)
            `, [sheetId, customerId]);
            console.log('❌ FAIL: Database allowed negative medium_bags');
        } catch (e) {
            await client.query('ROLLBACK TO SAVEPOINT t1');
            if (e.message.includes('check_positive_bags')) {
                console.log('✅ PASS: Database rejected negative bags');
            } else {
                console.log('❌ FAIL: Unexpected error:', e.message);
            }
        }

        // 3. TEST DB CONSTRAINT: Negative Rates
        console.log('\n[TEST 2] DB Constraint: Negative Rates');
        await client.query('SAVEPOINT t2');
        try {
            await client.query(`
                INSERT INTO delivery_sheets (truck_number, medium_rate, super_small_rate, status)
                VALUES ('TEST-NEG-RATE', -100, 100, 'draft')
            `);
            console.log('❌ FAIL: Database allowed negative medium_rate');
        } catch (e) {
            await client.query('ROLLBACK TO SAVEPOINT t2');
            if (e.message.includes('check_positive_rates')) {
                console.log('✅ PASS: Database rejected negative rates');
            } else {
                console.log('❌ FAIL: Unexpected error:', e.message);
            }
        }

        // 4. TEST SERVICE LOGIC: Payment > Pending
        console.log('\n[TEST 3] Service Logic: Payment > Pending');
        await client.query('SAVEPOINT t3');
        try {
            // Create an invoice for 5000
            await client.query(`
                INSERT INTO invoices (customer_id, subtotal, sgst_amount, cgst_amount, total_amount, status)
                VALUES ($1, 4000, 500, 500, 5000, 'unpaid')
            `, [customerId]);

            // Try to pay 6000
            await paymentService.addPayment({
                customer_id: customerId,
                amount: 6000,
                payment_method: 'cash',
                payment_date: new Date()
            });
            console.log('❌ FAIL: Service allowed payment > pending');
        } catch (e) {
            await client.query('ROLLBACK TO SAVEPOINT t3'); // Service might not have used DB yet but safe to include
            if (e.message.includes('exceeds pending amount')) {
                console.log('✅ PASS: Service rejected payment > pending');
            } else {
                console.log('❌ FAIL: Unexpected error:', e.message);
            }
        }

        // 5. TEST SERVICE LOGIC: Valid Payment
        console.log('\n[TEST 4] Service Logic: Valid Payment');
        await client.query('SAVEPOINT t4');
        try {
            // Pending is 5000. Pay 4000.
            await paymentService.addPayment({
                customer_id: customerId,
                amount: 4000,
                payment_method: 'cash',
                payment_date: new Date()
            });
            console.log('✅ PASS: Service accepted valid payment');
        } catch (e) {
            await client.query('ROLLBACK TO SAVEPOINT t4');
            console.log('❌ FAIL: Service rejected valid payment:', e.message);
        }

        // 6. TEST DB CONSTRAINT: Negative Payment
        console.log('\n[TEST 5] DB Constraint: Negative Payment');
        await client.query('SAVEPOINT t5');
        try {
            await client.query(`
                INSERT INTO payments (customer_id, amount, payment_method)
                VALUES ($1, -100, 'cash')
            `, [customerId]);
            console.log('❌ FAIL: Database allowed negative payment');
        } catch (e) {
            await client.query('ROLLBACK TO SAVEPOINT t5');
            if (e.message.includes('check_positive_payment')) {
                console.log('✅ PASS: Database rejected negative payment');
            } else {
                console.log('❌ FAIL: Unexpected error:', e.message);
            }
        }


    } catch (error) {
        console.error('Test Suite Error:', error);
    } finally {
        await client.query('ROLLBACK'); // Always rollback to keep DB clean
        client.release();
        if (db.pool.end) await db.pool.end();
        setTimeout(() => process.exit(0), 100);
    }
}

runValidationTests();
