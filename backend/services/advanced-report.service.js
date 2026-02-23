/**
 * Advanced Reporting Service
 * ==================================================
 * Backend-driven reports with optimized SQL aggregation
 * No financial calculations in frontend
 * All validations and calculations at DB level
 */

const db = require('../db');

/**
 * REPORT 1: TODAY'S CASH COLLECTION
 * GET /api/reports/today-cash
 * 
 * Return: Customer Name, Invoice ID, Payment Amount,
 *         Remaining Pending, Last Invoice Date, Total Today
 */
exports.getTodayCashCollection = async () => {
    const today = new Date().toISOString().split('T')[0];

    const query = `
        SELECT 
            c.name as customer_name,
            p.invoice_id,
            p.amount as payment_amount,
            (COALESCE((SELECT SUM(total_amount) FROM invoices WHERE customer_id = c.id), 0) 
             - COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id AND DATE(payment_date) <= $1::DATE), 0)
             - COALESCE((SELECT SUM(pa.amount) FROM payment_adjustments pa JOIN invoices i ON pa.invoice_id = i.id WHERE i.customer_id = c.id), 0)
            ) as remaining_pending,
            (SELECT DATE(MAX(created_at)) FROM invoices WHERE customer_id = c.id) as last_invoice_date
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        WHERE p.payment_method = 'cash' 
            AND DATE(p.payment_date) = $1::DATE
        ORDER BY c.name, p.id DESC;
    `;

    const result = await db.query(query, [today]);
    const rows = result.rows;

    // Calculate total cash collected
    const total = rows.reduce((sum, row) => sum + parseFloat(row.payment_amount || 0), 0);

    return {
        date: today,
        total_cash_collected: parseFloat(total.toFixed(2)),
        count: rows.length,
        data: rows.map(r => ({
            customer_name: r.customer_name,
            invoice_id: r.invoice_id,
            payment_amount: parseFloat(r.payment_amount),
            remaining_pending: parseFloat(r.remaining_pending),
            last_invoice_date: r.last_invoice_date
        }))
    };
};

/**
 * REPORT 2: CUSTOMER SUMMARY (DAY/WEEK/MONTH)
 * GET /api/reports/customer-summary?type=day|week|month&date=YYYY-MM-DD
 * 
 * Return per customer: Customer Name, Total Sales, Total Paid, Total Pending
 */
