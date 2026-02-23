const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const { requireOpenFinancialYear } = require('../middleware/financialLock');

router.use(verifyToken);

// POST /api/payments (Add Payment)
router.post(
    '/',
    validationMiddleware.validatePayment,
    requireOpenFinancialYear(req => req.body.payment_date || new Date()),
    paymentController.addPayment
);

// GET /api/payments/pending/:customer_id
router.get('/pending/:customer_id', paymentController.getCustomerPending);

// GET /api/payments/customer/:customer_id
router.get('/customer/:customer_id', paymentController.getPaymentsByCustomer);

module.exports = router;
