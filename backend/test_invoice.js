require('dotenv').config();
const db = require('./db.js');

(async () => {
    try {
        console.log("Fetching all godown_invoices IDs:");
        const allInvs = await db.query('SELECT id, invoice_number, customer_id, customer_name FROM godown_invoices');
        console.log(`Found ${allInvs.rows.length} invoices:`, allInvs.rows);

        if (allInvs.rows.length > 0) {
            const testId = allInvs.rows[0].id;
            console.log("\nTesting getInvoiceById query for ID:", testId);
            
            const query = `
                SELECT
                    i.*,
                    COALESCE(c.name, i.customer_name) as name,
                    c.mobile,
                    c.address,
                    COALESCE((
                        SELECT SUM(gp.amount)
                        FROM godown_payments gp
                        WHERE gp.godown_invoice_id = i.id
                    ), 0) AS paid_amount,
                    (i.total_amount - COALESCE((
                        SELECT SUM(gp.amount)
                        FROM godown_payments gp
                        WHERE gp.godown_invoice_id = i.id
                    ), 0)) AS pending_amount
                FROM godown_invoices i
                LEFT JOIN customers c ON i.customer_id = c.id
                WHERE i.id = $1
            `;
            const res = await db.query(query, [testId]);
            console.log("Query returned rows count:", res.rows.length);
            if (res.rows.length === 0) {
                console.log("WHYYYY? Testing simple query:");
                console.log("Result:", await db.query("SELECT * FROM godown_invoices i WHERE i.id = $1", [testId]).then(r => r.rows));
            } else {
                console.log("It worked locally!");
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
})();
