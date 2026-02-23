const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/'
});

// Authentication Rate Limiter — no custom keyGenerator (avoids IPv6 warning)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: "Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };
