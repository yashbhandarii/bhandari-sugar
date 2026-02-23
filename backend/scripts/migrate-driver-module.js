const db = require('../db');

async function migrateDriverModule() {
    const client = await db.pool.connect();
    try {
        console.log('Starting Driver Module Migration...');
        await client.query('BEGIN');

        // 1. Create categories table
        console.log('Creating categories table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                default_weight DECIMAL(10, 2) DEFAULT 30.00,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed default categories if they don't exist
        // Using upsert (ON CONFLICT DO NOTHING) to handle re-runs safe-ish
        console.log('Seeding default categories...');
        const mediumRes = await client.query(`
            INSERT INTO categories (name, default_weight) VALUES ('Medium', 30.00) 
            ON CONFLICT (name) DO UPDATE SET is_active = TRUE
            RETURNING id;
        `);
        // If it didn't return id (because it existed and DO NOTHING/UPDATE didn't ret row?), fetch it.
        // Actually DO UPDATE RETURNING works.
        // But let's be safe and fetch IDs.

        const catRes = await client.query(`SELECT id, name FROM categories WHERE name IN ('Medium', 'Super Small')`);
        let mediumId, superSmallId;

        // If not found (e.g. fresh run where returning didn't work as expected or whatever), insert/fetch again.
        // Simplest: just fetch map.

        // Check if Medium exists, if not insert
        let mediumRow = catRes.rows.find(c => c.name === 'Medium');
        if (!mediumRow) {
            const r = await client.query(`INSERT INTO categories (name, default_weight) VALUES ('Medium', 30.00) RETURNING id`);
            mediumId = r.rows[0].id;
        } else {
            mediumId = mediumRow.id;
        }

        let superSmallRow = catRes.rows.find(c => c.name === 'Super Small');
        if (!superSmallRow) {
            const r = await client.query(`INSERT INTO categories (name, default_weight) VALUES ('Super Small', 30.00) RETURNING id`);
            superSmallId = r.rows[0].id;
        } else {
            superSmallId = superSmallRow.id;
        }

        console.log(`Categories ensured: Medium ID=${mediumId}, Super Small ID=${superSmallId}`);

        // 2. Modify delivery_sheets
        console.log('Altering delivery_sheets...');
        await client.query(`
            ALTER TABLE delivery_sheets 
            ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255) DEFAULT 'Akhtar';
        `);
        // truck_number already exists

        // 3. Create delivery_sheet_rates
        console.log('Creating delivery_sheet_rates...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS delivery_sheet_rates (
                id SERIAL PRIMARY KEY,
                delivery_sheet_id INTEGER REFERENCES delivery_sheets(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id),
                rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                UNIQUE(delivery_sheet_id, category_id)
            );
        `);

        // 4. Create delivery_quantities
        console.log('Creating delivery_quantities...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS delivery_quantities (
                id SERIAL PRIMARY KEY,
                delivery_item_id INTEGER REFERENCES delivery_items(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES categories(id),
                bags INTEGER NOT NULL DEFAULT 0,
                UNIQUE(delivery_item_id, category_id)
            );
        `);

        // 5. Migrate Data
        console.log('Migrating existing data...');

        // Migrate Rates
        // We only migrate if the table is empty to avoid duplicates on re-run, or use ON CONFLICT
        const sheetsRes = await client.query(`SELECT id, medium_rate, super_small_rate FROM delivery_sheets`);
        for (const sheet of sheetsRes.rows) {
            if (sheet.medium_rate > 0) {
                await client.query(`
                    INSERT INTO delivery_sheet_rates (delivery_sheet_id, category_id, rate)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (delivery_sheet_id, category_id) DO UPDATE SET rate = $3
                `, [sheet.id, mediumId, sheet.medium_rate]);
            }
            if (sheet.super_small_rate > 0) {
                await client.query(`
                    INSERT INTO delivery_sheet_rates (delivery_sheet_id, category_id, rate)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (delivery_sheet_id, category_id) DO UPDATE SET rate = $3
                `, [sheet.id, superSmallId, sheet.super_small_rate]);
            }
        }

        // Migrate Bags
        const itemsRes = await client.query(`SELECT id, medium_bags, super_small_bags FROM delivery_items`);
        for (const item of itemsRes.rows) {
            if (item.medium_bags > 0) {
                await client.query(`
                    INSERT INTO delivery_quantities (delivery_item_id, category_id, bags)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (delivery_item_id, category_id) DO UPDATE SET bags = $3
                `, [item.id, mediumId, item.medium_bags]);
            }
            if (item.super_small_bags > 0) {
                await client.query(`
                    INSERT INTO delivery_quantities (delivery_item_id, category_id, bags)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (delivery_item_id, category_id) DO UPDATE SET bags = $3
                `, [item.id, superSmallId, item.super_small_bags]);
            }
        }

        // 6. Relax stock_movements constraint
        console.log('Relaxing stock_movements constraints...');
        // First check if constraint exists
        // Usually named 'stock_movements_category_check'
        // We can just drop it if it exists.
        await client.query(`
            ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_category_check;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrateDriverModule();
