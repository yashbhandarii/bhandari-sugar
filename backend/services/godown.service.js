const db = require('../db');
const { validateTransactionDate } = require('../utils/financialYear.util');

// Add Stock
exports.addStock = async (category, quantity) => {
    if (quantity <= 0) {
        throw new Error('Quantity to add must be greater than zero.');
    }

    // Validate that category is valid
    if (!['Medium', 'Super Small'].includes(category)) {
        throw new Error('Invalid category.');
    }

    const query = `
        UPDATE godown_stock
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE category = $2
        RETURNING *
    `;
    const res = await db.query(query, [quantity, category]);
    return res.rows[0];
};

// Create GST Invoice
exports.createInvoice = async (data) => {
    const { customer_id, invoice_date, category, bags, rate, discount_amount = 0, created_by } = data;

    if (!bags || isNaN(bags) || bags <= 0) throw new Error('Bags must be a valid number greater than zero.');
    if (!rate || isNaN(rate) || rate <= 0) throw new Error('Rate must be a valid number greater than zero.');
    if (isNaN(discount_amount) || discount_amount < 0) throw new Error('Discount cannot be negative.');
    if (!['Medium', 'Super Small'].includes(category)) throw new Error('Invalid category.');

    await validateTransactionDate(invoice_date);

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check Stock
        const stockRes = await client.query('SELECT quantity FROM godown_stock WHERE category = $1 FOR UPDATE', [category]);
        if (stockRes.rows.length === 0) throw new Error('Stock category not found.');

        const currentStock = stockRes.rows[0].quantity;
        if (bags > currentStock) {
            throw new Error('Insufficient stock in godown.');
        }

        // 2. Billing Logic
        const inclusive_total = bags * rate;
        const after_discount_total = inclusive_total - discount_amount;
        if (after_discount_total < 0) {
            throw new Error('Discount cannot exceed the total amount.');
        }

        const base_amount = after_discount_total / 1.05;
        const gst = after_discount_total - base_amount;
        const sgst_amount = gst / 2;
        const cgst_amount = gst / 2;

        const total_amount = after_discount_total;

        // Generate Invoice Number (e.g. GDN-2026-0001)
        const year = new Date(invoice_date).getFullYear();
        const numRes = await client.query(`SELECT COUNT(*) FROM godown_invoices WHERE EXTRACT(YEAR FROM invoice_date) = $1`, [year]);
        const nextNum = parseInt(numRes.rows[0].count) + 1;
        const invoice_number = `GDN-${year}-${nextNum.toString().padStart(4, '0')}`;

        // 3. Insert Invoice
        const invoiceRes = await client.query(`
            INSERT INTO godown_invoices 
            (invoice_number, customer_id, invoice_date, base_amount, sgst_amount, cgst_amount, discount_amount, total_amount, status, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [invoice_number, customer_id, invoice_date, base_amount, sgst_amount, cgst_amount, discount_amount, total_amount, 'unpaid', created_by]);

        const invoiceId = invoiceRes.rows[0].id;

        // 4. Insert Invoice Item
        await client.query(`
            INSERT INTO godown_invoice_items (godown_invoice_id, category, bags, rate)
            VALUES ($1, $2, $3, $4)
        `, [invoiceId, category, bags, rate]);

        // 5. Deduct Stock
        await client.query(`
            UPDATE godown_stock 
            SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
            WHERE category = $2
        `, [bags, category]);

        await client.query('COMMIT');
        return invoiceRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Add Payment
exports.addPayment = async (godown_invoice_id, amount, payment_method, payment_date, created_by) => {
    if (amount <= 0) throw new Error('Amount must be greater than zero.');

    await validateTransactionDate(payment_date);

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Check invoice
        const invRes = await client.query(`
            SELECT id, total_amount, status, 
                (SELECT COALESCE(SUM(amount), 0) FROM godown_payments WHERE godown_invoice_id = $1) as paid_amount
            FROM godown_invoices 
            WHERE id = $1 FOR UPDATE
        `, [godown_invoice_id]);

        if (invRes.rows.length === 0) throw new Error('Invoice not found.');

        const invoice = invRes.rows[0];
        const pendingAmount = Number(invoice.total_amount) - Number(invoice.paid_amount);

        if (amount > pendingAmount + 0.01) { // 0.01 buffer for float issues
            throw new Error(`Payment amount (${amount}) cannot exceed pending amount (${pendingAmount.toFixed(2)}).`);
        }

        // Insert payment
        const payRes = await client.query(`
            INSERT INTO godown_payments(godown_invoice_id, amount, payment_method, payment_date, created_by)
            VALUES($1, $2, $3, $4, $5)
            RETURNING *
                `, [godown_invoice_id, amount, payment_method, payment_date, created_by]);

        // Update status
        const newPaidAmount = Number(invoice.paid_amount) + amount;
        let newStatus = 'unpaid';
        if (newPaidAmount >= Number(invoice.total_amount) - 0.01) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        }

        await client.query(`UPDATE godown_invoices SET status = $1 WHERE id = $2`, [newStatus, godown_invoice_id]);

        await client.query('COMMIT');
        return payRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// --- Reports ---

exports.getSummary = async () => {
    const query = `
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM godown_invoices WHERE DATE(invoice_date) = CURRENT_DATE) as today_sales,
            (SELECT COALESCE(SUM(total_amount), 0) FROM godown_invoices WHERE invoice_date >= date_trunc('week', CURRENT_DATE)) as week_sales,
            (SELECT COALESCE(SUM(total_amount), 0) FROM godown_invoices WHERE invoice_date >= date_trunc('month', CURRENT_DATE)) as month_sales,
            (SELECT COALESCE(SUM(total_amount), 0) - COALESCE((SELECT SUM(amount) FROM godown_payments), 0) FROM godown_invoices) as total_pending
    `;
    const res = await db.query(query);
    return res.rows[0];
};

exports.getCustomerSummary = async () => {
    const query = `
        WITH customer_totals AS (
            SELECT
                gi.customer_id,
                COALESCE(SUM(gi.total_amount), 0) AS total_billed,
                COALESCE((
                    SELECT SUM(gp.amount)
                    FROM godown_payments gp
                    JOIN godown_invoices gi2 ON gp.godown_invoice_id = gi2.id
                    WHERE gi2.customer_id = gi.customer_id
                ), 0) AS total_paid
            FROM godown_invoices gi
            GROUP BY gi.customer_id
        ),
        customer_categories AS (
            SELECT
                gi.customer_id,
                gii.category,
                SUM(gii.bags)::INTEGER AS total_bags,
                ROUND(SUM(gii.bags * gii.rate)::NUMERIC, 2) AS category_amount
            FROM godown_invoices gi
            JOIN godown_invoice_items gii ON gii.godown_invoice_id = gi.id
            GROUP BY gi.customer_id, gii.category
        )
        SELECT
            c.id,
            c.name,
            ct.total_billed,
            ct.total_paid,
            (ct.total_billed - ct.total_paid) AS pending_balance,
            COALESCE(SUM(cc.total_bags), 0)::INTEGER AS total_bags,
            COALESCE(
                json_agg(
                    json_build_object(
                        'category', cc.category,
                        'bags', cc.total_bags,
                        'amount', cc.category_amount
                    )
                    ORDER BY cc.category
                ) FILTER (WHERE cc.category IS NOT NULL),
                '[]'::json
            ) AS categories
        FROM customer_totals ct
        JOIN customers c ON c.id = ct.customer_id
        LEFT JOIN customer_categories cc ON cc.customer_id = ct.customer_id
        GROUP BY c.id, c.name, ct.total_billed, ct.total_paid
        ORDER BY pending_balance DESC, c.name
    `;
    const res = await db.query(query);
    return res.rows.map((row) => {
        const categories = Array.isArray(row.categories)
            ? row.categories
            : JSON.parse(row.categories || '[]');

        return {
            id: row.id,
            name: row.name,
            total_billed: parseFloat(row.total_billed || 0),
            total_paid: parseFloat(row.total_paid || 0),
            pending_balance: parseFloat(row.pending_balance || 0),
            total_bags: parseInt(row.total_bags || 0, 10),
            categories: categories.map((category) => ({
                category: category.category,
                bags: parseInt(category.bags || 0, 10),
                amount: parseFloat(category.amount || 0)
            }))
        };
    });
};

exports.getPendingInvoices = async () => {
    const query = `
        SELECT 
            i.id, i.invoice_number, i.invoice_date, i.total_amount, i.status,
            c.name as customer_name,
            (i.total_amount - COALESCE((SELECT SUM(amount) FROM godown_payments WHERE godown_invoice_id = i.id), 0)) as pending_amount
        FROM godown_invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.status != 'paid'
        ORDER BY i.invoice_date ASC
    `;
    const res = await db.query(query);
    return res.rows;
};

exports.getAllInvoices = async () => {
    const query = `
        SELECT 
            i.id, i.invoice_number, i.invoice_date, i.total_amount, i.status,
            c.name as customer_name,
            (i.total_amount - COALESCE((SELECT SUM(amount) FROM godown_payments WHERE godown_invoice_id = i.id), 0)) as pending_amount
        FROM godown_invoices i
        JOIN customers c ON i.customer_id = c.id
        ORDER BY i.invoice_date DESC
    `;
    const res = await db.query(query);
    return res.rows;
};

exports.getStock = async () => {
    const res = await db.query('SELECT category, quantity, updated_at FROM godown_stock');
    return res.rows;
};

exports.getInvoiceById = async (id) => {
    const invRes = await db.query(`
        SELECT
            i.*,
            c.name,
            c.mobile,
            c.address,
            COALESCE((
                SELECT SUM(gp.amount)
                FROM godown_payments gp
                WHERE gp.godown_invoice_id = i.id
            ), 0) AS paid_amount,
            (i.total_amount - COALESCE((
                SELECT SUM(gp.amount)
                FROM godown_payments gp
                WHERE gp.godown_invoice_id = i.id
            ), 0)) AS pending_amount
        FROM godown_invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.id = $1
    `, [id]);

    if (invRes.rows.length === 0) return null;

    const invoice = invRes.rows[0];

    const itemRes = await db.query(`
        SELECT category, bags, rate,
               (bags * rate) as amount
        FROM godown_invoice_items
        WHERE godown_invoice_id = $1
    `, [id]);

    invoice.items = itemRes.rows;
    invoice.paid_amount = parseFloat(invoice.paid_amount || 0);
    invoice.pending_amount = parseFloat(invoice.pending_amount || 0);
    return invoice;
};
