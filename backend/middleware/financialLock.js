const db = require('../db');

/**
 * Middleware: Enforce Financial Year Lock Policies
 * Validates that the requested DATE context falls within an active (open) Financial Year.
 * @param {string} dateField - The path in req object mapping to the target date. 
 */
const requireOpenFinancialYear = (dateExtractor = (req) => new Date()) => {
    return async (req, res, next) => {
        try {
            const targetDate = new Date(dateExtractor(req)).toISOString().split('T')[0];

            // 1. Fetch the exact financial year matching this target date
            const yearRes = await db.query(
                `SELECT * FROM financial_years 
                 WHERE $1::DATE >= start_date AND $1::DATE <= end_date 
                 LIMIT 1`,
                [targetDate]
            );

            if (yearRes.rows.length === 0) {
                // If there's no matching year defined at all...
                return res.status(400).json({
                    error: `No defined financial year handles the date: ${targetDate}. Operations blocked.`
                });
            }

            const financialYear = yearRes.rows[0];

            // 2. Strict Lock validation
            if (financialYear.is_closed) {
                return res.status(403).json({
                    error: `Financial Year (${financialYear.year_label}) is CLOSED. Modifications are permanently locked.`
                });
            }

            // 3. Optional Soft Lock validation
            if (financialYear.is_soft_locked && req.userRole !== 'owner') {
                return res.status(403).json({
                    error: `Financial Year (${financialYear.year_label}) is locked for auditing. Only the Owner can modify records right now.`
                });
            }

            // Valid constraints met
            req.financial_year = financialYear;
            next();
        } catch (error) {
            console.error('Financial Lock Check Error:', error);
            res.status(500).json({ error: 'Failed to evaluate financial year locks' });
        }
    };
};

module.exports = {
    requireOpenFinancialYear
};
