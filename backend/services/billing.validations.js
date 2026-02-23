/**
 * Billing Validation & Calculation Utilities
 * ==================================================
 * Handles all financial validations and GST calculations
 * for the billing system.
 */

/**
 * Validate rates entered by manager
 * @param {number} medium_rate
 * @param {number} super_small_rate
 * @throws {Error} If validation fails
 */
exports.validateRates = (medium_rate, super_small_rate) => {
    const mr = parseFloat(medium_rate);
    const sr = parseFloat(super_small_rate);

    if (isNaN(mr) || isNaN(sr)) {
        throw new Error('Rates must be valid numbers');
    }

    if (mr <= 0) {
        throw new Error('Medium rate must be greater than 0');
    }

    if (sr <= 0) {
        throw new Error('Super Small rate must be greater than 0');
    }

    return { medium_rate: mr, super_small_rate: sr };
};

/**
 * Validate discount parameters
 * @param {string} discount_type - 'percentage', 'fixed', or null/undefined
 * @param {number} discount_value - The percentage (0-100) or fixed amount
 * @param {number} inclusive_total - The amount before discount
 * @throws {Error} If validation fails
 * @returns {Object} Validated discount_type and discount_value
 */
exports.validateDiscount = (discount_type, discount_value, inclusive_total) => {
    // No discount
    if (!discount_type || discount_type === 'null') {
        return {
            discount_type: null,
            discount_value: null,
            discount_amount: 0
        };
    }

    const validTypes = ['percentage', 'fixed'];
    if (!validTypes.includes(discount_type)) {
        throw new Error("Discount type must be 'percentage', 'fixed', or null");
    }

    const dv = parseFloat(discount_value);

    if (isNaN(dv)) {
        throw new Error('Discount value must be a valid number');
    }

    if (dv < 0) {
        throw new Error('Discount cannot be negative');
    }

    let discount_amount = 0;

    if (discount_type === 'percentage') {
        if (dv > 100) {
            throw new Error('Discount percentage cannot exceed 100%');
        }
        discount_amount = Number(((inclusive_total * dv) / 100).toFixed(2));
    } else if (discount_type === 'fixed') {
        discount_amount = dv;
    }

    // Validation: discount cannot exceed total
    if (discount_amount > inclusive_total) {
        throw new Error('Discount amount cannot exceed the invoice total');
    }

    return {
        discount_type,
        discount_value: dv,
        discount_amount
    };
};

/**
 * Calculate GST split from inclusive amount
 * Used when NO discount or AFTER discount calculations
 *
 * Assumes: inclusive_amount = base_amount × 1.05
 *
 * @param {number} inclusive_amount - Amount including 5% GST
 * @returns {Object} { base_amount, gst_total, sgst_amount, cgst_amount }
 */
exports.calculateGSTFromInclusive = (inclusive_amount) => {
    const base_amount = Number((inclusive_amount / 1.05).toFixed(2));
    const gst_total = Number((inclusive_amount - base_amount).toFixed(2));
    const sgst_amount = Number((gst_total / 2).toFixed(2));
    const cgst_amount = Number((gst_total / 2).toFixed(2));

    return {
        base_amount,
        gst_total,
        sgst_amount,
        cgst_amount
    };
};

/**
 * Complete billing calculation with discount
 *
 * Flow:
 * 1. Calculate inclusive subtotal = bags × rate
 * 2. Apply discount (if any)
 * 3. Calculate GST from discounted total
 * 4. Return all values for storage
 *
 * @param {number} medium_bags
 * @param {number} super_small_bags
 * @param {number} medium_rate - GST inclusive
 * @param {number} super_small_rate - GST inclusive
 * @param {string} discount_type - 'percentage', 'fixed', or null
 * @param {number} discount_value - Percentage (0-100) or fixed amount
 * @returns {Object} Complete invoice calculation
 */
exports.calculateInvoiceTotal = (
    medium_bags,
    super_small_bags,
    medium_rate,
    super_small_rate,
    discount_type = null,
    discount_value = null
) => {
    // Step 1: Calculate inclusive subtotal
    const medium_bags_num = Number(medium_bags) || 0;
    const super_small_bags_num = Number(super_small_bags) || 0;
    const mr = Number(medium_rate);
    const sr = Number(super_small_rate);

    const medium_amount = medium_bags_num * mr;
    const super_small_amount = super_small_bags_num * sr;
    const inclusive_total = Number((medium_amount + super_small_amount).toFixed(2));

    // Step 2: Apply discount
    const discountInfo = exports.validateDiscount(discount_type, discount_value, inclusive_total);

    // Step 3: Calculate after-discount total
    const after_discount_total = Number((inclusive_total - discountInfo.discount_amount).toFixed(2));

    // Step 4: Split GST from discounted total
    const gstInfo = exports.calculateGSTFromInclusive(after_discount_total);

    // Step 5: Prepare return object
    return {
        // Item breakdown
        medium_bags: medium_bags_num,
        super_small_bags: super_small_bags_num,
        medium_rate: mr,
        super_small_rate: sr,

        // Calculations
        medium_amount: Number((medium_amount).toFixed(2)),
        super_small_amount: Number((super_small_amount).toFixed(2)),
        inclusive_total,

        // Discount
        discount_type: discountInfo.discount_type,
        discount_value: discountInfo.discount_value,
        discount_amount: discountInfo.discount_amount,

        // After discount
        after_discount_total,

        // GST calculation
        base_amount: gstInfo.base_amount,
        sgst_amount: gstInfo.sgst_amount,
        cgst_amount: gstInfo.cgst_amount,

        // For database storage
        subtotal: gstInfo.base_amount,
        total_amount: after_discount_total,
        expense_amount: 0
    };
};

/**
 * Validate invoice data integrity
 * Ensures that subtotal + sgst + cgst = total_amount (with tolerance)
 *
 * @param {Object} invoice - Invoice data
 * @throws {Error} If validation fails
 */
exports.validateInvoiceIntegrity = (invoice) => {
    const { subtotal, sgst_amount, cgst_amount, total_amount, discount_amount } = invoice;

    const calculated_total = Number((subtotal + sgst_amount + cgst_amount).toFixed(2));
    const tolerance = 0.02; // Allow 2 paise difference due to rounding in SGST and CGST splits

    if (Math.abs(calculated_total - total_amount) > tolerance) {
        throw new Error(
            `Invoice integrity check failed: subtotal(${subtotal}) + sgst(${sgst_amount}) + cgst(${cgst_amount}) = ${calculated_total}, but total_amount is ${total_amount}`
        );
    }

    return true;
};
