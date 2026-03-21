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
exports.getTodayCashCollection = async (dateParam = null) => {
    const today = dateParam || new Date().toISOString().split('T')[0];

    const query = `
        WITH customer_invoices AS (
            SELECT customer_id, 
                   SUM(total_amount) as total_invoiced,
                   MAX(created_at)::DATE as last_invoice_date
            FROM invoices
            GROUP BY customer_id
        ),
        customer_payments AS (
            SELECT customer_id, SUM(amount) as total_paid
            FROM payments
            WHERE payment_date <= $1::DATE
            GROUP BY customer_id
        ),
        customer_adjustments AS (
            SELECT i.customer_id, SUM(pa.amount) as total_adj
            FROM payment_adjustments pa
            JOIN invoices i ON pa.invoice_id = i.id
            GROUP BY i.customer_id
        )
        SELECT 
            c.name as customer_name,
            p.invoice_id,
            p.amount as payment_amount,
            (COALESCE(ci.total_invoiced, 0) 
             - COALESCE(cp.total_paid, 0)
             - COALESCE(ca.total_adj, 0)
            ) as remaining_pending,
            ci.last_invoice_date
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN customer_invoices ci ON c.id = ci.customer_id
        LEFT JOIN customer_payments cp ON c.id = cp.customer_id
        LEFT JOIN customer_adjustments ca ON c.id = ca.customer_id
        WHERE p.payment_method = 'cash' 
            AND p.payment_date >= $1::DATE AND p.payment_date < ($1::DATE + INTERVAL '1 day')
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
            WITH period_sales AS (
                SELECT customer_id, SUM(total_amount) as total
                FROM invoices
                WHERE is_deleted = false
                  AND created_at >= $1::DATE AND created_at < ($1::DATE + INTERVAL '1 day')
                GROUP BY customer_id
            ),
            period_payments AS (
                SELECT customer_id, SUM(amount) as total
                FROM payments
                WHERE payment_date >= $1::DATE AND payment_date < ($1::DATE + INTERVAL '1 day')
                GROUP BY customer_id
            ),
            period_adjustments AS (
                SELECT i.customer_id, SUM(pa.amount) as total
                FROM payment_adjustments pa
                JOIN invoices i ON pa.invoice_id = i.id
                WHERE i.created_at >= $1::DATE AND i.created_at < ($1::DATE + INTERVAL '1 day')
                GROUP BY i.customer_id
            )
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(ps.total, 0) as total_sales,
                COALESCE(pp.total, 0) as total_paid,
                COALESCE(pa.total, 0) as total_adj
            FROM customers c
            INNER JOIN period_sales ps ON c.id = ps.customer_id
            LEFT JOIN period_payments pp ON c.id = pp.customer_id
            LEFT JOIN period_adjustments pa ON c.id = pa.customer_id
            WHERE c.is_deleted = false
            ORDER BY c.name;
        `;
        params = [startStr];
    } else {
        query = `
            WITH period_sales AS (
                SELECT customer_id, SUM(total_amount) as total
                FROM invoices
                WHERE is_deleted = false
                  AND created_at >= $1::DATE AND created_at < ($2::DATE + INTERVAL '1 day')
                GROUP BY customer_id
            ),
            period_payments AS (
                SELECT customer_id, SUM(amount) as total
                FROM payments
                WHERE payment_date >= $1::DATE AND payment_date < ($2::DATE + INTERVAL '1 day')
                GROUP BY customer_id
            ),
            period_adjustments AS (
                SELECT i.customer_id, SUM(pa.amount) as total
                FROM payment_adjustments pa
                JOIN invoices i ON pa.invoice_id = i.id
                WHERE i.created_at >= $1::DATE AND i.created_at < ($2::DATE + INTERVAL '1 day')
                GROUP BY i.customer_id
            )
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(ps.total, 0) as total_sales,
                COALESCE(pp.total, 0) as total_paid,
                COALESCE(pa.total, 0) as total_adj
            FROM customers c
            INNER JOIN period_sales ps ON c.id = ps.customer_id
            LEFT JOIN period_payments pp ON c.id = pp.customer_id
            LEFT JOIN period_adjustments pa ON c.id = pa.customer_id
            WHERE c.is_deleted = false
            ORDER BY c.name;
        `;
        params = [startStr, endStr];
    }


    const result = await db.query(query, params);

    const totals = result.rows.reduce(
        (acc, row) => {
            const sales = parseFloat(row.total_sales || 0);
            const paid = parseFloat(row.total_paid || 0);
            const adj = parseFloat(row.total_adj || 0);
            return {
                total_sales: acc.total_sales + sales,
                total_paid: acc.total_paid + paid,
                total_pending: acc.total_pending + (sales - paid - adj)
            };
        },
        { total_sales: 0, total_paid: 0, total_pending: 0 }
    );

    // Fetch category breakdown for the period
    const categoryBreakdown = await getCustomerCategoryBreakdown(startDate, endDate);
    const categoryMap = new Map();
    categoryBreakdown.forEach(row => {
        const customerId = parseInt(row.customer_id, 10);
        if (!categoryMap.has(customerId)) {
            categoryMap.set(customerId, []);
        }
        categoryMap.get(customerId).push({
            category_name: row.category_name,
            total_bags: parseInt(row.total_bags || 0, 10),
            category_amount: parseFloat(row.category_amount || 0)
        });
    });

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
        data: result.rows.map(r => {
            const sales = parseFloat(r.total_sales || 0);
            const paid = parseFloat(r.total_paid || 0);
            const adj = parseFloat(r.total_adj || 0);
            return {
                customer_id: r.id,
                customer_name: r.customer_name,
                total_sales: sales,
                total_paid: paid,
                total_pending: parseFloat((sales - paid - adj).toFixed(2)),
                categories: categoryMap.get(r.id) || []
            };
        })
    };
};

