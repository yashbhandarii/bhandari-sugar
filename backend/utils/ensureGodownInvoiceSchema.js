const db = require('../db');

async function ensureGodownInvoiceSchema() {
    await db.query(`
        ALTER TABLE godown_invoices
        ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)
    `);

    await db.query(`
        ALTER TABLE godown_invoices
        ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(20)
    `);

    console.log('Verified godown_invoices customer_name/customer_mobile columns.');
}

module.exports = {
    ensureGodownInvoiceSchema,
};
