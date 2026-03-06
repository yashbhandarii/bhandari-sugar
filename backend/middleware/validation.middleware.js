const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(e => e.msg)
        });
    }
    next();
};

exports.validatePayment = [
    body('customer_id')
        .notEmpty().withMessage('Customer is required')
        .isInt().withMessage('Customer ID must be an integer'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('payment_method')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['cash', 'upi', 'cheque', 'bank']).withMessage('Invalid payment method'),
    validate
];

exports.validateDeliverySheet = [
    body('truck_number')
        .notEmpty().withMessage('Truck number is required'),
    validate
];

exports.validateDeliveryItem = [
    body('delivery_sheet_id')
        .notEmpty().withMessage('Delivery sheet ID is required'),
    body('customer_id')
        .notEmpty().withMessage('Customer ID is required'),
    body('medium_bags')
        .optional()
        .isInt({ min: 0 }).withMessage('Medium bags must be >= 0'),
    body('super_small_bags')
        .optional()
        .isInt({ min: 0 }).withMessage('Super small bags must be >= 0'),
    validate
];

exports.validateCustomer = [
    body('name')
        .notEmpty().withMessage('Name is required'),
    body('mobile')
        .notEmpty().withMessage('Mobile is required')
        .matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    validate
];

// ─── Billing ───────────────────────────────────────────────────────────────

exports.validateBillingRates = [
    body('medium_rate')
        .notEmpty().withMessage('Medium rate is required')
        .isFloat({ min: 1 }).withMessage('Medium rate must be a positive number'),
    body('super_small_rate')
        .notEmpty().withMessage('Super small rate is required')
        .isFloat({ min: 1 }).withMessage('Super small rate must be a positive number'),
    validate
];

// ─── Godown ────────────────────────────────────────────────────────────────

exports.validateGodownStock = [
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['medium', 'super_small']).withMessage('Category must be medium or super_small'),
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validate
];

exports.validateGodownInvoice = [
    body('customer_name')
        .notEmpty().withMessage('Customer name is required'),
    body('total_amount')
        .notEmpty().withMessage('Total amount is required')
        .isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description')
        .notEmpty().withMessage('Each item must have a description'),
    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Each item quantity must be >= 1'),
    body('items.*.rate')
        .isFloat({ min: 0 }).withMessage('Each item rate must be >= 0'),
    validate
];

exports.validateGodownPayment = [
    body('godown_invoice_id')
        .notEmpty().withMessage('Invoice ID is required')
        .isInt().withMessage('Invoice ID must be an integer'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('payment_method')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['cash', 'upi', 'cheque', 'bank']).withMessage('Invalid payment method'),
    validate
];

