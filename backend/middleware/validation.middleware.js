const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn('Validation Failed:', {
            path: req.path,
            method: req.method,
            errors: errors.array().map(e => e.msg)
        });
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
        .isIn(['Medium', 'Super Small']).withMessage('Category must be Medium or Super Small'),
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validate
];

exports.validateGodownInvoice = [
    body().custom((value, { req }) => {
        if (!req.body.customer_id && !req.body.customer_name) {
            throw new Error('Customer name is required');
        }
        if (req.body.customer_id && isNaN(req.body.customer_id)) {
            throw new Error('Customer ID must be an integer');
        }
        if (!req.body.customer_id && !req.body.customer_mobile) {
            throw new Error('Customer mobile is required');
        }
        return true;
    }),
    body('customer_name')
        .custom((value, { req }) => {
            if (!req.body.customer_id && !value?.trim()) {
                throw new Error('Customer name is required');
            }
            return true;
        }),
    body('customer_mobile')
        .custom((value, { req }) => {
            if (!req.body.customer_id && !/^\d{10}$/.test((value || '').trim())) {
                throw new Error('Customer mobile must be exactly 10 digits');
            }
            return true;
        }),
    body('invoice_date')
        .notEmpty().withMessage('Invoice date is required')
        .isISO8601().withMessage('Invalid date format'),
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['Medium', 'Super Small']).withMessage('Category must be Medium or Super Small'),
    body('bags')
        .notEmpty().withMessage('Bags is required')
        .isInt({ min: 1 }).withMessage('Bags must be at least 1'),
    body('rate')
        .notEmpty().withMessage('Rate is required')
        .isFloat({ min: 0.01 }).withMessage('Rate must be greater than 0'),
    body('discount_amount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Discount amount must be >= 0'),
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

