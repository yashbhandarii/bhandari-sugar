const db = require('../db');
const bcrypt = require('bcryptjs');

async function createOwnerUser() {
    const client = await db.pool.connect();
    try {
        const password = await bcrypt.hash('password123', 10);

        // Upsert Owner User
        const res = await client.query(`
            INSERT INTO users (name, mobile, password, role)
            VALUES ('Test Owner', '9876543212', $1, 'owner')
            ON CONFLICT (mobile) 
            DO UPDATE SET password = EXCLUDED.password
            RETURNING id, name, mobile, role
        `, [password]);

        console.log('Owner User Created/Updated:', res.rows[0]);
    } catch (err) {
        console.error('Error creating owner user:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

createOwnerUser();
