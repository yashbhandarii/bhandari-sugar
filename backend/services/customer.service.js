const db = require('../db');
const auditService = require('./audit.service');

/**
 * Get all customers with optional search.
 * @returns {Promise<Array>} List of customers
 */
exports.getAllCustomers = async (page = 1, limit = 20, search = '') => {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_deleted = false';
    let queryParams = [];

    if (search.trim()) {
        whereClause += ' AND (name ILIKE $1 OR mobile ILIKE $1)';
        queryParams.push(`%${search.trim()}%`);
    }

    // Get total count for pagination
    const countRes = await db.query(`SELECT COUNT(*) FROM customers ${whereClause}`, queryParams);
    const total = parseInt(countRes.rows[0].count);

    // Get paginated rows
    const res = await db.query(
        `SELECT * FROM customers ${whereClause} ORDER BY name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
    );

    return {
        customers: res.rows,
        total
    };
};

/**
 * Get customer by ID.
 * @param {number} id
 * @returns {Promise<Object>} Customer object
 */
exports.getCustomerById = async (id) => {
    const res = await db.query('SELECT * FROM customers WHERE id = $1 AND is_deleted = false', [id]);
    return res.rows[0];
};

/**
 * Create a new customer.
 * @param {Object} data - { name, mobile, address }
 * @returns {Promise<Object>} Created customer
 */
exports.createCustomer = async (data) => {
    const { name, mobile, address } = data;

    // Validation
    if (!name || name.trim() === '') {
        throw new Error('Name is required');
    }
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        throw new Error('Mobile number must be exactly 10 digits');
    }

    // Check for duplicate mobile
    const dupCheck = await db.query('SELECT id FROM customers WHERE mobile = $1', [mobile]);
    if (dupCheck.rows.length > 0) {
        throw new Error('Customer with this mobile number already exists');
    }

    const query = `
        INSERT INTO customers (name, mobile, address)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const res = await db.query(query, [name, mobile, address]);
    const newCustomer = res.rows[0];

    // Log Audit - We need userId passed to this function ideally, but for now we'll skip or refactor controller to pass it
    // Let's refactor controller to pass userId
    return newCustomer;
};

exports.createCustomerWithAudit = async (data, userId) => {
    const customer = await exports.createCustomer(data);
    await auditService.logAction(userId, 'CREATE', 'CUSTOMER', customer.id, { name: customer.name });
    return customer;
};

/**
 * Update an existing customer.
 * @param {number} id
 * @param {Object} data - { name, mobile, address }
 * @returns {Promise<Object>} Updated customer
 */
exports.updateCustomer = async (id, data, userId) => {
    const { name, mobile, address } = data;

    // Validation
    if (!name || name.trim() === '') {
        throw new Error('Name is required');
    }
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        throw new Error('Mobile number must be exactly 10 digits');
    }

    // Check for duplicate mobile (excluding self)
    const dupCheck = await db.query('SELECT id FROM customers WHERE mobile = $1 AND id != $2', [mobile, id]);
    if (dupCheck.rows.length > 0) {
        throw new Error('Customer with this mobile number already exists');
    }

    const query = `
        UPDATE customers
        SET name = $1, mobile = $2, address = $3
        WHERE id = $4
        RETURNING *
    `;
    const res = await db.query(query, [name, mobile, address, id]);
    if (res.rows.length === 0) {
        throw new Error('Customer not found');
    }
    const updatedCustomer = res.rows[0];

    // Log Audit
    if (userId) {
        await auditService.logAction(userId, 'UPDATE', 'CUSTOMER', id, { updated_fields: Object.keys(data) });
    }

    return updatedCustomer;
};

/**
 * Delete a customer.
 * Only allowed if no related records exist.
 * @param {number} id
 * @returns {Promise<void>}
 */


// ... (existing code for deleteCustomer)

exports.deleteCustomer = async (id, userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check if customer exists and is not already deleted
        const check = await client.query('SELECT id, name FROM customers WHERE id = $1 AND is_deleted = false', [id]);
        if (check.rows.length === 0) {
            throw new Error('Customer not found');
        }
        const customerName = check.rows[0].name;

        // Perform Soft Delete
        const res = await client.query('UPDATE customers SET is_deleted = true WHERE id = $1 RETURNING *', [id]);

        // Log Audit
        if (userId) {
            await auditService.logAction(userId, 'DELETE', 'CUSTOMER', id, { name: customerName });
        }

        await client.query('COMMIT');
        return res.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
