require('dotenv').config();
const db = require('./backend/db');

async function testQuery() {
    try {
        const id = "1"; // from the URL params
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
        
        console.log("Running Query for ID:", id);
        const res = await db.query(query, [id]);
        console.log("Rows returned:", res.rows.length);
        if (res.rows.length > 0) {
            console.log("Row:", res.rows[0]);
        }
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

testQuery();