exports.getCustomerSummary = async (type = 'month', dateParam = null) => {
    let dateFilter = '';
    let title = '';

    const now = new Date();
    let startDate, endDate = new Date(now);

    if (type === 'day') {
        startDate = dateParam ? new Date(dateParam) : new Date(now);
        endDate = new Date(startDate);
        title = `Day: ${startDate.toISOString().split('T')[0]}`;
        dateFilter = `i.created_at::DATE = $1::DATE`;
    } else if (type === 'week') {
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        title = `Week (Last 7 days)`;
        dateFilter = `i.created_at::DATE >= $1::DATE AND i.created_at::DATE <= $2::DATE`;
    } else if (type === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        title = `Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        dateFilter = `i.created_at::DATE >= $1::DATE AND i.created_at::DATE <= $2::DATE`;
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    let query;
    let params;

    if (type === 'day') {
        query = `
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.total_amount), 0) as total_sales,
                COALESCE(SUM(p.amount), 0) as total_paid,
                COALESCE(SUM(pa.amount), 0) as total_adj,
                COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(p.amount), 0) - COALESCE(SUM(pa.amount), 0) as total_pending
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND ${dateFilter}
            LEFT JOIN payments p ON c.id = p.customer_id
                AND p.payment_date = $1::DATE
            LEFT JOIN payment_adjustments pa ON i.id = pa.invoice_id
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(i.total_amount), 0) > 0
            ORDER BY c.name;
        `;
        params = [startStr];
    } else {
        query = `
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.total_amount), 0) as total_sales,
                COALESCE(SUM(p.amount), 0) as total_paid,
                COALESCE(SUM(pa.amount), 0) as total_adj,
                COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(p.amount), 0) - COALESCE(SUM(pa.amount), 0) as total_pending
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND ${dateFilter}
            LEFT JOIN payments p ON c.id = p.customer_id
                AND p.payment_date >= $1::DATE AND p.payment_date <= $2::DATE
            LEFT JOIN payment_adjustments pa ON i.id = pa.invoice_id
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(i.total_amount), 0) > 0
            ORDER BY c.name;
        `;
        params = [startStr, endStr];
    }

    const result = await db.query(query, params);

    const totals = result.rows.reduce(
        (acc, row) => ({
            total_sales: acc.total_sales + parseFloat(row.total_sales || 0),
            total_paid: acc.total_paid + parseFloat(row.total_paid || 0),
            total_pending: acc.total_pending + parseFloat(row.total_pending || 0)
        }),
        { total_sales: 0, total_paid: 0, total_pending: 0 }
    );

    return {
        title,
        start_date: startStr,
        end_date: endStr,
        totals: {
            total_sales: parseFloat(totals.total_sales.toFixed(2)),
            total_paid: parseFloat(totals.total_paid.toFixed(2)),
            total_pending: parseFloat(totals.total_pending.toFixed(2))
        },
        count: result.rows.length,
        data: result.rows.map(r => ({
            customer_name: r.customer_name,
            total_sales: parseFloat(r.total_sales),
            total_paid: parseFloat(r.total_paid),
            total_pending: parseFloat(r.total_pending)
        }))
    };
};

/**
 * REPORT 3: AGING REPORT (VERY IMPORTANT)
 * GET /api/reports/aging
 * 
 * Group pending by age: 0-7, 8-15, 16-30, 30+ days
 * Return: Customer Name, Pending Amount, Days Pending, Bucket Category
 */
exports.getAgingReport = async () => {
    const query = `
        WITH customer_pending AS (
            SELECT 
                c.id,
                c.name,
                SUM(i.total_amount) - COALESCE(SUM(p.amount), 0) - COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id)), 0) as pending_amount,
                MAX(i.created_at)::DATE as last_invoice_date,
                EXTRACT(DAY FROM NOW() - MAX(i.created_at)) as days_pending
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id
            LEFT JOIN payments p ON c.id = p.customer_id
            GROUP BY c.id, c.name
            HAVING SUM(i.total_amount) - COALESCE(SUM(p.amount), 0) - COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id)), 0) > 0
        ),
        categorized_pending AS (
            SELECT 
                id,
                name,
                pending_amount,
                days_pending,
                CASE 
                    WHEN days_pending <= 7 THEN '0-7 days'
                    WHEN days_pending <= 15 THEN '8-15 days'
                    WHEN days_pending <= 30 THEN '16-30 days'
                    ELSE '30+ days'
                END as age_bucket
            FROM customer_pending
        )
        SELECT 
            name as customer_name,
            pending_amount,
            days_pending,
            age_bucket,
            CASE 
                WHEN age_bucket = '30+ days' THEN 'HIGH_RISK'
                WHEN age_bucket = '16-30 days' THEN 'MEDIUM_RISK'
                WHEN age_bucket = '8-15 days' THEN 'WATCH_LIST'
                ELSE 'CURRENT'
            END as risk_level
        FROM categorized_pending
        ORDER BY age_bucket DESC, pending_amount DESC;
    `;

    const result = await db.query(query);
    const rows = result.rows;

    // Group by bucket
    const buckets = {
        '0-7 days': [],
        '8-15 days': [],
        '16-30 days': [],
        '30+ days': []
    };

    let totalPending = 0;
    let bucketTotals = {
        '0-7 days': 0,
        '8-15 days': 0,
        '16-30 days': 0,
        '30+ days': 0
    };

    rows.forEach(row => {
        const data = {
            customer_name: row.customer_name,
            pending_amount: parseFloat(row.pending_amount),
            days_pending: parseInt(row.days_pending || 0),
            age_bucket: row.age_bucket,
            risk_level: row.risk_level
        };
        buckets[row.age_bucket].push(data);
        bucketTotals[row.age_bucket] += parseFloat(row.pending_amount);
        totalPending += parseFloat(row.pending_amount);
    });

    // Count high risk
    const highRiskCount = rows.filter(r => r.risk_level === 'HIGH_RISK').length;

    return {
        generated_at: new Date().toISOString(),
        total_pending: parseFloat(totalPending.toFixed(2)),
        high_risk_count: highRiskCount,
        by_bucket: {
            '0-7 days': {
                count: buckets['0-7 days'].length,
                total: parseFloat(bucketTotals['0-7 days'].toFixed(2)),
                data: buckets['0-7 days']
            },
            '8-15 days': {
                count: buckets['8-15 days'].length,
                total: parseFloat(bucketTotals['8-15 days'].toFixed(2)),
                data: buckets['8-15 days']
            },
            '16-30 days': {
                count: buckets['16-30 days'].length,
                total: parseFloat(bucketTotals['16-30 days'].toFixed(2)),
                data: buckets['16-30 days']
            },
            '30+ days': {
                count: buckets['30+ days'].length,
                total: parseFloat(bucketTotals['30+ days'].toFixed(2)),
                data: buckets['30+ days']
            }
        }
    };
};

/**
 * REPORT 4: DISCOUNT IMPACT REPORT
 * GET /api/reports/discount-impact?type=day|week|month&date=YYYY-MM-DD
 * 
 * For each customer: Customer Name, Total Gross Sales, Total Discount, Net Sales, Discount %
 */
exports.getDiscountImpactReport = async (type = 'month', dateParam = null) => {
    let dateFilter = '';
    let title = '';

    const now = new Date();
    let startDate, endDate = new Date(now);

    if (type === 'day') {
        startDate = dateParam ? new Date(dateParam) : new Date(now);
        endDate = new Date(startDate);
        title = `Day: ${startDate.toISOString().split('T')[0]}`;
        dateFilter = `i.created_at::DATE = $1::DATE`;
    } else if (type === 'week') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        title = `Week (Last 7 days)`;
        dateFilter = `i.created_at::DATE >= $1::DATE AND i.created_at::DATE <= $2::DATE`;
    } else if (type === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        title = `Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        dateFilter = `i.created_at::DATE >= $1::DATE AND i.created_at::DATE <= $2::DATE`;
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    let query;
    let params;

    if (type === 'day') {
        query = `
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.subtotal + i.sgst_amount + i.cgst_amount), 0) as gross_sales,
                COALESCE(SUM(i.discount_amount), 0) as billing_discount,
                COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id AND created_at::DATE = $1::DATE)), 0) as payment_discount,
                COALESCE(SUM(i.total_amount), 0) as net_sales
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND ${dateFilter}
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(i.total_amount), 0) > 0
            ORDER BY c.name;
        `;
        params = [startStr];
    } else {
        query = `
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.subtotal + i.sgst_amount + i.cgst_amount), 0) as gross_sales,
                COALESCE(SUM(i.discount_amount), 0) as billing_discount,
                COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id AND created_at::DATE >= $1::DATE AND created_at::DATE <= $2::DATE)), 0) as payment_discount,
                COALESCE(SUM(i.total_amount), 0) as net_sales
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND ${dateFilter}
            GROUP BY c.id, c.name
            HAVING COALESCE(SUM(i.total_amount), 0) > 0
            ORDER BY c.name;
        `;
        params = [startStr, endStr];
    }

    const result = await db.query(query, params);

    const data = result.rows.map(r => {
        const gross = parseFloat(r.gross_sales || 0);
        const b_discount = parseFloat(r.billing_discount || 0);
        const p_discount = parseFloat(r.payment_discount || 0);
        const net = parseFloat(r.net_sales || 0);
        const totalDiscount = b_discount + p_discount;
        const discountPct = gross > 0 ? (totalDiscount / gross) * 100 : 0;

        return {
            customer_name: r.customer_name,
            total_gross_sales: parseFloat(gross.toFixed(2)),
            billing_discount: parseFloat(b_discount.toFixed(2)),
            payment_discount: parseFloat(p_discount.toFixed(2)),
            total_discount_given: parseFloat(totalDiscount.toFixed(2)),
            net_sales: parseFloat(net.toFixed(2)),
            discount_percentage: parseFloat(discountPct.toFixed(2))
        };
    });

    // Calculate totals
    const totals = data.reduce(
        (acc, row) => ({
            gross_sales: acc.gross_sales + row.total_gross_sales,
            discount: acc.discount + row.total_discount_given,
            net_sales: acc.net_sales + row.net_sales
        }),
        { gross_sales: 0, discount: 0, net_sales: 0 }
    );

    const overallDiscountPct = totals.gross_sales > 0
        ? (totals.discount / totals.gross_sales) * 100
        : 0;

    return {
        title,
        start_date: startStr,
        end_date: endStr,
        totals: {
            overall_gross_sales: parseFloat(totals.gross_sales.toFixed(2)),
            overall_discount_total: parseFloat(totals.discount.toFixed(2)),
            overall_net_revenue: parseFloat(totals.net_sales.toFixed(2)),
            overall_discount_percentage: parseFloat(overallDiscountPct.toFixed(2))
        },
        count: data.length,
        data
    };
};

