const reportService = require('../services/report.service');
const advancedReportService = require('../services/advanced-report.service');

exports.getDashboardSummary = async (req, res) => {
    try {
        const summary = await reportService.getDashboardSummary();
        res.json(summary);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOwnerDashboard = async (req, res) => {
    // This was the aggregate one, keep it or replace? 
    // User requested specific APIs. I will keep it for reference or remove if conflicting.
    // I'll leave it and add the specific ones.
    try {
        const dashboard = await reportService.getOwnerDashboard();
        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching owner dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOwnerSummary = async (req, res) => {
    try {
        const data = await reportService.getOwnerDashboardSummary();
        res.json(data);
    } catch (error) {
        console.error('Error fetching owner summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPaymentMethodSummary = async (req, res) => {
    try {
        const data = await reportService.getPaymentMethodSummary();
        res.json(data);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getWeeklySales = async (req, res) => {
    try {
        const data = await reportService.getWeeklySales();
        res.json(data);
    } catch (error) {
        console.error('Error fetching weekly sales:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getRiskyCustomers = async (req, res) => {
    try {
        const data = await reportService.getRiskyCustomers();
        res.json(data);
    } catch (error) {
        console.error('Error fetching risky customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDayReport = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });
        const data = await reportService.getDayReport(date);
        res.json(data);
    } catch (error) {
        console.error('Error fetching day report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getWeekReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and End dates are required' });
        const data = await reportService.getWeekReport(start, end);
        res.json(data);
    } catch (error) {
        console.error('Error fetching week report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getMonthReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ error: 'Month and Year are required' });
        const data = await reportService.getMonthReport(month, year);
        res.json(data);
    } catch (error) {
        console.error('Error fetching month report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ════════════════════════════════════════════════════════
// ADVANCED REPORT CONTROLLERS (NEW)
// ════════════════════════════════════════════════════════

/**
 * REPORT 1: TODAY'S CASH COLLECTION
 * GET /api/reports/today-cash
 */
exports.getTodayCashCollection = async (req, res) => {
    try {
        const { date } = req.query; // optional — defaults to today in service
        const data = await advancedReportService.getTodayCashCollection(date || null);
        res.json(data);
    } catch (error) {
        console.error('Error fetching today cash collection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REPORT 2: CUSTOMER SUMMARY
 * GET /api/reports/customer-summary?type=day|week|month&date=YYYY-MM-DD
 */
exports.getCustomerSummary = async (req, res) => {
    try {
        const { type = 'month', date } = req.query;

        const validTypes = ['day', 'week', 'month'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid type. Must be day, week, or month' });
        }

        const data = await advancedReportService.getCustomerSummary(type, date);
        res.json(data);
    } catch (error) {
        console.error('Error fetching customer summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REPORT 3: AGING REPORT
 * GET /api/reports/aging
 */
exports.getAgingReport = async (req, res) => {
    try {
        const data = await advancedReportService.getAgingReport();
        res.json(data);
    } catch (error) {
        console.error('Error fetching aging report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REPORT 4: DISCOUNT IMPACT REPORT
 * GET /api/reports/discount-impact?type=day|week|month&date=YYYY-MM-DD
 */
exports.getDiscountImpactReport = async (req, res) => {
    try {
        const { type = 'month', date } = req.query;

        const validTypes = ['day', 'week', 'month'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid type. Must be day, week, or month' });
        }

        const data = await advancedReportService.getDiscountImpactReport(type, date);
        res.json(data);
    } catch (error) {
        console.error('Error fetching discount impact report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REPORT 5: PAYMENT DELAY REPORT
 * GET /api/reports/payment-delay
 */
exports.getPaymentDelayReport = async (req, res) => {
    try {
        const data = await advancedReportService.getPaymentDelayReport();
        res.json(data);
    } catch (error) {
        console.error('Error fetching payment delay report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * REPORT 6: ENHANCED DASHBOARD SUMMARY
 * GET /api/reports/dashboard-summary-advanced
 */
exports.getDashboardSummaryAdvanced = async (req, res) => {
    try {
        const data = await advancedReportService.getDashboardSummary();
        res.json(data);
    } catch (error) {
        console.error('Error fetching dashboard summary advanced:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { type, date, month, year, start, end } = req.query;
        let data = [];
        let dateRange = '';
        let reportTitle = '';
        let summary = null;
        let pdfOpts = null; // Used for custom formats like customer-ledger
        const pdfService = require('../services/pdf.service');

        // Legacy report types
        if (type === 'day') {
            if (!date) return res.status(400).json({ error: 'Date is required' });
            data = await reportService.getDayReport(date);
            dateRange = date;
            reportTitle = 'Day Report';
        } else if (type === 'week') {
            if (!start || !end) return res.status(400).json({ error: 'Start and End dates required' });
            data = await reportService.getWeekReport(start, end);
            dateRange = `${start} to ${end}`;
            reportTitle = 'Week Report';
        } else if (type === 'month') {
            if (!month || !year) return res.status(400).json({ error: 'Month and Year required' });
            data = await reportService.getMonthReport(month, year);
            dateRange = `${month}/${year}`;
            reportTitle = 'Month Report';
        }

        // Advanced report types
        else if (type === 'today-cash') {
            const cashData = await advancedReportService.getTodayCashCollection(date || null);
            reportTitle = "Today's Cash Collection";
            dateRange = cashData.date;
            summary = { total_cash_collected: cashData.total_cash_collected };
            data = cashData.data.map(row => ({
                customer_name: row.customer_name,
                invoice_id: row.invoice_id ? `#${row.invoice_id}` : '-',
                payment_amount: row.payment_amount,
                remaining_pending: row.remaining_pending,
                last_invoice_date: row.last_invoice_date
                    ? new Date(row.last_invoice_date).toLocaleDateString('en-IN')
                    : '-'
            }));
        } else if (type === 'aging') {
            const agingData = await advancedReportService.getAgingReport();
            reportTitle = 'Aging Report';
            dateRange = new Date().toISOString().split('T')[0];
            // Flatten aging data for PDF
            const items = [];
            Object.keys(agingData.by_bucket).forEach(bucket => {
                items.push({
                    bucket: bucket,
                    total: agingData.by_bucket[bucket].total,
                    count: agingData.by_bucket[bucket].count,
                    items: agingData.by_bucket[bucket].data
                });
            });
            data = items;
        } else if (type === 'discount') {
            const discountData = await advancedReportService.getDiscountImpactReport(date ? 'day' : 'month', date);
            reportTitle = 'Discount Impact Report';
            dateRange = discountData.start_date + ' to ' + discountData.end_date;
            data = discountData.data;
        } else if (type === 'summary') {
            const summaryData = await advancedReportService.getDashboardSummary();
            reportTitle = 'Dashboard Summary Report';
            dateRange = new Date().toISOString().split('T')[0];
            data = [summaryData];
        } else if (type === 'customer-summary') {
            const period = req.query.period || (date ? 'day' : 'month');
            const customerData = await advancedReportService.getCustomerSummary(period, date);
            reportTitle = 'Customer Summary Report';
        } else if (type === 'customer-ledger') {
            const customerId = req.query.customerId;
            if (!customerId) return res.status(400).json({ error: 'customerId required for ledger' });

            const db = require('../db');
            const custRes = await db.query('SELECT * FROM customers WHERE id = $1', [customerId]);
            if (custRes.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

            const customer = custRes.rows[0];

            // Get Payments
            const payRes = await db.query('SELECT * FROM payments WHERE customer_id = $1', [customerId]);
            const payments = payRes.rows.map(p => ({
                date: p.payment_date,
                type: 'payment',
                subType: p.payment_method,
                amount: parseFloat(p.amount),
                credit: parseFloat(p.amount),
                debit: 0,
                created_at: p.created_at
            }));

            // Get Invoices
            const invRes = await db.query('SELECT * FROM invoices WHERE customer_id = $1 AND is_deleted = false', [customerId]);
            const invoices = invRes.rows.map(i => ({
                date: i.created_at,
                type: 'invoice',
                subType: `Sheet #${i.delivery_sheet_id}`,
                amount: parseFloat(i.total_amount),
                credit: 0,
                debit: parseFloat(i.total_amount),
                created_at: i.created_at
            }));

            // Merge and Sort by Date (Oldest First)
            const all = [...payments, ...invoices].sort((a, b) => new Date(a.date) - new Date(b.date));

            // Calculate Running Balance
            let runningBalance = 0;
            const ledger = all.map(txn => {
                runningBalance = runningBalance + txn.debit - txn.credit;
                return { ...txn, balance: runningBalance };
            });

            reportTitle = 'Customer Statement';
            dateRange = 'All Time';
            data = {
                customer: customer,
                transactions: ledger,
                final_balance: runningBalance
            };
            pdfOpts = { reportType: reportTitle, dateRange, customerData: data };

        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        const optsToPass = pdfOpts || { reportType: reportTitle, dateRange, items: data, summary };

        pdfService.generateReportPDF(optsToPass, res);

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
};
