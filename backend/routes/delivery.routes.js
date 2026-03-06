const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const { requireOpenFinancialYear } = require('../middleware/financialLock');

router.use(verifyToken);

// GET /api/delivery-sheets
router.get('/', deliveryController.getAllDeliverySheets);

// GET /api/delivery-sheets/rates/last
router.get('/rates/last', deliveryController.getLastRates);

// GET /api/delivery-sheets/stock-summary - bags delivered per category (active year)
router.get('/stock-summary', deliveryController.getDeliveryStockSummary);

// POST /api/delivery-sheets
router.post('/',
    validationMiddleware.validateDeliverySheet,
    requireOpenFinancialYear(req => req.body.date),
    deliveryController.createDeliverySheet
);

// POST /api/delivery-sheets/items
// It's technically editing the active sheet, which needs the sheet's date.
// But as a simplification, if we restrict creation and submission by current time, 
// we optionally can verify the specific sheet's date here. 
// For now, we will enforce lock checking via the current processing time, 
// unless we lookup the sheet directly. We will leave items open and lock submission.
router.post('/items', validationMiddleware.validateDeliveryItem, deliveryController.addItemInDeliverySheet);

// PUT /api/delivery-sheets/items/:itemId (update quantities for an existing item)
router.put('/items/:itemId', deliveryController.updateItemInDeliverySheet);

// GET /api/delivery-sheets/:id/download
router.get('/:id/download', deliveryController.downloadSheet);

// PATCH /api/delivery-sheets/:id (rates for draft sheets)
router.patch('/:id', deliveryController.updateSheetRates);

// GET /api/delivery-sheets/:id
router.get('/:id', deliveryController.getDeliverySheetById);

// POST /api/delivery-sheets/:id/submit
router.post('/:id/submit', deliveryController.submitDeliverySheet);

// DELETE /api/delivery-sheets/:id (manager/owner can delete any draft; driver can delete their own draft)
router.delete('/:id', deliveryController.deleteDeliverySheet);

module.exports = router;
