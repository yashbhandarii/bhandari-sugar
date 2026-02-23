const rateLimit = require('express-rate-limit');

// General API Rate Limiter
// Applied to all routes to prevent DoS attacks
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `windowMs`
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => req.path === '/' // Don't rate limit health check
});

// Authentication Rate Limiter
// Stricter limits for login/registration to prevent brute-force and credential stuffing
// 5 attempts per 15 minutes per IP (very strict to prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per `windowMs`
    message: {
        error: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Track by IP address for better security
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    }
});

module.exports = {
    globalLimiter,
    authLimiter
};
