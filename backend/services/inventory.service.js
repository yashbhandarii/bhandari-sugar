const db = require('../db');
const { validateTransactionDate } = require('../utils/financialYear.util');

/**
 * Create multiple stock movements in bulk.
 * @param {Array<Object>} movements - Array of movement objects
 * @param {Object} client - Database client for transaction
 */
exports.createMovementsBulk = async (movements, client = db) => {
    if (movements.length === 0) return;

    // Validate date of the first movement (assuming bulk movements occur on the same date usually)
    const sampleDate = movements[0].created_at ? new Date(movements[0].created_at) : new Date();
    await validateTransactionDate(sampleDate);

    // Construct bulk query
    // VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ...
    const values = [];
    const placeholders = [];
    let paramCount = 1;

    for (const mov of movements) {
        // Removed hardcoded category check to support dynamic categories
        if (!['factory_in', 'delivery_out', 'godown_in'].includes(mov.movement_type)) {
            throw new Error('Invalid movement type in bulk');
        }

        values.push(mov.category, mov.movement_type, Math.abs(mov.bags), mov.reference_type, mov.reference_id, mov.created_at || new Date());
        placeholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5})`);
        paramCount += 6;
    }

    const query = `
            INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id, created_at)
            VALUES ${placeholders.join(', ')}
        `;

    await client.query(query, values);
};

/**
 * Create a stock movement.
 * @param {Object} data - { category, movement_type, bags, reference_type, reference_id }
 * @returns {Promise<Object>} Created movement
 */
exports.createMovement = async (data, client = db) => {
    const { category, movement_type, bags, reference_type, reference_id } = data;

    // Validate basics
    // Removed hardcoded category check
    if (!['factory_in', 'delivery_out', 'godown_in'].includes(movement_type)) {
        throw new Error('Invalid movement type');
    }

    const finalDate = data.created_at ? new Date(data.created_at) : new Date();
    await validateTransactionDate(finalDate);

    const query = `
        INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [category, movement_type, Math.abs(bags), reference_type, reference_id];

    const result = await client.query(query, values);
    return result.rows[0];
};

/**
 * Get current stock for all categories.
 * Logic: SUM(factory_in + godown_in - delivery_out)
 * @returns {Promise<Object>} { [category]: number }
 */
exports.getCurrentStock = async () => {
    const query = `
        SELECT 
            category,
            SUM(CASE WHEN movement_type IN ('factory_in', 'godown_in') THEN bags ELSE 0 END) as total_in,
            SUM(CASE WHEN movement_type = 'delivery_out' THEN bags ELSE 0 END) as total_out
        FROM stock_movements
        GROUP BY category
    `;

    const result = await db.query(query);

    const stock = {};

    result.rows.forEach(row => {
        const net = parseInt(row.total_in || 0) - parseInt(row.total_out || 0);
        stock[row.category] = net;
    });

    // Ensure medium and super_small are present for legacy support if needed,
    // though strict frontend should handle missing keys.
    if (stock.medium === undefined) stock.medium = 0;
    if (stock.super_small === undefined) stock.super_small = 0;

    return stock;
};

/**
 * Get detailed stock ledger (optional helper).
 */
exports.getStockLedger = async () => {
    const query = `
        SELECT id, category, movement_type, bags, reference_type, reference_id, created_at 
        FROM stock_movements 
        ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
};
