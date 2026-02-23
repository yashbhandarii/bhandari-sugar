const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');

// Validation middleware for login
const loginValidation = [
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Validation error handler middleware
const validationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({ field: err.param, message: err.msg }))
        });
    }
    next();
};

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, validationHandler, authController.login);

module.exports = router;
