const db = require('../db');

async function diag() {
    try {
        const columnsRes = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'delivery_quantities'
        `);
        console.log('delivery_quantities columns:', JSON.stringify(columnsRes.rows, null, 2));

        const columnsRes2 = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'categories'
        `);
        console.log('categories columns:', JSON.stringify(columnsRes2.rows, null, 2));

    } catch (err) {
        console.error('Diag failed:', err);
    } finally {
        process.exit();
    }
}

diag();
