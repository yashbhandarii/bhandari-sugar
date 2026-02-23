/**
 * Structured Logger Utility
 * Provides consistent logging across the application with timestamps and severity levels
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

const getTimestamp = () => new Date().toISOString();

const formatLog = (level, message, data = {}) => {
    return {
        timestamp: getTimestamp(),
        level,
        message,
        ...data
    };
};

const logger = {
    /**
     * Log error with context
     * @param {string} message - Error message
     * @param {object} context - Additional context (error, userId, requestId, etc.)
     */
    error: (message, context = {}) => {
        const log = formatLog(LOG_LEVELS.ERROR, message, context);
        console.error(JSON.stringify(log));
        return log;
    },

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {object} context - Additional context
     */
    warn: (message, context = {}) => {
        const log = formatLog(LOG_LEVELS.WARN, message, context);
        console.warn(JSON.stringify(log));
        return log;
    },

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {object} context - Additional context
     */
    info: (message, context = {}) => {
        const log = formatLog(LOG_LEVELS.INFO, message, context);
        console.log(JSON.stringify(log));
        return log;
    },

    /**
     * Log debug message (only in development)
     * @param {string} message - Debug message
     * @param {object} context - Additional context
     */
    debug: (message, context = {}) => {
        if (process.env.NODE_ENV === 'development') {
            const log = formatLog(LOG_LEVELS.DEBUG, message, context);
            console.debug(JSON.stringify(log));
            return log;
        }
    },

    /**
     * Log failed login attempt with IP and timestamp
     * @param {string} mobile - User mobile number (hashed for privacy)
     * @param {string} ip - Client IP address
     * @param {string} reason - Reason for failure
     */
    loginFailure: (mobile, ip, reason) => {
        logger.warn('Failed login attempt', {
            mobile: mobile ? mobile.slice(-4) : 'unknown', // Only log last 4 digits
            ip,
            reason,
            type: 'AUTH_FAILURE'
        });
    },

    /**
     * Log successful login
     * @param {number} userId - User ID
     * @param {string} ip - Client IP address
     */
    loginSuccess: (userId, ip) => {
        logger.info('Successful login', {
            userId,
            ip,
            type: 'AUTH_SUCCESS'
        });
    },

    /**
     * Log API error with request context
     * @param {string} endpoint - API endpoint
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {object} context - Additional context
     */
    apiError: (endpoint, statusCode, message, context = {}) => {
        logger.error('API Error', {
            endpoint,
            statusCode,
            message,
            ...context,
            type: 'API_ERROR'
        });
    },

    /**
     * Log database error
     * @param {string} operation - Database operation (SELECT, INSERT, etc.)
     * @param {string} table - Table name
     * @param {Error} error - Error object
     */
    dbError: (operation, table, error) => {
        logger.error('Database Error', {
            operation,
            table,
            errorMessage: error.message,
            type: 'DB_ERROR'
        });
    },

    /**
     * Log rate limit violation
     * @param {string} ip - Client IP
     * @param {string} endpoint - Endpoint that was rate limited
     */
    rateLimitExceeded: (ip, endpoint) => {
        logger.warn('Rate limit exceeded', {
            ip,
            endpoint,
            type: 'RATE_LIMIT'
        });
    }
};

module.exports = logger;
