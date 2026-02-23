const db = require('../db');

const checkConstraints = async () => {
    const table = 'delivery_sheets';
    const query = `
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE c.conrelid = (SELECT oid FROM pg_class WHERE relname = $1)
    `;

    const client = await db.pool.connect();
    try {
        const res = await client.query(query, [table]);
        console.log(`Constraints for ${table}:`);
        res.rows.forEach(r => {
            console.log(`${r.conname}: ${r.pg_get_constraintdef}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit();
    }
};

checkConstraints();
