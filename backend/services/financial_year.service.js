const db = require('../db');
const auditService = require('./audit.service');

exports.getAllYears = async () => {
    const res = await db.query('SELECT * FROM financial_years ORDER BY start_date DESC');
    return res.rows;
};

exports.getActiveYear = async () => {
    const res = await db.query('SELECT * FROM financial_years WHERE is_closed = false ORDER BY start_date DESC LIMIT 1');
    return res.rows[0];
};

exports.createYear = async (data) => {
    const { year_label, start_date, end_date, user_id } = data;

    // Validate
    if (!year_label || !start_date || !end_date) {
        throw new Error('Year label, start date, and end date are required');
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check if there is already an open year
        const openRes = await client.query('SELECT * FROM financial_years WHERE is_closed = false');
        if (openRes.rows.length > 0) {
            throw new Error('Cannot create new year while another financial year is still open. Please close the active year first.');
        }

        const insertQuery = `
            INSERT INTO financial_years (year_label, start_date, end_date)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const res = await client.query(insertQuery, [year_label, start_date, end_date]);
        const newYear = res.rows[0];

        await auditService.logAction(user_id, 'CREATE', 'FINANCIAL_YEAR', newYear.id, { label: year_label });

        await client.query('COMMIT');
        return newYear;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

exports.toggleSoftLock = async (id, is_soft_locked, user_id) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const res = await client.query(
            'UPDATE financial_years SET is_soft_locked = $1 WHERE id = $2 RETURNING *',
            [is_soft_locked, id]
        );

        if (res.rows.length === 0) throw new Error('Financial year not found');

        await auditService.logAction(user_id, 'UPDATE_SOFT_LOCK', 'FINANCIAL_YEAR', id, { is_soft_locked });

        await client.query('COMMIT');
        return res.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

exports.closeYear = async (id, user_id) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Lock year row
        const yearRes = await client.query('SELECT * FROM financial_years WHERE id = $1 FOR UPDATE', [id]);
        if (yearRes.rows.length === 0) throw new Error('Financial year not found');
        const year = yearRes.rows[0];

        if (year.is_closed) {
            throw new Error('This financial year is already closed');
        }

        // Generate Year-End Summary
        // Fetch all transactions inside this year boundary
        const summaryQuery = `
            SELECT 
                COALESCE(SUM(i.total_amount), 0) as total_sales,
                COALESCE(SUM(i.discount_amount), 0) as total_discount,
                COALESCE(SUM(i.cgst_amount + i.sgst_amount), 0) as total_gst,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= $1 AND payment_date <= $2) as total_payments
            FROM invoices i
            WHERE i.created_at::DATE >= $1 AND i.created_at::DATE <= $2
                AND i.is_deleted = false
        `;
        const metricsRes = await client.query(summaryQuery, [year.start_date, year.end_date]);
        const metrics = metricsRes.rows[0];

        const total_sales = parseFloat(metrics.total_sales);
        const total_discount = parseFloat(metrics.total_discount);
        const total_gst_collected = parseFloat(metrics.total_gst);
        const total_payments = parseFloat(metrics.total_payments);
        const total_pending = total_sales - total_payments;

        // Save Summary
        const insertSummary = `
            INSERT INTO financial_year_summary 
            (financial_year_id, total_sales, total_discount, total_gst_collected, total_payments, total_pending)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const summaryRecord = await client.query(insertSummary, [
            id, total_sales, total_discount, total_gst_collected, total_payments, total_pending
        ]);

        // Permanently Close Year
        await client.query(
            'UPDATE financial_years SET is_closed = true, closed_at = NOW(), closed_by = $1 WHERE id = $2',
            [user_id, id]
        );

        await auditService.logAction(user_id, 'CLOSE', 'FINANCIAL_YEAR', id, { total_sales, total_payments });

        await client.query('COMMIT');
        return summaryRecord.rows[0];

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

/**
 * Generate a full PDF report for a closed financial year.
 * Returns a Buffer containing the PDF.
 */
exports.generateYearClosePDF = async (id) => {
    const PDFDocument = require('pdfkit');

    // 1. Fetch year info
    const yearRes = await db.query('SELECT * FROM financial_years WHERE id = $1', [id]);
    if (yearRes.rows.length === 0) throw new Error('Financial year not found');
    const year = yearRes.rows[0];

    // 2. Fetch summary (may not exist if year not yet closed)
    const sumRes = await db.query('SELECT * FROM financial_year_summary WHERE financial_year_id = $1', [id]);
    const summary = sumRes.rows[0] || {};

    // 3. Customer ledger for this year
    const customerRes = await db.query(`
        WITH sales AS (
            SELECT customer_id, COALESCE(SUM(total_amount), 0) as sale
            FROM invoices
            WHERE created_at::DATE >= $1 AND created_at::DATE <= $2 AND is_deleted = false
            GROUP BY customer_id
        ),
        paid AS (
            SELECT customer_id, COALESCE(SUM(amount), 0) as paid
            FROM payments
            WHERE payment_date >= $1 AND payment_date <= $2
            GROUP BY customer_id
        )
        SELECT c.name, COALESCE(s.sale,0) as total_sale, COALESCE(p.paid,0) as total_paid,
               (COALESCE(s.sale,0) - COALESCE(p.paid,0)) as pending
        FROM customers c
        LEFT JOIN sales s ON s.customer_id = c.id
        LEFT JOIN paid p ON p.customer_id = c.id
        WHERE (COALESCE(s.sale,0) > 0 OR COALESCE(p.paid,0) > 0)
        ORDER BY c.name
    `, [year.start_date, year.end_date]);
    const customers = customerRes.rows;

    // 4. Delivery bag totals per category
    const deliveryRes = await db.query(`
        SELECT cat.name as category, SUM(dq.bags) as total_bags
        FROM delivery_quantities dq
        JOIN delivery_items di ON di.id = dq.delivery_item_id
        JOIN delivery_sheets ds ON ds.id = di.delivery_sheet_id
        JOIN categories cat ON cat.id = dq.category_id
        WHERE ds.date::DATE BETWEEN $1 AND $2
          AND ds.is_deleted = false
          AND ds.status = 'submitted'
        GROUP BY cat.name
        ORDER BY cat.name
    `, [year.start_date, year.end_date]);
    const deliveryBags = deliveryRes.rows;

    // 5. Build PDF
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        const col = (x, y, text, opts = {}) => doc.text(text, x, y, opts);

        // ── Cover / Header ──────────────────────────────────────
        doc.fillColor('#1a1a2e').rect(0, 0, 595, 120).fill();
        doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
            .text('Bhandari Sugar - Lalchand Traders', 50, 35, { width: 495, align: 'center' });
        doc.fontSize(14).font('Helvetica')
            .text(`Financial Year Report: ${year.year_label}`, 50, 68, { width: 495, align: 'center' });
        doc.fontSize(10)
            .text(`Period: ${new Date(year.start_date).toLocaleDateString('en-IN')} to ${new Date(year.end_date).toLocaleDateString('en-IN')}`, 50, 90, { width: 495, align: 'center' });

        // ── Financial Summary Box ───────────────────────────────
        doc.fillColor('#f8fafc').rect(50, 135, 495, 120).fill();
        doc.strokeColor('#e2e8f0').lineWidth(1).rect(50, 135, 495, 120).stroke();
        doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text('Year Summary', 65, 150);

        const summaryItems = [
            ['Total Sales', fmt(summary.total_sales)],
            ['Total Payments', fmt(summary.total_payments)],
            ['Total Pending', fmt(summary.total_pending)],
            ['GST Collected', fmt(summary.total_gst_collected)],
            ['Discount Given', fmt(summary.total_discount)],
        ];
        const sx = [65, 185, 305, 395, 490];
        doc.fontSize(9).font('Helvetica').fillColor('#64748b');
        summaryItems.forEach(([label], i) => doc.text(label, sx[i], 175));
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a');
        summaryItems.forEach(([, val], i) => doc.text(val, sx[i], 192, { width: 110 }));

        // ── Customer Ledger ─────────────────────────────────────
        doc.moveDown(7);
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b').text('Customer Ledger', 50, 275);
        doc.moveDown(0.5);

        // Table header
        const th = doc.y;
        doc.fillColor('#1e3a5f').rect(50, th, 495, 20).fill();
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        doc.text('Customer', 55, th + 5);
        doc.text('Sales (Year)', 250, th + 5);
        doc.text('Paid (Year)', 345, th + 5);
        doc.text('Pending', 440, th + 5);

        doc.fontSize(9).font('Helvetica').fillColor('#1e293b');
        customers.forEach((c, i) => {
            const y = doc.y + 2;
            if (y > 750) { doc.addPage(); }
            const rowY = doc.y;
            if (i % 2 === 0) {
                doc.fillColor('#f1f5f9').rect(50, rowY - 1, 495, 18).fill();
            }
            doc.fillColor(parseFloat(c.pending) > 0 ? '#dc2626' : '#166534');
            doc.text(c.name, 55, rowY + 3, { width: 190 });
            doc.fillColor('#1e293b');
            doc.text(fmt(c.total_sale), 250, rowY + 3, { width: 90 });
            doc.text(fmt(c.total_paid), 345, rowY + 3, { width: 90 });
            doc.fillColor(parseFloat(c.pending) > 0 ? '#dc2626' : '#166534');
            doc.text(fmt(c.pending), 440, rowY + 3, { width: 100 });
            doc.moveDown(1.1);
        });
        if (customers.length === 0) {
            doc.fillColor('#9ca3af').text('No transactions recorded for this year.', 55, doc.y + 5);
            doc.moveDown();
        }

        // ── Delivery Bags Summary ───────────────────────────────
        doc.addPage();
        doc.fillColor('#1a1a2e').rect(0, 0, 595, 60).fill();
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
            .text('Delivery Bags Summary', 50, 20, { width: 495, align: 'center' });

        doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text('Bags Delivered by Category', 50, 80);
        doc.moveDown(0.5);

        const bth = doc.y;
        doc.fillColor('#1e3a5f').rect(50, bth, 495, 20).fill();
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
        doc.text('Category', 55, bth + 5);
        doc.text('Total Bags', 400, bth + 5);

        doc.fontSize(11).font('Helvetica').fillColor('#1e293b');
        let grandTotal = 0;
        deliveryBags.forEach((row, i) => {
            const rowY = doc.y;
            if (i % 2 === 0) {
                doc.fillColor('#f1f5f9').rect(50, rowY - 1, 495, 22).fill();
            }
            doc.fillColor('#1e293b').text(row.category, 55, rowY + 4);
            doc.text(String(row.total_bags), 400, rowY + 4);
            grandTotal += parseInt(row.total_bags || 0);
            doc.moveDown(1.2);
        });
        if (deliveryBags.length === 0) {
            doc.fillColor('#9ca3af').text('No delivery data for this year.', 55, doc.y + 5);
            doc.moveDown();
        }

        // Grand total row
        const gtY = doc.y + 4;
        doc.fillColor('#1e3a5f').rect(50, gtY, 495, 24).fill();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL', 55, gtY + 6);
        doc.text(String(grandTotal), 400, gtY + 6);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
            .text(`Generated on ${new Date().toLocaleString('en-IN')} | Bhandari Sugar`, 50, 800, { width: 495, align: 'center' });

        doc.end();
    });
};

