const financialYearService = require('../services/financial_year.service');

exports.getAllYears = async (req, res) => {
    try {
        const years = await financialYearService.getAllYears();
        res.json(years);
    } catch (error) {
        console.error('Error fetching financial years:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getActiveYear = async (req, res) => {
    try {
        const year = await financialYearService.getActiveYear();
        // Return 200 with null instead of 404 to avoid browser console errors
        res.json(year || null);
    } catch (error) {
        console.error('Error fetching active year:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createYear = async (req, res) => {
    try {
        const { year_label, start_date, end_date } = req.body;
        const newYear = await financialYearService.createYear({
            year_label,
            start_date,
            end_date,
            user_id: req.userId
        });
        res.status(201).json(newYear);
    } catch (error) {
        console.error('Error creating financial year:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.closeYear = async (req, res) => {
    try {
        const { id } = req.params;
        const summary = await financialYearService.closeYear(id, req.userId);
        res.json({ message: 'Financial year closed successfully', summary });
    } catch (error) {
        console.error('Error closing financial year:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.toggleSoftLock = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_soft_locked } = req.body;
        const year = await financialYearService.toggleSoftLock(id, is_soft_locked, req.userId);
        res.json({ message: `Financial year soft lock set to ${is_soft_locked}`, year });
    } catch (error) {
        console.error('Error toggling soft lock:', error);
        res.status(400).json({ error: error.message });
    }
};

// Download full PDF report for a financial year (works for both open and closed years)
exports.downloadYearReport = async (req, res) => {
    try {
        const { id } = req.params;
        const pdfBuffer = await financialYearService.generateYearClosePDF(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="financial_year_${id}_report.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (error) {
        console.error('Error generating year report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
};

// Download full JSON export of all year data
exports.downloadYearJSON = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await financialYearService.generateYearCloseJSON(id);
        const json = JSON.stringify(data, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="financial_year_${id}_export.json"`);
        res.setHeader('Content-Length', Buffer.byteLength(json));
        res.end(json);
    } catch (error) {
        console.error('Error generating year JSON:', error);
        res.status(500).json({ error: error.message || 'Failed to generate JSON export' });
    }
};

// Permanently delete all transactional data (owner only, year must be closed)
exports.purgeYearData = async (req, res) => {
    try {
        const { id } = req.params;
        await financialYearService.purgeYearData(id, req.userId);
        res.json({ message: 'All transactional data permanently deleted. App is reset for the new year.' });
    } catch (error) {
        console.error('Error purging year data:', error);
        res.status(400).json({ error: error.message || 'Failed to purge data' });
    }
};
