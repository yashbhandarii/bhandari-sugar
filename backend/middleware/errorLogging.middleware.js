/**
 * Error Logging Middleware
 * Captures and logs all errors in a structured format
 */

const logger = require('../utils/logger');

/**
 * Enhanced error logging middleware that wraps the standard error handler
 * Logs all errors with context before passing to error handler
 */
const errorLoggingMiddleware = (err, req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const endpoint = `${req.method} ${req.path}`;
    
    // Log the error with full context
    logger.apiError(endpoint, err.statusCode || 500, err.message, {
        method: req.method,
        path: req.path,
        clientIp,
        userId: req.userId,
        errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Continue to next error handler
    next(err);
};

module.exports = errorLoggingMiddleware;