/**
 * Get total bags delivered per category for the active financial year.
 */
exports.getDeliveryStockSummary = async () => {
    // Get active year date range
    const yearRes = await db.query('SELECT * FROM financial_years WHERE is_closed = false ORDER BY start_date DESC LIMIT 1');
    const year = yearRes.rows[0];
    if (!year) return [];

    const res = await db.query(`
        SELECT cat.name as category, COALESCE(SUM(dq.bags), 0) as total_bags
        FROM categories cat
        LEFT JOIN delivery_quantities dq ON dq.category_id = cat.id
        LEFT JOIN delivery_items di ON di.id = dq.delivery_item_id
        LEFT JOIN delivery_sheets ds ON ds.id = di.delivery_sheet_id
            AND ds.date::DATE BETWEEN $1 AND $2
            AND ds.is_deleted = false
        GROUP BY cat.name
        ORDER BY cat.name
    `, [year.start_date, year.end_date]);

    return res.rows.map(r => ({
        category: r.category,
        total_bags: parseInt(r.total_bags || 0)
    }));
};

/**
 * Generate a full JSON export of all year data for archiving.
 */
exports.generateYearCloseJSON = async (id) => {
    const yearRes = await db.query('SELECT * FROM financial_years WHERE id = $1', [id]);
    if (yearRes.rows.length === 0) throw new Error('Financial year not found');
    const year = yearRes.rows[0];

    const sumRes = await db.query('SELECT * FROM financial_year_summary WHERE financial_year_id = $1', [id]);

    const [invoices, payments, payAdj, deliverySheets, deliveryItems, deliveryQtys, godownInv, godownPay, customers] = await Promise.all([
        db.query(`SELECT * FROM invoices WHERE created_at::DATE BETWEEN $1 AND $2`, [year.start_date, year.end_date]),
        db.query(`SELECT * FROM payments WHERE payment_date BETWEEN $1 AND $2`, [year.start_date, year.end_date]),
        db.query(`SELECT pa.* FROM payment_adjustments pa JOIN invoices i ON pa.invoice_id = i.id WHERE i.created_at::DATE BETWEEN $1 AND $2`, [year.start_date, year.end_date]),
        db.query(`SELECT * FROM delivery_sheets WHERE date::DATE BETWEEN $1 AND $2 AND is_deleted = false`, [year.start_date, year.end_date]),
        db.query(`SELECT di.* FROM delivery_items di JOIN delivery_sheets ds ON ds.id = di.delivery_sheet_id WHERE ds.date::DATE BETWEEN $1 AND $2 AND ds.is_deleted = false`, [year.start_date, year.end_date]),
        db.query(`SELECT dq.* FROM delivery_quantities dq JOIN delivery_items di ON di.id = dq.delivery_item_id JOIN delivery_sheets ds ON ds.id = di.delivery_sheet_id WHERE ds.date::DATE BETWEEN $1 AND $2 AND ds.is_deleted = false`, [year.start_date, year.end_date]),
        db.query(`SELECT * FROM godown_invoices WHERE invoice_date BETWEEN $1 AND $2`, [year.start_date, year.end_date]),
        db.query(`SELECT gp.* FROM godown_payments gp JOIN godown_invoices gi ON gi.id = gp.godown_invoice_id WHERE gi.invoice_date BETWEEN $1 AND $2`, [year.start_date, year.end_date]),
        db.query(`SELECT id, name, mobile, address FROM customers WHERE is_deleted = false`),
    ]);

    return {
        exported_at: new Date().toISOString(),
        financial_year: year,
        summary: sumRes.rows[0] || {},
        customers: customers.rows,
        invoices: invoices.rows,
        payments: payments.rows,
        payment_adjustments: payAdj.rows,
        delivery_sheets: deliverySheets.rows,
        delivery_items: deliveryItems.rows,
        delivery_quantities: deliveryQtys.rows,
        godown_invoices: godownInv.rows,
        godown_payments: godownPay.rows,
    };
};

