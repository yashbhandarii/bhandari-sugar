const db = require('../db');
const inventoryService = require('./inventory.service');

/**
 * Get dashboard summary.
 * @returns {Promise<Object>}
 */
exports.getDashboardSummary = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [financialsRes, stock] = await Promise.all([
        db.query(`
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_sales,
                (SELECT COALESCE(SUM(amount), 0) FROM payments) as total_paid,
                (SELECT COALESCE(SUM(amount), 0) FROM payment_adjustments) as total_adj,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date = $1) as today_collection
        `, [today]),
        inventoryService.getCurrentStock()
    ]);

    const financials = financialsRes.rows[0];
    const total_sales = parseFloat(financials.total_sales);
    const total_paid = parseFloat(financials.total_paid);
    const total_adj = parseFloat(financials.total_adj);

    return {
        total_sales,
        total_pending: total_sales - total_paid - total_adj,
        today_collection: parseFloat(financials.today_collection),
        stock: {
            medium: stock.medium,
            super_small: stock.super_small
        }
    };
};

/**
 * Get Specific Owner Dashboard Summary.
 */
exports.getOwnerDashboardSummary = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [financialsRes, stock] = await Promise.all([
        db.query(`
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as total_sales,
                (SELECT COALESCE(SUM(amount), 0) FROM payments) as total_paid,
                (SELECT COALESCE(SUM(amount), 0) FROM payment_adjustments) as total_adj,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date = $1) as today_collection,
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE created_at >= NOW() - INTERVAL '7 days') as week_sales
        `, [today]),
        inventoryService.getCurrentStock()
    ]);

    const financials = financialsRes.rows[0];
    const total_sales = parseFloat(financials.total_sales);
    const total_paid = parseFloat(financials.total_paid);
    const total_adj = parseFloat(financials.total_adj);

    return {
        total_sales,
        total_pending: total_sales - total_paid - total_adj,
        today_collection: parseFloat(financials.today_collection),
        week_sales: parseFloat(financials.week_sales),
        medium_stock_remaining: stock.medium,
        super_small_stock_remaining: stock.super_small
    };
};

exports.getPaymentMethodSummary = async () => {
    const res = await db.query('SELECT payment_method, SUM(amount) as total FROM payments GROUP BY payment_method');
    return res.rows.map(r => ({ method: r.payment_method, amount: parseFloat(r.total) }));
};

exports.getWeeklySales = async () => {
    const res = await db.query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day, SUM(total_amount) as total_sales
        FROM invoices
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY 1
        ORDER BY 1
    `);
    const data = res.rows.map(r => ({ day: r.day, total_sales: parseFloat(r.total_sales) }));

    // Fill missing days? User said "Last 7 days only".
    // Better to ensure continuous dates for chart.
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const found = data.find(item => item.day === dateStr);
        result.push({ day: dateStr, total_sales: found ? found.total_sales : 0 });
    }
    return result;
};

exports.getRiskyCustomers = async () => {
    // Rule: Pending > 14 days (Red), > 7 days (Orange)
    // How to calc "Days Pending"? 
    // Logic: Oldest unpaid invoice date.
    // Query: For each customer with pending > 0, find MIN(invoice_date) where (inv_amount - allocated_payment) > 0.
    // Simplifying assumption: We don't allocate payments to specific invoices yet.
    // Proxy: If Total Pending > 0, check date of First Unpaid Invoice? 
    // Complex without strict allocation.
    // Alternative Proxy: Last Payment Date? "Last Payment Date" is requested column.
    // "Days Pending" usually means "Age of oldest debt".
    // Let's approximate: 
    // 1. Get Customers with Total Pending > 0
    // 2. For them, get Oldest Invoice Date. 
    // 3. Days Pending = Now - Oldest Invoice Date.

    const query = `
        SELECT 
            c.id, 
            c.name,
            (COALESCE(SUM(i.total_amount), 0) - COALESCE(p.total_paid, 0) - COALESCE(adj.total_adj, 0)) as pending_amount,
            p.last_payment_date,
            EXTRACT(DAY FROM NOW() - MIN(i.created_at) FILTER (WHERE i.status != 'paid')) as days_pending
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        LEFT JOIN (
            SELECT customer_id, SUM(amount) as total_paid, MAX(payment_date) as last_payment_date
            FROM payments
            GROUP BY customer_id
        ) p ON c.id = p.customer_id
        LEFT JOIN (
            SELECT i.customer_id, SUM(pa.amount) as total_adj
            FROM payment_adjustments pa
            JOIN invoices i ON pa.invoice_id = i.id
            GROUP BY i.customer_id
        ) adj ON c.id = adj.customer_id
        GROUP BY c.id, c.name, p.total_paid, p.last_payment_date, adj.total_adj
        HAVING (COALESCE(SUM(i.total_amount), 0) - COALESCE(p.total_paid, 0) - COALESCE(adj.total_adj, 0)) > 0
        ORDER BY pending_amount DESC
    `;

    const res = await db.query(query);

    return res.rows.map(r => {
        const days = parseInt(r.days_pending || 0); // If no unpaid invoice (shouldn't happen if pending>0), 0.
        let status = 'green';
        if (days > 14) status = 'red';
        else if (days > 7) status = 'orange';

        return {
            customer_name: r.name,
            pending_amount: parseFloat(r.pending_amount),
            last_payment_date: r.last_payment_date,
            days_pending: days,
            status: status
        };
    });
};

/**
 * Generic Report Generator
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
exports.getReport = async (startDate, endDate) => {
    // We fetch:
    // 1. Sale in range (per customer) - using invoices.created_at::DATE
    // 2. Paid in range (per customer) - using payments.payment_date
    // 3. Current Pending (per customer) - All time

    const query = `
        WITH sales_range AS (
            SELECT customer_id, SUM(total_amount) as total
            FROM invoices
            WHERE created_at::DATE >= $1 AND created_at::DATE <= $2
            GROUP BY customer_id
        ),
        payments_range AS (
            SELECT customer_id, SUM(amount) as total
            FROM payments
            WHERE payment_date >= $1 AND payment_date <= $2
            GROUP BY customer_id
        ),
        lifetime_sales AS (
            SELECT customer_id, SUM(total_amount) as total
            FROM invoices
            GROUP BY customer_id
        ),
        lifetime_payments AS (
            SELECT customer_id, SUM(amount) as total
            FROM payments
            GROUP BY customer_id
        ),
        lifetime_adjustments AS (
            SELECT i.customer_id, SUM(pa.amount) as total
            FROM payment_adjustments pa
            JOIN invoices i ON pa.invoice_id = i.id
            GROUP BY i.customer_id
        )
        SELECT
            c.id,
            c.name,
            COALESCE(sr.total, 0) as total_sale,
            COALESCE(pr.total, 0) as total_paid,
            (COALESCE(ls.total, 0) - COALESCE(lp.total, 0) - COALESCE(la.total, 0)) as pending_amount
        FROM customers c
        LEFT JOIN sales_range sr ON c.id = sr.customer_id
        LEFT JOIN payments_range pr ON c.id = pr.customer_id
        LEFT JOIN lifetime_sales ls ON c.id = ls.customer_id
        LEFT JOIN lifetime_payments lp ON c.id = lp.customer_id
        LEFT JOIN lifetime_adjustments la ON c.id = la.customer_id
        ORDER BY c.name
    `;

    const res = await db.query(query, [startDate, endDate]);
    return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        total_sale: parseFloat(r.total_sale),
        total_paid: parseFloat(r.total_paid),
        pending_amount: parseFloat(r.pending_amount)
    }));
};

exports.getDayReport = async (date) => {
    return this.getReport(date, date);
};

exports.getWeekReport = async (startDate, endDate) => {
    return this.getReport(startDate, endDate);
};

exports.getMonthReport = async (month, year) => {
    // month is 1-12, year is YYYY
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of month
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    return this.getReport(startStr, endStr);
};
