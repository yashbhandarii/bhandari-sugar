const authService = require('../services/auth.service');
const logger = require('../utils/logger');

exports.login = async (req, res) => {
    const { mobile, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    try {
        const result = await authService.login(mobile, password);
        logger.loginSuccess(result.user.id, clientIp);
        res.json(result);
    } catch (error) {
        logger.loginFailure(mobile, clientIp, error.message);
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        logger.apiError('/auth/login', 500, error.message, { mobile, clientIp });
        res.status(500).json({ error: 'Server error' });
    }
};
