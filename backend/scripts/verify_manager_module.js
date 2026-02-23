const path = require('path');
const axiosPath = path.resolve(__dirname, '../../frontend/node_modules/axios');
let axios;
try {
    axios = require(axiosPath);
} catch (e) {
    console.error('Could not load axios from frontend, falling back to manual fetch if available or fail.');
    // If fetch is available globally (node 18+) use it via wrapper if we want, but let's assume axios exists.
    throw e;
}

const db = require('../db');

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let customerId = null;
let sheetId = null;
let invoiceId = null;

const request = async (url, method, body, headers = {}) => {
    console.log(`[REQUEST] ${method} ${url}`);
    try {
        const response = await axios({
            method: method,
            url: url,
            data: body,
            headers: headers,
            responseType: url.includes('download') ? 'arraybuffer' : 'json'
        });

        let data = response.data;
        if (url.includes('download')) {
            return { status: response.status, headers: response.headers, data: data, isPdf: true };
        }
        return { data, status: response.status };

    } catch (error) {
        if (error.response) {
            throw new Error(`Request failed: ${error.response.status} ${JSON.stringify(error.response.data)}`);
        } else {
            throw error;
        }
    }
};

const runTest = async () => {
    try {
        console.log('--- STARTING MANAGER MODULE VERIFICATION ---');

        // 0. Token Generation
        const jwt = require('jsonwebtoken');
        // Matches backend .env
        const secret = 'your_jwt_secret_key';
        // Role must be 'manager' or 'owner' for customer creation
        token = jwt.sign({ id: 1, role: 'owner' }, secret, { expiresIn: '1h' });
        console.log('✅ Token Generated (Role: Owner)');

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Create Customer
        console.log('\n--- 1. Testing Customer Creation ---');
        // Ensure we check for duplicate before or just catch logic
        // But with unique mobile (timestamp based), it should be fine.
        const mobile = `9${Date.now().toString().substring(4)}`;

        const custRes = await request(`${BASE_URL}/customers`, 'POST', {
            name: `Test Customer ${Date.now()}`,
            mobile: mobile
        }, headers);
        customerId = custRes.data.id;
        console.log(`✅ Customer Created: ID ${customerId}`);

        // 2. Create Delivery Sheet
        console.log('\n--- 2. Testing Delivery Sheet Creation ---');
        const sheetRes = await request(`${BASE_URL}/delivery-sheets`, 'POST', {
            truck_number: 'TEST-TRUCK',
            date: new Date().toISOString().split('T')[0],
            medium_rate: 3500,
            super_small_rate: 3400
        }, headers);
        sheetId = sheetRes.data.id;
        console.log(`✅ Delivery Sheet Created: ID ${sheetId}`);

        // 3. Add Items
        console.log('\n--- 3. Testing Add Items ---');
        // Fetch categories to get correct IDs
        const catRes = await request(`${BASE_URL}/categories`, 'GET', null, headers);
        const categories = catRes.data;
        const medium = categories.find(c => c.name.toLowerCase() === 'medium');
        const superSmall = categories.find(c => c.name.toLowerCase().includes('small'));

        await request(`${BASE_URL}/delivery-sheets/items`, 'POST', {
            delivery_sheet_id: sheetId,
            customer_id: customerId,
            quantities: [
                { category_id: medium.id, bags: 10 },
                { category_id: superSmall.id, bags: 5 }
            ]
        }, headers);
        console.log('✅ Items Added');

        // 4. Submit Sheet & Verify Stock
        console.log('\n--- 4. Testing Submission & Stock ---');
        const stockBefore = await request(`${BASE_URL}/inventory/stock`, 'GET', null, headers);

        await request(`${BASE_URL}/delivery-sheets/${sheetId}/submit`, 'POST', {}, headers);
        console.log('✅ Sheet Submitted');

        const stockAfter = await request(`${BASE_URL}/inventory/stock`, 'GET', null, headers);

        console.log(`Stock Change Medium: ${stockBefore.data.medium} -> ${stockAfter.data.medium}`);
        if (parseInt(stockAfter.data.medium) !== parseInt(stockBefore.data.medium) - 10) {
            console.error('❌ Stock Verification Failed for Medium Bags');
        } else {
            console.log('✅ Stock Verification Passed');
        }

        // 5. Generate Billing & Verify GST
        console.log('\n--- 5. Testing Billing & GST ---');
        const billRes = await request(`${BASE_URL}/billing/generate/${sheetId}`, 'POST', {
            medium_rate: 3500,
            super_small_rate: 3400
        }, headers);
        console.log(`✅ Billing Generated. Invoices: ${billRes.data.invoice_ids.join(', ')}`);
        invoiceId = billRes.data.invoice_ids[0];

        // Fetch Invoice via Customer Billing History
        const billingHistory = await request(`${BASE_URL}/billing/customer/${customerId}`, 'GET', null, headers);
        const invoice = billingHistory.data.find(inv => inv.id === invoiceId);

        const expectedSubtotal = (10 * 3500) + (5 * 3400); // 52000
        // GST Calculation: 
        // Logic in billing.service.js: subtotal * 0.025 (SGST) + subtotal * 0.025 (CGST) + expense
        // Total = Subtotal + SGST + CGST + Expense
        const sgst = expectedSubtotal * 0.025;
        const cgst = expectedSubtotal * 0.025;
        const expectedTotal = expectedSubtotal + sgst + cgst; // 52000 + 1300 + 1300 = 54600

        console.log(`Invoice Total: ${invoice.total_amount}, Expected: ${expectedTotal}`);
        if (Math.abs(parseFloat(invoice.total_amount) - expectedTotal) < 1) {
            console.log('✅ GST & Total Verification Passed');
        } else {
            console.error('❌ GST Verification Failed');
        }

        // 6. Add Partial Payment
        console.log('\n--- 6. Testing Partial Payment ---');
        await request(`${BASE_URL}/payments`, 'POST', {
            invoice_id: invoiceId,
            customer_id: customerId,
            amount: 20000,
            payment_method: 'cash'
        }, headers);
        console.log('✅ Payment Added');

        const billingHistory2 = await request(`${BASE_URL}/billing/customer/${customerId}`, 'GET', null, headers);
        const invoice2 = billingHistory2.data.find(inv => inv.id === invoiceId);
        console.log(`Invoice Status: ${invoice2.status}`);
        if (invoice2.status === 'partial') {
            console.log('✅ Status Update (Partial) Passed');
        } else {
            console.error(`❌ Status Update Failed: Expected partial, got ${invoice2.status}`);
        }

        // 7. Full Payment
        console.log('\n--- 7. Testing Full Payment ---');
        await request(`${BASE_URL}/payments`, 'POST', {
            invoice_id: invoiceId,
            customer_id: customerId,
            amount: 34600, // Remaining 54600 - 20000
            payment_method: 'cash'
        }, headers);

        const billingHistory3 = await request(`${BASE_URL}/billing/customer/${customerId}`, 'GET', null, headers);
        const invoice3 = billingHistory3.data.find(inv => inv.id === invoiceId);
        console.log(`Invoice Status: ${invoice3.status}`);
        if (invoice3.status === 'paid') {
            console.log('✅ Status Update (Paid) Passed');
        } else {
            console.error(`❌ Status Update Failed: Expected paid, got ${invoice3.status}`);
        }

        // 8. Download Verification
        console.log('\n--- 8. Testing Downloads ---');
        console.log(`Debug: Checking existence of Sheet ID ${sheetId}`);
        try {
            const checkRes = await request(`${BASE_URL}/delivery-sheets/${sheetId}`, 'GET', null, headers);
            console.log(`Debug: Sheet exists, Status: ${checkRes.data.status}`);
        } catch (e) {
            console.error(`Debug: Sheet check failed: ${e.message}`);
        }

        try {
            console.log(`Debug: Attempting download for Sheet ID ${sheetId}`);
            const pdfRes = await request(`${BASE_URL}/delivery-sheets/${sheetId}/download`, 'GET', null, headers);
            if (pdfRes.isPdf && pdfRes.data.byteLength > 100) {
                console.log('✅ Delivery Sheet PDF Download Passed');
            } else {
                console.error('❌ PDF Download Failed: Invalid content');
            }
        } catch (e) {
            console.error('❌ PDF Download Error', e.message);
        }

        console.log('\n--- ALL TESTS COMPLETED ---');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
    } finally {
        process.exit();
    }
};

runTest();
