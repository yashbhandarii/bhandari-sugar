const db = require('../db');

/**
 * Get all active categories.
 * @returns {Promise<Array>} List of categories
 */
exports.getAllCategories = async () => {
    const result = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY id ASC');
    return result.rows;
};

/**
 * Create a new category.
 * @param {Object} data - { name, default_weight }
 * @returns {Promise<Object>} Created category
 */
exports.createCategory = async (data) => {
    const { name, default_weight } = data;
    const query = `
        INSERT INTO categories (name, default_weight, is_active)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (name) DO UPDATE
        SET default_weight = EXCLUDED.default_weight,
            is_active = TRUE
        RETURNING *
    `;
    const result = await db.query(query, [name, default_weight || 30.00]);
    return result.rows[0];
};

/**
 * Delete a category (Soft delete).
 * @param {number} id
 * @returns {Promise<void>}
 */
exports.deleteCategory = async (id) => {
    // Check if used in delivery_quantities or rates?
    // User requested "Ensure category removal does not break old delivery sheets."
    // Soft delete is safest.
    await db.query('UPDATE categories SET is_active = FALSE WHERE id = $1', [id]);
};
