const db = require('../db');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const client = await db.pool.connect();
    try {
        const password = await bcrypt.hash('password123', 10);

        // Upsert Manager User
        const res = await client.query(`
            INSERT INTO users (name, mobile, password, role)
            VALUES ('Test Manager', '9876543210', $1, 'manager')
            ON CONFLICT (mobile) 
            DO UPDATE SET password = EXCLUDED.password
            RETURNING id, name, mobile, role
        `, [password]);

        console.log('Test User Created/Updated:', res.rows[0]);
    } catch (err) {
        console.error('Error creating test user:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

createTestUser();
