const deliveryService = require('../services/delivery.service');

// Get all delivery sheets
exports.getAllDeliverySheets = async (req, res) => {
    try {
        const userId = req.userRole === 'driver' ? req.userId : null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await deliveryService.getAllDeliverySheets(userId, page, limit);
        res.json(result);
    } catch (error) {
        console.error('Error getting delivery sheets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get last rates
exports.getLastRates = async (req, res) => {
    try {
        const rates = await deliveryService.getLastRates();
        res.json(rates);
    } catch (error) {
        console.error('Error getting last rates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create a new delivery sheet
exports.createDeliverySheet = async (req, res) => {
    try {
        // We expect the frontend to have fetched rates and allowed editing.
        // But if they are passed here, we save them.
        const sheet = await deliveryService.createDeliverySheet(req.body);
        res.status(201).json(sheet);
    } catch (error) {
        console.error('Error creating delivery sheet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add item to delivery sheet
exports.addItemInDeliverySheet = async (req, res) => {
    try {
        const item = await deliveryService.addItemInDeliverySheet(req.body);
        res.status(201).json(item);
    } catch (error) {
        console.error('Error adding delivery item:', error);
        res.status(400).json({ error: error.message || 'Error adding delivery item' });
    }
};

// Update delivery sheet rates (draft only)
exports.updateSheetRates = async (req, res) => {
    const { id } = req.params;
    try {
        const sheet = await deliveryService.updateSheetRates(id, req.body);
        res.json(sheet);
    } catch (error) {
        console.error('Error updating sheet rates:', error);
        res.status(400).json({ error: error.message || 'Bad request' });
    }
};

// Get delivery sheet by ID
exports.getDeliverySheetById = async (req, res) => {
    const { id } = req.params;
    try {
        const sheet = await deliveryService.getDeliverySheetById(id);
        if (!sheet) {
            return res.status(404).json({ error: 'Delivery sheet not found' });
        }
        res.json(sheet);
    } catch (error) {
        console.error('Error getting delivery sheet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Submit delivery sheet
exports.submitDeliverySheet = async (req, res) => {
    const { id } = req.params;
    try {
        await deliveryService.submitDeliverySheet(id);
        res.json({ message: 'Delivery sheet submitted successfully' });
    } catch (error) {
        console.error('Error submitting delivery sheet:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// Download delivery sheet PDF
exports.downloadSheet = async (req, res) => {
    const { id } = req.params;
    try {
        const sheet = await deliveryService.getDeliverySheetById(id);
        if (!sheet) {
            return res.status(404).json({ error: 'Delivery sheet not found' });
        }

        // Security Check: Only Creator or Manager/Owner can download
        if (req.userRole === 'driver' && sheet.created_by !== req.userId) {
            return res.status(403).json({ error: 'Access denied. You can only download your own sheets.' });
        }

        const pdfService = require('../services/pdf.service');
        pdfService.generateDeliverySheetPDF(sheet, res);

    } catch (error) {
        console.error('Error downloading sheet:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
};



// Delete delivery sheet
exports.deleteDeliverySheet = async (req, res) => {
    const { id } = req.params;
    try {
        await deliveryService.deleteDeliverySheet(id, req.userId);
        res.json({ message: 'Delivery sheet deleted successfully' });
    } catch (error) {
        console.error('Error deleting delivery sheet:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
