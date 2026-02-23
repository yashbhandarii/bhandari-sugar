const db = require('../db');
const { validateTransactionDate } = require('../utils/financialYear.util');

/**
 * Get all delivery sheets with pagination.
 * @returns {Promise<Object>} { data: Array, meta: { total, totalPages, currentPage } }
 */
exports.getAllDeliverySheets = async (userId = null, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE is_deleted = false';
    const params = [];
    if (userId) {
        whereClause += ' AND created_by = $1';
        params.push(userId);
    }

    // 1. Get total count
    const countQuery = `SELECT COUNT(*) FROM delivery_sheets ${whereClause}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    // 2. Get paginated data
    let query = `SELECT * FROM delivery_sheets ${whereClause} ORDER BY date DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataParams = [...params, limit, offset];

    const result = await db.query(query, dataParams);

    return {
        data: result.rows,
        meta: {
            total,
            totalPages,
            currentPage: Number(page)
        }
    };
};

/**
 * Get the rates from the last delivery sheet.
 * @returns {Promise<{medium_rate: number, super_small_rate: number}>}
 */
exports.getLastRates = async () => {
    const query = `
        SELECT medium_rate, super_small_rate
        FROM delivery_sheets
        WHERE is_deleted = false
        ORDER BY date DESC, id DESC
        LIMIT 1
    `;
    const result = await db.query(query);
    return result.rows[0] || { medium_rate: 0, super_small_rate: 0 };
};

/**
 * Create a new delivery sheet.
 * @param {Object} data - { truck_number, created_by, date, medium_rate, super_small_rate }
 * @returns {Promise<Object>} Created delivery sheet
 */
/**
 * Create a new delivery sheet.
 * @param {Object} data - { truck_number, created_by, date, temp_id }
 * @returns {Promise<Object>} Created delivery sheet
 */
