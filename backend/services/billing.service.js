const db = require('../db');
const auditService = require('./audit.service');
const billingValidations = require('./billing.validations');
const { validateTransactionDate } = require('../utils/financialYear.util');

/**
 * Generate invoices for a delivery sheet with manager-entered rates and discounts.
 * @param {number} delivery_sheet_id
 * @param {number} userId - Manager ID
 * @param {Object} billingData - { medium_rate, super_small_rate, discounts: { customer_id: { type, value } } }
 * @returns {Promise<Object>} Summary of generated invoices
 */
exports.generateInvoices = async (delivery_sheet_id, userId, billingData = {}) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. LOCK DELIVERY SHEET
        const sheetRes = await client.query('SELECT * FROM delivery_sheets WHERE id = $1 FOR UPDATE', [delivery_sheet_id]);
        if (sheetRes.rows.length === 0) {
            throw new Error('Delivery sheet not found');
        }
        const sheet = sheetRes.rows[0];

        if (sheet.status !== 'submitted') {
            throw new Error('Delivery sheet must be submitted before generating invoices');
        }

        // STRICT: Ensure we aren't billing a sheet from a closed financial year
        await validateTransactionDate(sheet.date);

        // 2. STRICT DUPLICATE CHECK
        // If ANY active invoice exists for this sheet, BLOCK generation.
        const dupCheck = await client.query(
            'SELECT 1 FROM invoices WHERE delivery_sheet_id = $1 AND is_deleted = false LIMIT 1',
            [delivery_sheet_id]
        );
        if (dupCheck.rows.length > 0) {
            throw new Error('Billing already generated for this sheet.');
        }

        // 3. FETCH OR CREATE RATES
        // Manager must provide rates during billing generation
        let rates = null;

        // Try to fetch existing rates from billing_rates table
        const ratesRes = await client.query(
            'SELECT * FROM billing_rates WHERE delivery_sheet_id = $1 LIMIT 1',
            [delivery_sheet_id]
        );

        if (ratesRes.rows.length === 0) {
            // If no rates exist, they must be provided in billingData
            if (!billingData.medium_rate || !billingData.super_small_rate) {
                throw new Error('Manager must enter Medium Rate and Super Small Rate during billing generation');
            }

            // Validate rates
            const validatedRates = billingValidations.validateRates(
                billingData.medium_rate,
                billingData.super_small_rate
            );

            // Save rates to billing_rates table
            const insertRatesRes = await client.query(
                'INSERT INTO billing_rates (delivery_sheet_id, medium_rate, super_small_rate, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [delivery_sheet_id, validatedRates.medium_rate, validatedRates.super_small_rate, userId]
            );
            rates = insertRatesRes.rows[0];
        } else {
            rates = ratesRes.rows[0];
        }

        const medium_rate = parseFloat(rates.medium_rate);
        const super_small_rate = parseFloat(rates.super_small_rate);

        // 3. FETCH ITEMS & QUANTITIES
        // Supports BOTH:
        // - New model: delivery_quantities + categories
        // - Legacy model: delivery_items.medium_bags/super_small_bags (older sheets)
        const itemsQuery = `
            SELECT
                di.id as delivery_item_id,
                di.customer_id,
                di.medium_bags,
                di.super_small_bags,
                dq.bags,
                cat.name as category_name
            FROM delivery_items di
            LEFT JOIN delivery_quantities dq ON di.id = dq.delivery_item_id
            LEFT JOIN categories cat ON dq.category_id = cat.id
            WHERE di.delivery_sheet_id = $1
        `;
        const itemsRes = await client.query(itemsQuery, [delivery_sheet_id]);
        const rows = itemsRes.rows;

        if (rows.length === 0) {
            throw new Error('No items found in this delivery sheet');
        }

        const normalizeCategory = (name) => (name || '').trim().toLowerCase();

        // Group rows per delivery_item so we can decide whether to use quantities or legacy columns
        const perItem = new Map(); // delivery_item_id -> { customer_id, legacyMedium, legacySuperSmall, quantities: [{category_name, bags}] }
        for (const r of rows) {
            if (!perItem.has(r.delivery_item_id)) {
                perItem.set(r.delivery_item_id, {
                    customer_id: r.customer_id,
                    legacyMedium: Number(r.medium_bags || 0),
                    legacySuperSmall: Number(r.super_small_bags || 0),
                    quantities: []
                });
            }
            if (r.category_name) {
                perItem.get(r.delivery_item_id).quantities.push({
                    category_name: r.category_name,
                    bags: Number(r.bags || 0)
                });
            }
        }

        // 4. AGGREGATE PER CUSTOMER
        const customerItemsMap = new Map(); // customer_id -> { medium_bags, super_small_bags }

        for (const item of perItem.values()) {
            if (!customerItemsMap.has(item.customer_id)) {
                customerItemsMap.set(item.customer_id, { medium_bags: 0, super_small_bags: 0 });
            }
            const current = customerItemsMap.get(item.customer_id);

            if (item.quantities.length > 0) {
                let mediumFromQty = 0;
                let superSmallFromQty = 0;
                for (const q of item.quantities) {
                    const cat = normalizeCategory(q.category_name);
                    if (cat === 'medium') mediumFromQty += q.bags;
                    else if (cat === 'super small' || cat === 'super_small') superSmallFromQty += q.bags;
                }
                // If quantities exist but none are billable, fall back to legacy columns (older sheets)
                if (mediumFromQty === 0 && superSmallFromQty === 0 && (item.legacyMedium > 0 || item.legacySuperSmall > 0)) {
                    current.medium_bags += item.legacyMedium;
                    current.super_small_bags += item.legacySuperSmall;
                } else {
                    current.medium_bags += mediumFromQty;
                    current.super_small_bags += superSmallFromQty;
                }
            } else {
                // Legacy fallback
                current.medium_bags += item.legacyMedium;
                current.super_small_bags += item.legacySuperSmall;
            }
        }

        const newInvoicesData = [];

        // 5. CALCULATE TOTALS WITH DISCOUNT LOGIC
        for (const [customerId, data] of customerItemsMap.entries()) {
            // Skip empty
            if (data.medium_bags === 0 && data.super_small_bags === 0) {
                continue;
            }

            // Get discount info for this customer (if provided)
            const customerDiscount = (billingData.discounts && billingData.discounts[customerId]) || {};
            const discount_type = customerDiscount.type || null;
            const discount_value = customerDiscount.value || null;

            // Use billing validation to calculate complete invoice with discount
            const invoiceCalc = billingValidations.calculateInvoiceTotal(
                data.medium_bags,
                data.super_small_bags,
                medium_rate,
                super_small_rate,
                discount_type,
                discount_value
            );

            // Validate invoice integrity
            billingValidations.validateInvoiceIntegrity({
                subtotal: invoiceCalc.subtotal,
                sgst_amount: invoiceCalc.sgst_amount,
                cgst_amount: invoiceCalc.cgst_amount,
                total_amount: invoiceCalc.total_amount,
                discount_amount: invoiceCalc.discount_amount
            });

            const expense_amount = 0;

            newInvoicesData.push({
                customer_id: customerId,
                subtotal: invoiceCalc.subtotal,
                sgst_amount: invoiceCalc.sgst_amount,
                cgst_amount: invoiceCalc.cgst_amount,
                expense_amount,
                total_amount: invoiceCalc.total_amount,
                discount_type: invoiceCalc.discount_type,
                discount_value: invoiceCalc.discount_value,
                discount_amount: invoiceCalc.discount_amount
            });
        }

        if (newInvoicesData.length === 0) {
            throw new Error('No billable items found (bags count is 0 for all customers)');
        }

        // 6. BULK INSERT INVOICES
        const generatedInvoices = [];
        const placeholders = [];
        const queryParams = [delivery_sheet_id, 'unpaid']; // $1, $2
        let currentParamIndex = 3;

        for (const inv of newInvoicesData) {
            queryParams.push(
                inv.customer_id,
                inv.subtotal,
                inv.sgst_amount,
                inv.cgst_amount,
                inv.expense_amount,
                inv.total_amount,
                inv.discount_type,
                inv.discount_value,
                inv.discount_amount
            );

            placeholders.push(`($1, $2, $${currentParamIndex}, $${currentParamIndex + 1}, $${currentParamIndex + 2}, $${currentParamIndex + 3}, $${currentParamIndex + 4}, $${currentParamIndex + 5}, $${currentParamIndex + 6}, $${currentParamIndex + 7}, $${currentParamIndex + 8})`);
            currentParamIndex += 9;
        }

        const bulkInsertQuery = `
            INSERT INTO invoices
            (delivery_sheet_id, status, customer_id, subtotal, sgst_amount, cgst_amount, expense_amount, total_amount, discount_type, discount_value, discount_amount)
            VALUES ${placeholders.join(', ')}
            RETURNING id
         `;

        const insertRes = await client.query(bulkInsertQuery, queryParams);
        generatedInvoices.push(...insertRes.rows.map(r => r.id));

        // 7. CREATE STOCK MOVEMENTS
        // Deduct inventory automatically upon billing
        let totalMediumStock = 0;
        let totalSuperSmallStock = 0;
        for (const [customerId, data] of customerItemsMap.entries()) {
            totalMediumStock += data.medium_bags;
            totalSuperSmallStock += data.super_small_bags;
        }

        if (totalMediumStock > 0) {
            await client.query(
                'INSERT INTO stock_movements (category, movement_type, bags, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5)',
                ['medium', 'delivery_out', totalMediumStock, delivery_sheet_id, 'Delivery Sheet Billing']
            );
        }

        if (totalSuperSmallStock > 0) {
            await client.query(
                'INSERT INTO stock_movements (category, movement_type, bags, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5)',
                ['super_small', 'delivery_out', totalSuperSmallStock, delivery_sheet_id, 'Delivery Sheet Billing']
            );
        }

        // 8. UPDATE DELIVERY SHEET STATUS
        await client.query('UPDATE delivery_sheets SET status = $1 WHERE id = $2', ['billed', delivery_sheet_id]);

        // 9. LOG AUDIT
        if (userId) {
            await auditService.logAction(userId, 'GENERATE_INVOICES', 'DELIVERY_SHEET', delivery_sheet_id, { count: generatedInvoices.length }, client);
        }

        await client.query('COMMIT');

        return {
            message: `Generated ${generatedInvoices.length} invoices`,
            invoice_ids: generatedInvoices
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get invoices for a delivery sheet.
 */
exports.getInvoicesBySheetId = async (delivery_sheet_id) => {
    const query = `
        SELECT i.*, c.name as customer_name 
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.delivery_sheet_id = $1 AND i.is_deleted = false
    `;
    const result = await db.query(query, [delivery_sheet_id]);
    return result.rows;
};

/**
 * Preview invoices for a delivery sheet without generating them.
 * Supports manager-entered rates and customer discounts.
 * @param {number} delivery_sheet_id
 * @param {Object} billingData - { medium_rate, super_small_rate, discounts: { customer_id: { type, value } } }
 * @returns {Promise<Object>} { previews, totals }
 */
exports.previewInvoices = async (delivery_sheet_id, billingData = {}) => {
    const client = await db.pool.connect();
    try {
        // 1. Get Delivery Sheet
        const sheetRes = await client.query('SELECT * FROM delivery_sheets WHERE id = $1', [delivery_sheet_id]);
        if (sheetRes.rows.length === 0) {
            throw new Error('Delivery sheet not found');
        }

        // 2. Fetch or validate rates
        let medium_rate, super_small_rate;

        // Try to fetch existing rates from billing_rates table
        const ratesRes = await client.query(
            'SELECT * FROM billing_rates WHERE delivery_sheet_id = $1 LIMIT 1',
            [delivery_sheet_id]
        );

        if (ratesRes.rows.length === 0) {
            // If no rates exist, they must be provided in billingData
            if (!billingData.medium_rate || !billingData.super_small_rate) {
                throw new Error('Manager must enter Medium Rate and Super Small Rate');
            }

            // Validate rates
            const validatedRates = billingValidations.validateRates(
                billingData.medium_rate,
                billingData.super_small_rate
            );
            medium_rate = validatedRates.medium_rate;
            super_small_rate = validatedRates.super_small_rate;
        } else {
            medium_rate = parseFloat(ratesRes.rows[0].medium_rate);
            super_small_rate = parseFloat(ratesRes.rows[0].super_small_rate);
        }

        // 3. FETCH ITEMS & QUANTITIES
        // Supports BOTH new model (delivery_quantities) and legacy columns on delivery_items.
        const itemsQuery = `
            SELECT
                di.id as delivery_item_id,
                di.customer_id,
                di.medium_bags,
                di.super_small_bags,
                c.name as customer_name,
                c.mobile,
                dq.bags,
                cat.name as category_name
            FROM delivery_items di
            JOIN customers c ON di.customer_id = c.id
            LEFT JOIN delivery_quantities dq ON di.id = dq.delivery_item_id
            LEFT JOIN categories cat ON dq.category_id = cat.id
            WHERE di.delivery_sheet_id = $1
        `;
        const itemsRes = await client.query(itemsQuery, [delivery_sheet_id]);
        const rows = itemsRes.rows;

        if (rows.length === 0) {
            return { previews: [], totals: { subtotal: 0, sgst: 0, cgst: 0, discount: 0, total: 0 } };
        }

        const normalizeCategory = (name) => (name || '').trim().toLowerCase();

        // Group per delivery item
        const perItem = new Map(); // delivery_item_id -> { customer_id, customer_name, mobile, legacyMedium, legacySuperSmall, quantities: [] }
        for (const r of rows) {
            if (!perItem.has(r.delivery_item_id)) {
                perItem.set(r.delivery_item_id, {
                    customer_id: r.customer_id,
                    customer_name: r.customer_name,
                    mobile: r.mobile,
                    legacyMedium: Number(r.medium_bags || 0),
                    legacySuperSmall: Number(r.super_small_bags || 0),
                    quantities: []
                });
            }
            if (r.category_name) {
                perItem.get(r.delivery_item_id).quantities.push({
                    category_name: r.category_name,
                    bags: Number(r.bags || 0)
                });
            }
        }

        // 4. AGGREGATE PER CUSTOMER
        const customerItemsMap = new Map(); // customer_id -> { customer_name, mobile, medium_bags, super_small_bags }
        for (const item of perItem.values()) {
            if (!customerItemsMap.has(item.customer_id)) {
                customerItemsMap.set(item.customer_id, {
                    customer_name: item.customer_name,
                    mobile: item.mobile,
                    medium_bags: 0,
                    super_small_bags: 0
                });
            }
            const current = customerItemsMap.get(item.customer_id);

            if (item.quantities.length > 0) {
                let mediumFromQty = 0;
                let superSmallFromQty = 0;
                for (const q of item.quantities) {
                    const cat = normalizeCategory(q.category_name);
                    if (cat === 'medium') mediumFromQty += q.bags;
                    else if (cat === 'super small' || cat === 'super_small') superSmallFromQty += q.bags;
                }
                // If quantities exist but none are billable, fall back to legacy columns (older sheets)
                if (mediumFromQty === 0 && superSmallFromQty === 0 && (item.legacyMedium > 0 || item.legacySuperSmall > 0)) {
                    current.medium_bags += item.legacyMedium;
                    current.super_small_bags += item.legacySuperSmall;
                } else {
                    current.medium_bags += mediumFromQty;
                    current.super_small_bags += superSmallFromQty;
                }
            } else {
                // Legacy fallback
                current.medium_bags += item.legacyMedium;
                current.super_small_bags += item.legacySuperSmall;
            }
        }

        const previews = [];
        const totals = { subtotal: 0, sgst: 0, cgst: 0, discount: 0, total: 0 };

        // 5. Prepare Preview Data WITH DISCOUNT
        for (const [customerId, data] of customerItemsMap.entries()) {
            if (data.medium_bags === 0 && data.super_small_bags === 0) continue;

            // Get discount info for this customer (if provided)
            const customerDiscount = (billingData.discounts && billingData.discounts[customerId]) || {};
            const discount_type = customerDiscount.type || null;
            const discount_value = customerDiscount.value || null;

            // Use billing validation to calculate complete invoice with discount
            const invoiceCalc = billingValidations.calculateInvoiceTotal(
                data.medium_bags,
                data.super_small_bags,
                medium_rate,
                super_small_rate,
                discount_type,
                discount_value
            );

            totals.subtotal += invoiceCalc.subtotal;
            totals.sgst += invoiceCalc.sgst_amount;
            totals.cgst += invoiceCalc.cgst_amount;
            totals.discount += invoiceCalc.discount_amount;
            totals.total += invoiceCalc.total_amount;

            previews.push({
                customer_id: customerId,
                customer_name: data.customer_name,
                mobile: data.mobile,
                medium_bags: data.medium_bags,
                super_small_bags: data.super_small_bags,
                medium_rate,
                super_small_rate,
                inclusive_total: invoiceCalc.inclusive_total,
                discount_type: invoiceCalc.discount_type,
                discount_value: invoiceCalc.discount_value,
                discount_amount: invoiceCalc.discount_amount,
                subtotal: invoiceCalc.subtotal,
                sgst_amount: invoiceCalc.sgst_amount,
                cgst_amount: invoiceCalc.cgst_amount,
                total_amount: invoiceCalc.total_amount
            });
        }

        return { previews, totals };

    } finally {
        client.release();
    }
};

/**
 * Get billing history for a customer.
 * @param {number} customer_id 
 * @returns {Promise<Array>} List of invoices
 */
exports.getCustomerBilling = async (customer_id) => {
    const query = `
        SELECT i.*, ds.date as delivery_date, ds.truck_number
        FROM invoices i
        JOIN delivery_sheets ds ON i.delivery_sheet_id = ds.id
        WHERE i.customer_id = $1 AND i.is_deleted = false
        ORDER BY ds.date DESC
    `;
    const result = await db.query(query, [customer_id]);
    return result.rows;
};
