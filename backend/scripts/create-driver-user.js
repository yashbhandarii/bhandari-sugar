const db = require('../db');
const bcrypt = require('bcryptjs');

async function createDriverUser() {
    const client = await db.pool.connect();
    try {
        const password = await bcrypt.hash('password123', 10);

        // Upsert Driver User
        const res = await client.query(`
            INSERT INTO users (name, mobile, password, role)
            VALUES ('Test Driver', '9876543211', $1, 'driver')
            ON CONFLICT (mobile) 
            DO UPDATE SET password = EXCLUDED.password
            RETURNING id, name, mobile, role
        `, [password]);

        console.log('Test Driver Created/Updated:', res.rows[0]);
    } catch (err) {
        console.error('Error creating test driver:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

createDriverUser();
