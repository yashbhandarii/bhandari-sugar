const { body, validationResult } = require('express-validator');

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
