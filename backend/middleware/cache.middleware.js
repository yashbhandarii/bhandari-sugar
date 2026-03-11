/**
 * In-Memory API Response Cache Middleware
 * ========================================
 * Caches JSON responses for a configurable TTL (time-to-live).
 * Automatically invalidates stale entries. 
 * 
 * Usage in routes:
 *   const { cacheFor } = require('../middleware/cache.middleware');
 *   router.get('/aging', cacheFor(60), reportController.getAgingReport);  // 60s cache
 */

const cache = new Map();

// Periodic cleanup of expired entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now - entry.time > entry.ttl) {
            cache.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Creates a caching middleware for the given TTL.
 * @param {number} ttlSeconds - How long to cache responses (in seconds)
 * @returns {Function} Express middleware
 */
function cacheFor(ttlSeconds) {
    return (req, res, next) => {
        // Build cache key from full URL (includes query params)
        const key = req.originalUrl;

        // Check if we have a valid cached response
        const cached = cache.get(key);
        if (cached && (Date.now() - cached.time < cached.ttl)) {
            res.set('X-Cache', 'HIT');
            return res.json(cached.data);
        }

        // Intercept res.json to capture the response and cache it
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, {
                    data,
                    time: Date.now(),
                    ttl: ttlSeconds * 1000
                });
            }
            res.set('X-Cache', 'MISS');
            originalJson(data);
        };

        next();
    };
}

/**
 * Manually clear all cached entries.
 * Call this after data mutations (e.g., new payment, new invoice).
 */
function clearCache() {
    cache.clear();
}

/**
 * Clear cached entries matching a URL prefix.
 * Example: clearCacheFor('/api/reports') clears all report caches.
 */
function clearCacheFor(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

module.exports = { cacheFor, clearCache, clearCacheFor };