/**
 * REPORT 5: PAYMENT DELAY REPORT
 * GET /api/reports/payment-delay
 * 
 * Return: Customer Name, Pending Amount, Last Payment Date, Days Since Last Payment
 */
exports.getPaymentDelayReport = async () => {
    const query = `
        SELECT 
            c.id,
            c.name as customer_name,
            COALESCE(SUM(i.total_amount) - COALESCE(SUM(p.amount), 0) - COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id)), 0), 0) as pending_amount,
            MAX(p.payment_date)::DATE as last_payment_date,
            EXTRACT(DAY FROM NOW() - MAX(p.payment_date)) as days_since_last_payment
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        LEFT JOIN payments p ON c.id = p.customer_id
        GROUP BY c.id, c.name
        HAVING COALESCE(SUM(i.total_amount) - COALESCE(SUM(p.amount), 0) - COALESCE((SELECT SUM(amount) FROM payment_adjustments WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id = c.id)), 0), 0) > 0
        ORDER BY days_since_last_payment DESC NULLS LAST, pending_amount DESC;
    `;

    const result = await db.query(query);

    return {
        generated_at: new Date().toISOString(),
        total_customers_with_pending: result.rows.length,
        data: result.rows.map(r => ({
            customer_name: r.customer_name,
            pending_amount: parseFloat(r.pending_amount || 0),
            last_payment_date: r.last_payment_date,
            days_since_last_payment: r.days_since_last_payment
                ? parseInt(r.days_since_last_payment)
                : null
        }))
    };
};

