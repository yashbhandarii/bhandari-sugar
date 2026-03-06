const auditService = require('../services/audit.service');

/**
 * GET /api/audit
 * Query params: page, limit, action, entity_type, user_id, date_from, date_to
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const result = await auditService.getAuditLogs(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error.message, error.stack);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

/**
 * GET /api/audit/action-types
 */
exports.getActionTypes = async (req, res) => {
    try {
        const types = await auditService.getActionTypes();
        res.json(types);
    } catch (error) {
        console.error('Error fetching action types:', error.message, error.stack);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
