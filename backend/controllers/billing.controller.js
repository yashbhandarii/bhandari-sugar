const billingService = require('../services/billing.service');
const billingValidations = require('../services/billing.validations');

/**
 * Generate invoices with manager-entered rates and optional discounts
 *
 * Request body:
 * {
 *   medium_rate: 1050,
 *   super_small_rate: 1260,
 *   discounts: {
 *     customer_id: { type: "percentage"|"fixed", value: 10|2000 }
 *   }
 * }
 */
exports.generateInvoices = async (req, res) => {
    const { delivery_sheet_id } = req.params;
    const billingData = req.body || {};

    try {
        // Validate that rates are provided
        if (!billingData.medium_rate || !billingData.super_small_rate) {
            return res.status(400).json({
                error: 'Manager must enter Medium Rate and Super Small Rate during billing generation'
            });
        }

        // Validate rates format
        try {
            billingValidations.validateRates(billingData.medium_rate, billingData.super_small_rate);
        } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
        }

        const result = await billingService.generateInvoices(delivery_sheet_id, req.userId, billingData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error generating invoices:', error);

        // Check if it's a custom validation error
        if (error.message.includes('Billing already generated') ||
            error.message.includes('Delivery sheet not found') ||
            error.message.includes('Delivery sheet must be submitted') ||
            error.message.includes('No items found') ||
            error.message.includes('No billable items') ||
            error.message.includes('Manager must enter') ||
            error.message.includes('cannot') ||
            error.message.includes('Discount')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

exports.getInvoicesBySheetId = async (req, res) => {
    const { delivery_sheet_id } = req.params;
    try {
        const invoices = await billingService.getInvoicesBySheetId(delivery_sheet_id);
        res.json(invoices);
    } catch (error) {
        console.error('Error getting invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Preview invoices with manager-entered rates and optional discounts
 *
 * Request body:
 * {
 *   medium_rate: 1050,
 *   super_small_rate: 1260,
 *   discounts: {
 *     customer_id: { type: "percentage"|"fixed", value: 10|2000 }
 *   }
 * }
 */
exports.previewBilling = async (req, res) => {
    const { delivery_sheet_id } = req.params;
    const billingData = req.body || {};

    try {
        // Validate that rates are provided
        if (!billingData.medium_rate || !billingData.super_small_rate) {
            return res.status(400).json({
                error: 'Manager must enter Medium Rate and Super Small Rate'
            });
        }

        // Validate rates format
        try {
            billingValidations.validateRates(billingData.medium_rate, billingData.super_small_rate);
        } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
        }

        const result = await billingService.previewInvoices(delivery_sheet_id, billingData);
        res.json(result);
    } catch (error) {
        console.error('Error previewing billing:', error);

        if (error.message.includes('Delivery sheet not found') ||
            error.message.includes('Manager must enter') ||
            error.message.includes('cannot')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

exports.getCustomerBilling = async (req, res) => {
    const { customer_id } = req.params;
    try {
        const history = await billingService.getCustomerBilling(customer_id);
        res.json(history);
    } catch (error) {
        console.error('Error getting customer billing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
