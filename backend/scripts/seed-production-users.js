/**
 * PRODUCTION USER SEEDING SCRIPT
 * Targets Supabase PostgreSQL directly.
 * Run with: node scripts/seed-production-users.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// ── Supabase connection ──────────────────────────────────────────────────────
// Pass your Supabase DB password as the first argument:
//   node scripts/seed-production-users.js  YourPasswordHere
//
const dbPassword = process.argv[2];
if (!dbPassword) {
    console.error('❌ Usage: node scripts/seed-production-users.js <DB_PASSWORD>');
    process.exit(1);
}

const pool = new Pool({
    host: 'db.jaokadmipvnmceqxqisj.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    family: 4   // Force IPv4 — avoids IPv6 routing issues on local networks
});

// ── Users to create ──────────────────────────────────────────────────────────
const USERS = [
    { name: 'Owner', mobile: '9422228205', password: 'bhandari51@', role: 'owner' },
    { name: 'Manager', mobile: '9527042265', password: 'somnath65@', role: 'manager' },
    { name: 'Driver', mobile: '9999999999', password: 'driver11@', role: 'driver' },
];

async function seedUsers() {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase DB\n');

    try {
        for (const user of USERS) {
            const hashedPassword = await bcrypt.hash(user.password, 12);

            const result = await client.query(`
                INSERT INTO users (name, mobile, password, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (mobile)
                DO UPDATE SET
                    name     = EXCLUDED.name,
                    password = EXCLUDED.password,
                    role     = EXCLUDED.role
                RETURNING id, name, mobile, role
            `, [user.name, user.mobile, hashedPassword, user.role]);

            const row = result.rows[0];
            console.log(`✅ ${row.role.toUpperCase().padEnd(8)} → ${row.name} (${row.mobile})  [id: ${row.id}]`);
        }

        console.log('\n🎉 All production users seeded successfully!');
    } catch (err) {
        console.error('❌ Error seeding users:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedUsers();
