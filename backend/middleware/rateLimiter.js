const rateLimit = require('express-rate-limit');

// General API Rate Limiter
// Applied to all routes to prevent DoS attacks
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs (production)
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/' // Don't rate limit health check
});

// Authentication Rate Limiter
// Allows reasonable login attempts for legitimate users
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 login attempts per 15 min per IP (reasonable for prod)
    message: {
        error: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    }
});

module.exports = {
    globalLimiter,
    authLimiter
};
