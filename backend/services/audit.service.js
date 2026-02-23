const pool = require('../db');

exports.logAction = async (userId, action, entityType, entityId, details = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [userId, action, entityType, entityId, details];

        await pool.query(query, values);
        // console.log(`Audit Log: ${action} on ${entityType} ${entityId} by User ${userId}`);
    } catch (error) {
        console.error('Audit Log Failed:', error);
        // We don't want to fail the main request if logging fails, so we just log the error.
    }
};