/**
 * Get category breakdown per customer for a date range.
 * Uses delivery_quantities when available and falls back to legacy bag columns.
 */
const getCustomerCategoryBreakdown = async (startDate, endDate) => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    try {
        const query = `
            SELECT
                i.customer_id,
                cat.name AS category_name,
                SUM(item_qty.bags)::INTEGER AS total_bags,
                ROUND(SUM(
                    item_qty.bags * COALESCE(
                        dsr.rate,
                        CASE
                            WHEN LOWER(cat.name) = 'medium' THEN br.medium_rate
                            WHEN LOWER(cat.name) IN ('super small', 'super_small') THEN br.super_small_rate
                            ELSE 0
                        END,
                        0
                    )
                )::NUMERIC, 2) AS category_amount
            FROM invoices i
            INNER JOIN delivery_items di
                ON di.delivery_sheet_id = i.delivery_sheet_id
               AND di.customer_id = i.customer_id
            LEFT JOIN billing_rates br
                ON br.delivery_sheet_id = i.delivery_sheet_id
            INNER JOIN LATERAL (
                SELECT dq.category_id, SUM(dq.bags)::INTEGER AS bags
                FROM delivery_quantities dq
                WHERE dq.delivery_item_id = di.id
                GROUP BY dq.category_id

                UNION ALL

                SELECT cat_medium.id, di.medium_bags
                FROM categories cat_medium
                WHERE LOWER(cat_medium.name) = 'medium'
                  AND COALESCE(di.medium_bags, 0) > 0
                  AND NOT EXISTS (
                      SELECT 1
                      FROM delivery_quantities legacy_dq
                      WHERE legacy_dq.delivery_item_id = di.id
                  )

                UNION ALL

                SELECT cat_small.id, di.super_small_bags
                FROM categories cat_small
                WHERE LOWER(cat_small.name) IN ('super small', 'super_small')
                  AND COALESCE(di.super_small_bags, 0) > 0
                  AND NOT EXISTS (
                      SELECT 1
                      FROM delivery_quantities legacy_dq
                      WHERE legacy_dq.delivery_item_id = di.id
                  )
            ) item_qty ON true
            INNER JOIN categories cat
                ON cat.id = item_qty.category_id
            LEFT JOIN delivery_sheet_rates dsr
                ON dsr.delivery_sheet_id = i.delivery_sheet_id
               AND dsr.category_id = item_qty.category_id
            WHERE i.is_deleted = false
              AND i.created_at >= $1::DATE
              AND i.created_at < ($2::DATE + INTERVAL '1 day')
            GROUP BY i.customer_id, cat.name
            ORDER BY i.customer_id, cat.name;
        `;
        const result = await db.query(query, [startStr, endStr]);
        return result.rows;
    } catch (err) {
        // delivery_quantities table may not exist — return empty breakdown
        if (err.code === '42P01') {
            const legacyQuery = `
                SELECT
                    i.customer_id,
                    legacy.category_name,
                    SUM(legacy.bags)::INTEGER AS total_bags,
                    ROUND(SUM(legacy.bags * legacy.rate)::NUMERIC, 2) AS category_amount
                FROM invoices i
                INNER JOIN delivery_items di
                    ON di.delivery_sheet_id = i.delivery_sheet_id
                   AND di.customer_id = i.customer_id
                LEFT JOIN billing_rates br
                    ON br.delivery_sheet_id = i.delivery_sheet_id
                INNER JOIN LATERAL (
                    SELECT 'Medium' AS category_name, COALESCE(di.medium_bags, 0) AS bags, COALESCE(br.medium_rate, 0) AS rate
                    UNION ALL
                    SELECT 'Super Small' AS category_name, COALESCE(di.super_small_bags, 0) AS bags, COALESCE(br.super_small_rate, 0) AS rate
                ) legacy ON legacy.bags > 0
                WHERE i.is_deleted = false
                  AND i.created_at >= $1::DATE
                  AND i.created_at < ($2::DATE + INTERVAL '1 day')
                GROUP BY i.customer_id, legacy.category_name
                ORDER BY i.customer_id, legacy.category_name;
            `;

            const legacyResult = await db.query(legacyQuery, [startStr, endStr]);
            return legacyResult.rows;
        }
        throw err;
    }
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
        WITH invoice_totals AS (
            SELECT customer_id,
                   SUM(total_amount) as total_invoiced,
                   MAX(created_at)::DATE as last_invoice_date,
                   EXTRACT(DAY FROM NOW() - MAX(created_at)) as days_pending
            FROM invoices
            GROUP BY customer_id
        ),
        payment_totals AS (
            SELECT customer_id, SUM(amount) as total_paid
            FROM payments
            GROUP BY customer_id
        ),
        adjustment_totals AS (
            SELECT i.customer_id, SUM(pa.amount) as total_adj
            FROM payment_adjustments pa
            JOIN invoices i ON pa.invoice_id = i.id
            GROUP BY i.customer_id
        ),
        customer_pending AS (
            SELECT 
                c.id,
                c.name,
                (COALESCE(it.total_invoiced, 0) - COALESCE(pt.total_paid, 0) - COALESCE(at2.total_adj, 0)) as pending_amount,
                it.last_invoice_date,
                COALESCE(it.days_pending, 0) as days_pending
            FROM customers c
            INNER JOIN invoice_totals it ON c.id = it.customer_id
            LEFT JOIN payment_totals pt ON c.id = pt.customer_id
            LEFT JOIN adjustment_totals at2 ON c.id = at2.customer_id
            WHERE (COALESCE(it.total_invoiced, 0) - COALESCE(pt.total_paid, 0) - COALESCE(at2.total_adj, 0)) > 0
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
            WITH period_adjustments AS (
                SELECT i.customer_id, SUM(pa.amount) as total_adj
                FROM payment_adjustments pa
                JOIN invoices i ON pa.invoice_id = i.id
                WHERE i.created_at >= $1::DATE AND i.created_at < ($1::DATE + INTERVAL '1 day')
                GROUP BY i.customer_id
            )
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.subtotal + i.sgst_amount + i.cgst_amount), 0) as gross_sales,
                COALESCE(SUM(i.discount_amount), 0) as billing_discount,
                COALESCE(padj.total_adj, 0) as payment_discount,
                COALESCE(SUM(i.total_amount), 0) as net_sales
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND i.created_at >= $1::DATE AND i.created_at < ($1::DATE + INTERVAL '1 day')
            LEFT JOIN period_adjustments padj ON c.id = padj.customer_id
            GROUP BY c.id, c.name, padj.total_adj
            HAVING COALESCE(SUM(i.total_amount), 0) > 0
            ORDER BY c.name;
        `;
        params = [startStr];
    } else {
        query = `
            WITH period_adjustments AS (
                SELECT i.customer_id, SUM(pa.amount) as total_adj
                FROM payment_adjustments pa
                JOIN invoices i ON pa.invoice_id = i.id
                WHERE i.created_at >= $1::DATE AND i.created_at < ($2::DATE + INTERVAL '1 day')
                GROUP BY i.customer_id
            )
            SELECT 
                c.id,
                c.name as customer_name,
                COALESCE(SUM(i.subtotal + i.sgst_amount + i.cgst_amount), 0) as gross_sales,
                COALESCE(SUM(i.discount_amount), 0) as billing_discount,
                COALESCE(padj.total_adj, 0) as payment_discount,
                COALESCE(SUM(i.total_amount), 0) as net_sales
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id 
                AND i.created_at >= $1::DATE AND i.created_at < ($2::DATE + INTERVAL '1 day')
            LEFT JOIN period_adjustments padj ON c.id = padj.customer_id
            GROUP BY c.id, c.name, padj.total_adj
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
        WITH invoice_totals AS (
            SELECT customer_id, SUM(total_amount) as total_invoiced
            FROM invoices
            GROUP BY customer_id
        ),
        payment_totals AS (
            SELECT customer_id, 
                   SUM(amount) as total_paid,
                   MAX(payment_date)::DATE as last_payment_date,
                   EXTRACT(DAY FROM NOW() - MAX(payment_date)) as days_since_last_payment
            FROM payments
            GROUP BY customer_id
        ),
        adjustment_totals AS (
            SELECT i.customer_id, SUM(pa.amount) as total_adj
            FROM payment_adjustments pa
            JOIN invoices i ON pa.invoice_id = i.id
            GROUP BY i.customer_id
        )
        SELECT 
            c.id,
            c.name as customer_name,
            (COALESCE(it.total_invoiced, 0) - COALESCE(pt.total_paid, 0) - COALESCE(at2.total_adj, 0)) as pending_amount,
            pt.last_payment_date,
            pt.days_since_last_payment
        FROM customers c
        INNER JOIN invoice_totals it ON c.id = it.customer_id
        LEFT JOIN payment_totals pt ON c.id = pt.customer_id
        LEFT JOIN adjustment_totals at2 ON c.id = at2.customer_id
        WHERE (COALESCE(it.total_invoiced, 0) - COALESCE(pt.total_paid, 0) - COALESCE(at2.total_adj, 0)) > 0
        ORDER BY pt.days_since_last_payment DESC NULLS LAST, pending_amount DESC;
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
        WITH today_payments AS (
            SELECT 
                COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cash'), 0) as today_cash,
                COALESCE(SUM(amount) FILTER (WHERE payment_method = 'upi'), 0) as today_upi,
                COALESCE(SUM(amount) FILTER (WHERE payment_method = 'bank'), 0) as today_bank,
                COALESCE(SUM(amount) FILTER (WHERE payment_method = 'cheque'), 0) as today_cheque
            FROM payments 
            WHERE payment_date >= $1::DATE AND payment_date < ($1::DATE + INTERVAL '1 day')
        ),
        pending_calc AS (
            SELECT 
                (SELECT COALESCE(SUM(total_amount), 0) FROM invoices)
                - (SELECT COALESCE(SUM(amount), 0) FROM payments)
                - (SELECT COALESCE(SUM(amount), 0) FROM payment_adjustments)
                as total_pending
        ),
        sales_metrics AS (
            SELECT 
                COALESCE(SUM(total_amount) FILTER (
                    WHERE created_at >= $2::DATE AND created_at < ($1::DATE + INTERVAL '1 day')
                ), 0) as total_sales_week,
                COALESCE(SUM(total_amount) FILTER (
                    WHERE created_at >= $3::DATE AND created_at < ($1::DATE + INTERVAL '1 day')
                ), 0) as total_sales_month,
                COALESCE(SUM(discount_amount) FILTER (
                    WHERE created_at >= $3::DATE AND created_at < ($1::DATE + INTERVAL '1 day')
                ), 0) as total_discount_month
            FROM invoices
        ),
        high_risk AS (
            SELECT COUNT(*) as cnt FROM (
                SELECT it.customer_id
                FROM (
                    SELECT customer_id, SUM(total_amount) as total_inv, MAX(created_at) as last_inv
                    FROM invoices GROUP BY customer_id
                ) it
                LEFT JOIN (
                    SELECT customer_id, SUM(amount) as total_paid FROM payments GROUP BY customer_id
                ) pt ON it.customer_id = pt.customer_id
                WHERE EXTRACT(DAY FROM NOW() - it.last_inv) > 30
                  AND (it.total_inv - COALESCE(pt.total_paid, 0)) > 0
            ) hr
        )
        SELECT 
            tp.today_cash, tp.today_upi, tp.today_bank, tp.today_cheque,
            pc.total_pending,
            sm.total_sales_week, sm.total_sales_month, sm.total_discount_month,
            hr.cnt as aging_high_risk_count
        FROM today_payments tp, pending_calc pc, sales_metrics sm, high_risk hr;
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
