const db = require('../db');

/**
 * Log a financial action to audit_logs.
 * Uses 'timestamp' column (existing DB schema).
 */
exports.logAction = async (userId, action, entityType, entityId, details = null, client = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [userId, action, entityType, entityId, details ? JSON.stringify(details) : null];

        if (client) {
            await client.query(query, values);
        } else {
            await db.query(query, values);
        }
    } catch (error) {
        console.error('Audit Log Failed:', error.message);
    }
};

/**
 * Fetch audit logs with optional filters and pagination.
 */
exports.getAuditLogs = async (filters = {}) => {
    const page = Math.max(1, parseInt(filters.page || 1));
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit || 50)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (filters.action) {
        params.push(filters.action);
        conditions.push(`al.action = $${params.length}`);
    }
    if (filters.entity_type) {
        params.push(filters.entity_type);
        conditions.push(`al.entity_type = $${params.length}`);
    }
    if (filters.user_id) {
        params.push(filters.user_id);
        conditions.push(`al.user_id = $${params.length}`);
    }
    if (filters.date_from) {
        params.push(filters.date_from);
        conditions.push(`al.timestamp >= $${params.length}::DATE`);
    }
    if (filters.date_to) {
        params.push(filters.date_to);
        conditions.push(`al.timestamp < ($${params.length}::DATE + INTERVAL '1 day')`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
        `SELECT COUNT(*) FROM audit_logs al ${where}`,
        params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const dataRes = await db.query(
        `SELECT
            al.id,
            al.action,
            al.entity_type,
            al.entity_id,
            al.details,
            al.timestamp AS created_at,
            u.name  AS user_name,
            u.role  AS user_role
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${where}
         ORDER BY al.timestamp DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        dataParams
    );

    return {
        rows: dataRes.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1
    };
};

/**
 * Get distinct action types present in the logs (for filter dropdown).
 */
exports.getActionTypes = async () => {
    const res = await db.query(
        `SELECT DISTINCT action FROM audit_logs ORDER BY action`
    );
    return res.rows.map(r => r.action);
};