exports.createDeliverySheet = async (data) => {
    const { truck_number, created_by, date, temp_id } = data;
    const finalDate = date ? new Date(date) : new Date();

    // STRICT: Validate against active financial year
    await validateTransactionDate(finalDate);

    if (temp_id) {
        const existing = await db.query('SELECT * FROM delivery_sheets WHERE temp_id = $1', [temp_id]);
        if (existing.rows.length > 0) {
            return existing.rows[0];
        }
    }

    const query = `
        INSERT INTO delivery_sheets 
        (truck_number, created_by, date, status, temp_id) 
        VALUES ($1, $2, $3, 'draft', $4) 
        RETURNING *
    `;
    const values = [
        truck_number,
        created_by,
        finalDate,
        temp_id || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
};

/**
 * Update rates for a delivery sheet.
 * DEPRECATED: Rates are now in billing_rates table and managed by Manager.
 */
exports.updateSheetRates = async (id, data) => {
    throw new Error('Rate updates on delivery sheets are no longer supported. Use Billing module.');
};

/**
 * Add an item to a delivery sheet.
 * @param {Object} data - { delivery_sheet_id, customer_id, quantities }
 * @returns {Promise<Object>} Created item
 */
exports.addItemInDeliverySheet = async (data) => {
    const { delivery_sheet_id, customer_id, quantities } = data;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check status first
        const sheetRes = await client.query('SELECT status FROM delivery_sheets WHERE id = $1', [delivery_sheet_id]);
        if (sheetRes.rows.length === 0) {
            throw new Error('Delivery sheet not found');
        }
        if (sheetRes.rows[0].status !== 'draft') {
            throw new Error('Cannot add items to a submitted or billed delivery sheet');
        }

        // Check for duplicate customer
        const dupRes = await client.query(
            'SELECT id FROM delivery_items WHERE delivery_sheet_id = $1 AND customer_id = $2',
            [delivery_sheet_id, customer_id]
        );
        if (dupRes.rows.length > 0) {
            throw new Error('Customer already exists in this delivery sheet.');
        }

        // Create Delivery Item
        const itemQuery = `
            INSERT INTO delivery_items (delivery_sheet_id, customer_id) 
            VALUES ($1, $2) 
            RETURNING id
        `;

        const itemRes = await client.query(itemQuery, [delivery_sheet_id, customer_id]);
        const itemId = itemRes.rows[0].id;

        // Insert Quantities
        if (quantities && Array.isArray(quantities)) {
            for (const q of quantities) {
                if (q.bags > 0) {
                    await client.query(`
                        INSERT INTO delivery_quantities (delivery_item_id, category_id, bags)
                        VALUES ($1, $2, $3)
                    `, [itemId, q.category_id, q.bags]);
                }
            }
        }

        await client.query('COMMIT');
        return { id: itemId, delivery_sheet_id, customer_id, quantities };
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            throw new Error('Customer already exists in this delivery sheet.');
        }
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get delivery sheet by ID with items.
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
exports.getDeliverySheetById = async (id) => {
    const sheetQuery = 'SELECT * FROM delivery_sheets WHERE id = $1 AND is_deleted = false';
    const sheetRes = await db.query(sheetQuery, [id]);

    if (sheetRes.rows.length === 0) {
        return null;
    }

    // Fetch Items
    const itemsQuery = `
        SELECT di.id, di.customer_id, c.name as customer_name, c.mobile as customer_mobile
        FROM delivery_items di 
        JOIN customers c ON di.customer_id = c.id
        WHERE di.delivery_sheet_id = $1
    `;
    const itemsRes = await db.query(itemsQuery, [id]);
    const items = itemsRes.rows;

    // Fetch Quantities for all items in this sheet
    if (items.length > 0) {
        const itemIds = items.map(i => i.id);
        const quantitiesQuery = `
            SELECT dq.delivery_item_id, dq.category_id, dq.bags, cat.name as category_name
            FROM delivery_quantities dq
            JOIN categories cat ON dq.category_id = cat.id
            WHERE dq.delivery_item_id = ANY($1::int[])
        `;
        const quantitiesRes = await db.query(quantitiesQuery, [itemIds]);

        // Map quantities to items
        items.forEach(item => {
            item.quantities = {};
            const itemQuantities = quantitiesRes.rows.filter(q => q.delivery_item_id === item.id);
            itemQuantities.forEach(q => {
                // Return mapping of category_id -> bags 
                // AND category_name -> bags for easier display
                item.quantities[q.category_id] = q.bags;
            });
            // Attach full quantities detail for frontend convenience if needed
            item.quantitiesDetail = itemQuantities;
        });
    }

    return { ...sheetRes.rows[0], items: items };
};

const inventoryService = require('./inventory.service');

/**
 * Submit delivery sheet.
 * Validates, updates status, and triggers stock movement.
 * @param {number} id 
 * @returns {Promise<void>}
 */
exports.submitDeliverySheet = async (id) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check if already submitted
        const sheetRes = await client.query('SELECT status, date FROM delivery_sheets WHERE id = $1', [id]);
        if (sheetRes.rows.length === 0) {
            throw new Error('Delivery sheet not found');
        }
        if (sheetRes.rows[0].status !== 'draft') {
            throw new Error('Delivery sheet matches submitted or billed status. Cannot resubmit.');
        }

        // STRICT: Ensure we aren't modifying a sheet from a closed financial year
        await validateTransactionDate(sheetRes.rows[0].date);

        // Validate items exist? (Optional but good)
        const itemsCountRes = await client.query('SELECT COUNT(*) FROM delivery_items WHERE delivery_sheet_id = $1', [id]);
        if (parseInt(itemsCountRes.rows[0].count) === 0) {
            // Maybe allow empty sheet submission? Or block?
            // Proceed for now.
        }

        // Update status to submitted
        await client.query("UPDATE delivery_sheets SET status = 'submitted' WHERE id = $1", [id]);

        // Get all items and their quantities to create stock movements
        const itemsQuery = `
            SELECT di.id, dq.category_id, dq.bags, c.name as category_name
            FROM delivery_items di
            JOIN delivery_quantities dq ON di.id = dq.delivery_item_id
            JOIN categories c ON dq.category_id = c.id
            WHERE di.delivery_sheet_id = $1 AND dq.bags > 0
        `;

        const itemsRes = await client.query(itemsQuery, [id]);
        const items = itemsRes.rows;

        /* 
        // Stock movement logic - kept as logic placeholder if inventory service is used
        // Note: 'submit' usually implies finalizing the delivery which deducts stock.
        
        const movements = [];
        for (const item of items) {
             movements.push({
                category: item.category_name, 
                movement_type: 'delivery_out',
                bags: item.bags,
                reference_type: 'delivery_sheet',
                reference_id: id
            });
        }

        if (movements.length > 0) {
            await inventoryService.createMovementsBulk(movements, client);
        }
        */
        // Re-enabling stock logic if user wants it (Original code had it)
        // Check if inventoryService.createMovementsBulk exists and works.
        // Assuming it does based on previous code.

        const movements = [];
        for (const item of items) {
            movements.push({
                category: item.category_name.toLowerCase().replace(' ', '_'),
                movement_type: 'delivery_out',
                bags: item.bags,
                reference_type: 'delivery_sheet',
                reference_id: id
            });
        }

        if (movements.length > 0) {
            await inventoryService.createMovementsBulk(movements, client);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Soft delete a delivery sheet.
 * @param {number} id 
 * @param {number} userId 
 * @returns {Promise<void>}
 */
exports.deleteDeliverySheet = async (id, userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Check availability
        const sheetRes = await client.query('SELECT status, date FROM delivery_sheets WHERE id = $1 AND is_deleted = false', [id]);
        if (sheetRes.rows.length === 0) {
            throw new Error('Delivery sheet not found');
        }

        // STRICT: Ensure we aren't deleting a sheet from a closed financial year
        await validateTransactionDate(sheetRes.rows[0].date);

        await client.query('UPDATE delivery_sheets SET is_deleted = true WHERE id = $1', [id]);

        // Log Audit
        if (userId) {
            const auditService = require('./audit.service');
            await auditService.logAction(userId, 'DELETE', 'DELIVERY_SHEET', id, {});
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