/**
 * REPORT 6: DASHBOARD SUMMARY (Enhanced)
 * GET /api/reports/dashboard-summary
 * 
 * Return comprehensive metrics for dashboard
 */
exports.getDashboardSummary = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const query = `
        SELECT 
            -- Today's collections by method
            (SELECT COALESCE(SUM(amount), 0) FROM payments 
             WHERE payment_method = 'cash' AND DATE(payment_date) = $1::DATE) as today_cash,
            (SELECT COALESCE(SUM(amount), 0) FROM payments 
             WHERE payment_method = 'upi' AND DATE(payment_date) = $1::DATE) as today_upi,
            (SELECT COALESCE(SUM(amount), 0) FROM payments 
             WHERE payment_method = 'bank' AND DATE(payment_date) = $1::DATE) as today_bank,
            (SELECT COALESCE(SUM(amount), 0) FROM payments 
             WHERE payment_method = 'cheque' AND DATE(payment_date) = $1::DATE) as today_cheque,
            
            -- Total pending
            (SELECT COALESCE(SUM(total_amount), 0) - COALESCE(SUM(p_amt), 0) - COALESCE(SUM(a_amt), 0)
             FROM (
                SELECT COALESCE(SUM(total_amount), 0) as total_amount 
                FROM invoices
             ) inv,
             (
                SELECT COALESCE(SUM(amount), 0) as p_amt
                FROM payments
             ) pmt,
             (
                SELECT COALESCE(SUM(amount), 0) as a_amt
                FROM payment_adjustments
             ) adj) as total_pending,
            
            -- Week and month sales
            (SELECT COALESCE(SUM(total_amount), 0) FROM invoices 
             WHERE created_at::DATE >= $2::DATE AND created_at::DATE <= $1::DATE) as total_sales_week,
            (SELECT COALESCE(SUM(total_amount), 0) FROM invoices 
             WHERE created_at::DATE >= $3::DATE AND created_at::DATE <= $1::DATE) as total_sales_month,
            (SELECT COALESCE(SUM(discount_amount), 0) FROM invoices 
             WHERE created_at::DATE >= $3::DATE AND created_at::DATE <= $1::DATE) as total_discount_month,
            
            -- High-risk count (30+ days pending)
            (SELECT COUNT(*) FROM (
                SELECT c.id
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id
                LEFT JOIN payments p ON c.id = p.customer_id
                GROUP BY c.id
                HAVING EXTRACT(DAY FROM NOW() - MAX(i.created_at)) > 30
                    AND SUM(i.total_amount) - COALESCE(SUM(p.amount), 0) > 0
            ) high_risk) as aging_high_risk_count;
    `;

    const result = await db.query(query, [today, weekAgoStr, monthStartStr]);
    const metrics = result.rows[0];

    return {
        date: today,
        today: {
            cash_collected: parseFloat(metrics.today_cash || 0),
            upi_collected: parseFloat(metrics.today_upi || 0),
            bank_collected: parseFloat(metrics.today_bank || 0),
            cheque_collected: parseFloat(metrics.today_cheque || 0),
            total_today: parseFloat((parseFloat(metrics.today_cash || 0) + parseFloat(metrics.today_upi || 0) + parseFloat(metrics.today_bank || 0) + parseFloat(metrics.today_cheque || 0)).toFixed(2))
        },
        pending: {
            total_pending: parseFloat(metrics.total_pending || 0)
        },
        sales: {
            week_sales: parseFloat(metrics.total_sales_week || 0),
            month_sales: parseFloat(metrics.total_sales_month || 0),
            month_discount: parseFloat(metrics.total_discount_month || 0)
        },
        risk: {
            aging_high_risk_count: parseInt(metrics.aging_high_risk_count || 0) || 0
        }
    };
};
