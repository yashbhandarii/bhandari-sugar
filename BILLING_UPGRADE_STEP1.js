/**
 * STEP 1: DATABASE SCHEMA UPDATE - DISCOUNT FEATURE
 * ================================================
 *
 * ✅ COMPLETED
 *
 * CHANGES MADE:
 *
 * 1. INVOICES TABLE - Added 3 new columns for discount handling:
 *
 *    a) discount_type VARCHAR(50)
 *       - Values: 'percentage', 'fixed', or NULL
 *       - NULL means no discount applied
 *       - Database constraint: CHECK (discount_type IN ('percentage', 'fixed', NULL))
 *
 *    b) discount_value DECIMAL(10, 2)
 *       - For percentage: stores 0-100 (e.g., 10 for 10%)
 *       - For fixed: stores amount in rupees (e.g., 2000)
 *       - NULL when no discount
 *
 *    c) discount_amount DECIMAL(12, 2)
 *       - Calculated final discount amount in rupees
 *       - Always >= 0
 *       - Default: 0.00
 *
 * 2. BILLING_RATES TABLE - Already existed with correct structure:
 *    - delivery_sheet_id (FK to delivery_sheets)
 *    - medium_rate (GST inclusive)
 *    - super_small_rate (GST inclusive)
 *    - created_by (FK to users)
 *    - created_at timestamp
 *
 *    Rates are entered by Manager during billing generation.
 *
 *
 * SCHEMA RELATIONSHIPS:
 *
 *    users (managers/drivers)
 *      ↓
 *    delivery_sheets (created by driver)
 *      ↓
 *    billing_rates (rates entered by manager)
 *      ↓
 *    delivery_items + billing_rates → invoices
 *      ↓
 *    invoices (with discount columns)
 *
 *
 * FINANCIAL CALCULATION LOGIC (to be implemented in STEP 2):
 *
 *    Step 1: Calculate inclusive subtotal
 *            inclusive_total = bags × rate
 *
 *    Step 2: Apply discount (if any)
 *            IF discount_type = 'percentage':
 *                discount_amount = inclusive_total × (discount_value / 100)
 *            ELSE IF discount_type = 'fixed':
 *                discount_amount = discount_value
 *            ELSE:
 *                discount_amount = 0
 *
 *    Step 3: Validate discount
 *            CHECK: discount_amount <= inclusive_total
 *            CHECK: discount_amount >= 0
 *
 *    Step 4: Calculate after-discount total
 *            after_discount_total = inclusive_total - discount_amount
 *
 *    Step 5: Split GST from discounted total
 *            base_amount = after_discount_total / 1.05
 *            gst_total = after_discount_total - base_amount
 *            sgst_amount = gst_total / 2
 *            cgst_amount = gst_total / 2
 *
 *    Step 6: Store in database
 *            subtotal = base_amount
 *            sgst_amount = sgst_amount
 *            cgst_amount = cgst_amount
 *            total_amount = after_discount_total
 *            discount_amount = calculated_discount_amount
 *            discount_type = 'percentage' | 'fixed' | NULL
 *            discount_value = discount_value (if provided)
 *
 *
 * VALIDATION RULES (to ensure data integrity):
 *
 *    ✓ discount_amount >= 0
 *    ✓ discount_amount <= inclusive_total
 *    ✓ medium_rate > 0
 *    ✓ super_small_rate > 0
 *    ✓ subtotal + sgst_amount + cgst_amount = total_amount (with rounding tolerance)
 *    ✓ Cannot generate duplicate invoices for same delivery_sheet_id
 *
 *
 * FILES MODIFIED:
 *
 *    1. database/schema.sql
 *       - Updated invoices table with discount columns
 *
 *    2. backend/scripts/add-discount-to-invoices.js (NEW)
 *       - Migration script to add discount columns
 *       - Idempotent (safe to run multiple times)
 *       - Checks column existence before adding
 *
 *
 * MIGRATION STATUS:
 *
 *    ✅ Migration executed successfully
 *    ✅ Columns verified in database
 *    ✅ No data loss (additive changes only)
 *    ✅ Backward compatible (discount fields default to NULL/0)
 *
 *
 * NEXT STEPS (STEP 2):
 *
 *    1. Update billing.service.js:
 *       - Modify generateInvoices() to accept discount parameters
 *       - Add discount calculation logic
 *       - Implement GST split from discounted total
 *       - Add validation checks
 *
 *    2. Update billing.controller.js:
 *       - Add discount parameters to billing generation endpoint
 *       - Validate input parameters
 *       - Return clear error messages
 *
 *    3. Create billing.validations.js (utility):
 *       - Discount validation functions
 *       - Rate validation functions
 *       - GST calculation utilities
 *
 */
