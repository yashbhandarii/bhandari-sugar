const db = require('../db');
const auditService = require('./audit.service');
const { validateTransactionDate } = require('../utils/financialYear.util');

/**
 * Get pending amount for a customer.
 * Logic: SUM(invoices.total_amount) - SUM(payments.amount)
 * @param {number} customer_id 
 * @returns {Promise<Object>} { total_invoice, total_paid, pending }
 */
exports.getCustomerPending = async (customer_id) => {
    // Total Invoice Amount
    const invoiceRes = await db.query(
        'SELECT SUM(total_amount) as total FROM invoices WHERE customer_id = $1',
        [customer_id]
    );
    const total_invoice = parseFloat(invoiceRes.rows[0].total || 0);

    // Total Paid Amount
    const paymentRes = await db.query(
        'SELECT SUM(amount) as total FROM payments WHERE customer_id = $1',
        [customer_id]
    );
    const total_paid = parseFloat(paymentRes.rows[0].total || 0);

    // Total Adjustments (Discounts)
    const adjRes = await db.query(
        'SELECT SUM(amount) as total FROM payment_adjustments pa JOIN invoices i ON pa.invoice_id = i.id WHERE i.customer_id = $1',
        [customer_id]
    );
    const total_adjustments = parseFloat(adjRes.rows[0].total || 0);

    return {
        total_invoice,
        total_paid,
        total_adjustments,
        pending: total_invoice - total_paid - total_adjustments
    };
};

/**
 * Add a payment and update invoice status.
 * @param {Object} data - { invoice_id, customer_id, amount, payment_method, note, created_by }
 * @returns {Promise<Object>} Created payment
 */
exports.addPayment = async (data) => {
    const {
        invoice_id,
        customer_id,
        amount,
        discount = 0,
        reason = '',
        payment_method,
        payment_date,
        note,
        payment_reference,
        created_by
    } = data;

    // Validate required fields
    if (!customer_id || amount === undefined || amount < 0 || !payment_method) {
        throw new Error('Missing required fields: customer_id, amount (>=0), payment_method');
    }

    const discountVal = parseFloat(discount || 0);
    if (discountVal < 0) {
        throw new Error('Discount cannot be negative');
    }

    if (amount === 0 && discountVal === 0) {
        throw new Error('Either payment amount or discount must be greater than zero');
    }

    const finalDate = payment_date ? new Date(payment_date) : new Date();

    // STRICT: Validate against active financial year
    await validateTransactionDate(finalDate);

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        let invoiceTotals = null;

        // STEP 1: Lock and Validate
        if (invoice_id) {
            // Lock the invoice row
            const invoiceRes = await client.query(
                'SELECT total_amount, status FROM invoices WHERE id = $1 FOR UPDATE',
                [invoice_id]
            );

            if (invoiceRes.rows.length === 0) {
                throw new Error('Invoice not found');
            }

            const invoice = invoiceRes.rows[0];

            // Fetch total paid for this invoice
            const paidRes = await client.query(
                'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
                [invoice_id]
            );

            // Fetch total adjustments (discounts) for this invoice
            const adjRes = await client.query(
                'SELECT COALESCE(SUM(amount), 0) as total_adj FROM payment_adjustments WHERE invoice_id = $1',
                [invoice_id]
            );

            const total_paid = parseFloat(paidRes.rows[0].total_paid);
            const total_adj = parseFloat(adjRes.rows[0].total_adj);
            const total_amount = parseFloat(invoice.total_amount);

            // STEP 3: Calculate strict pending amount (considering previous discounts)
            const pending = total_amount - total_paid - total_adj;

            // STEP 4: STRICT Validation
            if (parseFloat(amount) + discountVal > pending + 0.01) {
                throw new Error(`Total (₹${parseFloat(amount) + discountVal}) exceeds pending amount (₹${pending.toFixed(2)}) for Invoice #${invoice_id}`);
            }

            invoiceTotals = { total_amount, total_paid, total_adj, pending };
        } else {
            // Paying on account (no invoice_id) - Lock customer's balance logic
            const invRes = await client.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE customer_id = $1', [customer_id]);
            const total_invoiced = parseFloat(invRes.rows[0].total);

            const paidResBefore = await client.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE customer_id = $1', [customer_id]);
            const total_paid_before = parseFloat(paidResBefore.rows[0].total);

            const adjResBefore = await client.query(
                'SELECT COALESCE(SUM(pa.amount), 0) as total FROM payment_adjustments pa JOIN invoices i ON pa.invoice_id = i.id WHERE i.customer_id = $1',
                [customer_id]
            );
            const total_adj_before = parseFloat(adjResBefore.rows[0].total);

            const current_pending = total_invoiced - total_paid_before - total_adj_before;

            if (parseFloat(amount) + discountVal > current_pending + 0.01) {
                throw new Error(`Total (₹${parseFloat(amount) + discountVal}) exceeds total customer pending amount (₹${current_pending.toFixed(2)})`);
            }
        }

        let payment = null;

        // STEP 5: Insert Payment Record (if amount > 0)
        if (parseFloat(amount) > 0) {
            const insertQuery = `
                INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const values = [
                invoice_id || null,
                customer_id,
                amount,
                payment_method,
                finalDate,
                created_by || null
            ];

            const insertRes = await client.query(insertQuery, values);
            payment = insertRes.rows[0];
        }

        // STEP 5b: Insert Adjustment Record (if discount > 0)
        if (discountVal > 0) {
            if (!invoice_id) {
                throw new Error('Discounts can only be applied to specific invoices, not general account payments');
            }

            await client.query(`
                INSERT INTO payment_adjustments (invoice_id, adjustment_type, amount, reason, created_by)
                VALUES ($1, 'discount', $2, $3, $4)
            `, [invoice_id, discountVal, reason, created_by || null]);
        }

        // STEP 6 & 7: Update Invoice Status strictly
        if (invoice_id && invoiceTotals) {
            const new_total_reduced = invoiceTotals.total_paid + invoiceTotals.total_adj + parseFloat(amount) + discountVal;

            let new_status = 'unpaid';
            if (new_total_reduced >= invoiceTotals.total_amount - 0.01) {
                new_status = 'paid';
            } else if (new_total_reduced > 0) {
                new_status = 'partial';
            }

            await client.query('UPDATE invoices SET status = $1 WHERE id = $2', [new_status, invoice_id]);
        }

        // Optional Audit Logging
        if (created_by && (payment || discountVal > 0)) {
            await auditService.logAction(
                created_by,
                'CREATE',
                'PAYMENT_DISCOUNT',
                invoice_id || customer_id,
                { amount, discount: discountVal, invoice_id, customer_id },
                client
            );
        }

        // STEP 8: COMMIT
        await client.query('COMMIT');
        return payment || { status: 'success', discount: discountVal };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('TRANSACTION FAILED: Rolling back payment/discount injection', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get payments by customer.
 */
exports.getPaymentsByCustomer = async (customer_id) => {
    const result = await db.query(`
        SELECT id, invoice_id, customer_id, amount, payment_method, payment_date, created_at 
        FROM payments 
        WHERE customer_id = $1 
        ORDER BY created_at DESC
    `, [customer_id]);
    return result.rows;
};
