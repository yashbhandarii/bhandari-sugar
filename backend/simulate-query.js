const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    await client.connect();

    const userId = 1;
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_deleted = false';
    const params = [userId];
    whereClause += ' AND created_by = $1';

    // 1. Get total count
    const countQuery = `SELECT COUNT(*) FROM delivery_sheets ${whereClause}`;
    const countRes = await client.query(countQuery, params);
    console.log('Total Count:', countRes.rows[0].count);

    // 2. Get paginated data
    let query = `SELECT * FROM delivery_sheets ${whereClause} ORDER BY date DESC, id DESC LIMIT $2 OFFSET $3`;
    const dataParams = [userId, limit, offset];

    const result = await client.query(query, dataParams);
    console.log('Result Rows:', result.rows.length);
    result.rows.forEach(r => console.log(JSON.stringify(r)));

    await client.end();
}
check().catch(e => console.error(e));
