const db = require('../db');

async function diag() {
    try {
        const tablesRes = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tablesRes.rows.map(r => r.table_name));

        const columnsRes = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stock_movements'
        `);
        console.log('stock_movements columns:', columnsRes.rows);

        const catRes = await db.query("SELECT * FROM categories LIMIT 5");
        console.log('Categories sample:', catRes.rows);

    } catch (err) {
        console.error('Diag failed:', err);
    } finally {
        process.exit();
    }
}

diag();
