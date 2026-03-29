require('dotenv').config();
const db = require('./db.js');

(async () => {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='godown_invoices'");
        console.log("Columns:", res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
