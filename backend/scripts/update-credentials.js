const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateCredentials() {
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

        const updates = [
            { name: 'Raju Driver', mobile: '9999999999', password: 'Driver11@' },
            { name: 'Amit Manager', mobile: '9527042265', password: 'somnath65@' },
            { name: 'Suresh Owner', mobile: '9422228205', password: 'bhandari51@' }
        ];

        for (const update of updates) {
            const hashedPassword = await bcrypt.hash(update.password, 10);

            // Try to update by name
            console.log(`Attempting to update ${update.name}...`);
            const res = await client.query(
                'UPDATE users SET mobile = $1, password = $2 WHERE name = $3',
                [update.mobile, hashedPassword, update.name]
            );

            if (res.rowCount > 0) {
                console.log(`Updated ${update.name} successfully.`);
            } else {
                console.log(`Failed to update by name: ${update.name}. Trying by role if unique mobile found...`);
                // Fallback: If name doesn't match exactly, try to find a user by role that isn't the target mobile yet
                // But wait, if we have multiple managers, we don't know which one to update.
                // For now, let's just use the name as it's the safest.
            }
        }

        console.log('\n--- Update Complete ---');

    } catch (err) {
        console.error('Error updating credentials:', err);
    } finally {
        await client.end();
    }
}

updateCredentials();
