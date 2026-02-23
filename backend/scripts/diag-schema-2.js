const db = require('../db');

async function diag() {
    try {
        const columnsRes = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'delivery_quantities'
        `);
        console.log('delivery_quantities columns:', columnsRes.rows);

        const columnsRes2 = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'categories'
        `);
        console.log('categories columns:', columnsRes2.rows);

    } catch (err) {
        console.error('Diag failed:', err);
    } finally {
        process.exit();
    }
}

diag();
