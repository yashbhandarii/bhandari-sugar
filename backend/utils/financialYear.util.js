const financialYearService = require('../services/financial_year.service');

/**
 * Validates if a given date falls within the currently active financial year.
 * @param {Date|string} transactionDate 
 * @returns {Promise<Object>} The active financial year object if valid
 * @throws {Error} if no active year exists or date is outside the active year bounds
 */
exports.validateTransactionDate = async (transactionDate) => {
    const date = new Date(transactionDate);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid transaction date');
    }

    const activeYear = await financialYearService.getActiveYear();
    if (!activeYear) {
        throw new Error('No active financial year found. Please create or open a financial year to proceed with transactions.');
    }

    // Adjust boundaries to cover entire days
    const startDate = new Date(activeYear.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(activeYear.end_date);
    endDate.setHours(23, 59, 59, 999);

    if (date < startDate || date > endDate) {
        throw new Error(`Transaction date (${date.toLocaleDateString()}) falls outside the active financial year (${activeYear.year_label}).`);
    }

    return activeYear;
};
