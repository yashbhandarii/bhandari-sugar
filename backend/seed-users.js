const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedUsers() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();
        console.log('Connected to database...');

        const users = [
            { name: 'Driver Name', mobile: '9999999999', password: 'Driver11@', role: 'driver' },
            { name: 'Somnath Manager', mobile: '9527042265', password: 'somnath65@', role: 'manager' },
            { name: 'Bhandari Owner', mobile: '9422228205', password: 'bhandari51@', role: 'owner' }
        ];

        for (const user of users) {
            // Check if user exists
            const res = await client.query('SELECT * FROM users WHERE mobile = $1', [user.mobile]);
            if (res.rows.length === 0) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await client.query(
                    'INSERT INTO users (name, mobile, password, role) VALUES ($1, $2, $3, $4)',
                    [user.name, user.mobile, hashedPassword, user.role]
                );
                console.log(`Created user: ${user.name} (${user.role})`);
            } else {
                console.log(`User already exists: ${user.name}`);
            }
        }

        console.log('\n--- Seed Complete ---');
        console.log('Login Credentials:');
        users.forEach(u => {
            console.log(`${u.role.toUpperCase()}: Mobile: ${u.mobile}, Password: ${u.password}`);
        });

    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        await client.end();
    }
}

seedUsers();