/**
 * Permanently delete ALL transactional data after year close.
 * Keeps: customers, categories, users, financial_years, financial_year_summary.
 */
exports.purgeYearData = async (yearId, userId) => {
    // Safety: year must be closed first
    const yearRes = await db.query('SELECT * FROM financial_years WHERE id = $1', [yearId]);
    if (yearRes.rows.length === 0) throw new Error('Financial year not found');
    if (!yearRes.rows[0].is_closed) throw new Error('You must close the financial year before purging data');

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Delete in correct FK dependency order
        // 1. Delivery quantities (deepest child)
        await client.query('DELETE FROM delivery_quantities');
        await client.query('DELETE FROM delivery_items');
        await client.query('DELETE FROM delivery_sheet_rates');
        await client.query('DELETE FROM billing_rates');

        // 2. Invoices must come BEFORE delivery_sheets (FK: invoices.delivery_sheet_id)
        await client.query('DELETE FROM payment_adjustments');
        await client.query('DELETE FROM payments');
        await client.query('DELETE FROM invoices');

        // 3. Now safe to delete delivery_sheets
        await client.query('DELETE FROM delivery_sheets');

        // 4. Godown
        await client.query('DELETE FROM godown_invoice_items');
        await client.query('DELETE FROM godown_payments');
        await client.query('DELETE FROM godown_invoices');

        // 5. Reset godown stock to 0
        await client.query('UPDATE godown_stock SET quantity = 0, updated_at = NOW()');

        await client.query('DELETE FROM stock_movements');
        await client.query('DELETE FROM audit_logs');

        await auditService.logAction(userId, 'PURGE', 'FINANCIAL_YEAR', yearId, {
            note: 'All transactional data permanently deleted after year close'
        });

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
