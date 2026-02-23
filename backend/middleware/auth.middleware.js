const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 */
exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
    }
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

/**
 * Middleware to check for specific roles
 * @param {Array<string>} roles
 */
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
