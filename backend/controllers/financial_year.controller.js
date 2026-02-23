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
