const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireOpenFinancialYear } = require('../middleware/financialLock');

router.use(verifyToken);

// POST /api/billing/generate/:delivery_sheet_id
router.post(
    '/generate/:delivery_sheet_id',
    requireOpenFinancialYear(req => new Date()), // Generation happens matching "now"
    billingController.generateInvoices
);

// GET /api/billing/sheet/:delivery_sheet_id
router.get('/sheet/:delivery_sheet_id', billingController.getInvoicesBySheetId);

// POST /api/billing/preview/:delivery_sheet_id
router.post('/preview/:delivery_sheet_id', billingController.previewBilling);

// GET /api/billing/customer/:customer_id
router.get('/customer/:customer_id', billingController.getCustomerBilling);

module.exports = router;
