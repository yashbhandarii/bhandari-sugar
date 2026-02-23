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
