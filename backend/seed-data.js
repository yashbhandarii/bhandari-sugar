const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
        // 0. Clear existing data (in correct order due to foreign keys)
        console.log('Clearing existing data...');
        await db.query('DELETE FROM payments');
        await db.query('DELETE FROM invoices');
        await db.query('DELETE FROM delivery_items');
        await db.query('DELETE FROM delivery_sheets');
        await db.query('DELETE FROM stock_movements');
        await db.query('DELETE FROM customers');
        console.log('✅ Cleared existing data');

        // 1. Create Users (if not exists)
        console.log('Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Check if users exist first
        const existingUsers = await db.query('SELECT mobile FROM users WHERE mobile IN ($1, $2, $3)',
            ['9999999999', '8888888888', '7777777777']);

        if (existingUsers.rows.length === 0) {
            await db.query(`
                INSERT INTO users (name, mobile, password, role)
                VALUES 
                    ('Rajesh Kumar', '9999999999', $1, 'owner'),
                    ('Amit Sharma', '8888888888', $1, 'manager'),
                    ('Vijay Singh', '7777777777', $1, 'driver')
            `, [hashedPassword]);
            console.log('✅ Created 3 users');
        } else {
            console.log('✅ Users already exist');
        }

        // Get user IDs
        const userResult = await db.query('SELECT id, role FROM users ORDER BY id');
        const driverId = userResult.rows.find(u => u.role === 'driver')?.id || 1;
        console.log(`Using driver ID: ${driverId}`);

        // 2. Create Customers
        console.log('Creating customers...');
        const customerResult = await db.query(`
            INSERT INTO customers (name, mobile, address)
            VALUES 
                ('Sharma Sweets', '9876543210', 'Shop No. 12, Main Market, Delhi'),
                ('Gupta Traders', '9876543211', '45 Gandhi Road, Mumbai'),
                ('Verma Stores', '9876543212', 'Plot 8, Industrial Area, Pune'),
                ('Patel Brothers', '9876543213', '23 Station Road, Ahmedabad'),
                ('Singh Enterprises', '9876543214', '67 Mall Road, Jaipur'),
                ('Kumar & Sons', '9876543215', '89 Park Street, Kolkata'),
                ('Mehta Trading Co', '9876543216', '34 Beach Road, Chennai'),
                ('Reddy Distributors', '9876543217', '56 MG Road, Bangalore')
            RETURNING id
        `);
        const customerIds = customerResult.rows.map(r => r.id);
        console.log(`✅ Created ${customerIds.length} customers`);

        // 3. Create Stock Movements (Initial Stock)
        console.log('Adding initial stock...');
        await db.query(`
            INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id)
            VALUES 
                ('medium', 'factory_in', 500, 'purchase', 1),
                ('super_small', 'factory_in', 800, 'purchase', 1),
                ('medium', 'godown_in', 200, 'transfer', 1),
                ('super_small', 'godown_in', 300, 'transfer', 1)
        `);
        console.log('✅ Added initial stock');

        // 4. Create Delivery Sheets
        console.log('Creating delivery sheets...');

        // Sheet 1 - Submitted (7 days ago)
        const sheet1Date = new Date();
        sheet1Date.setDate(sheet1Date.getDate() - 7);
        const sheet1Result = await db.query(`
            INSERT INTO delivery_sheets (truck_number, created_by, date, medium_rate, super_small_rate, status)
            VALUES ('DL-01-AB-1234', $1, $2, 950, 480, 'submitted')
            RETURNING id
        `, [driverId, sheet1Date]);
        const sheet1Id = sheet1Result.rows[0].id;

        // Add items to Sheet 1
        await db.query(`
            INSERT INTO delivery_items (delivery_sheet_id, customer_id, medium_bags, super_small_bags)
            VALUES 
                ($1, $2, 10, 20),
                ($1, $3, 15, 25),
                ($1, $4, 8, 15)
        `, [sheet1Id, customerIds[0], customerIds[1], customerIds[2]]);

        // Stock movements for Sheet 1
        await db.query(`
            INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id)
            VALUES 
                ('medium', 'delivery_out', 33, 'delivery_sheet', $1),
                ('super_small', 'delivery_out', 60, 'delivery_sheet', $1)
        `, [sheet1Id]);

        // Sheet 2 - Billed (5 days ago)
        const sheet2Date = new Date();
        sheet2Date.setDate(sheet2Date.getDate() - 5);
        const sheet2Result = await db.query(`
            INSERT INTO delivery_sheets (truck_number, created_by, date, medium_rate, super_small_rate, status)
            VALUES ('DL-01-CD-5678', $1, $2, 950, 480, 'billed')
            RETURNING id
        `, [driverId, sheet2Date]);
        const sheet2Id = sheet2Result.rows[0].id;

        await db.query(`
            INSERT INTO delivery_items (delivery_sheet_id, customer_id, medium_bags, super_small_bags)
            VALUES 
                ($1, $2, 12, 18),
                ($1, $3, 20, 30),
                ($1, $4, 10, 15),
                ($1, $5, 8, 12)
        `, [sheet2Id, customerIds[3], customerIds[4], customerIds[5], customerIds[6]]);

        await db.query(`
            INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id)
            VALUES 
                ('medium', 'delivery_out', 50, 'delivery_sheet', $1),
                ('super_small', 'delivery_out', 75, 'delivery_sheet', $1)
        `, [sheet2Id]);

        // Sheet 3 - Draft (today)
        const sheet3Result = await db.query(`
            INSERT INTO delivery_sheets (truck_number, created_by, date, medium_rate, super_small_rate, status)
            VALUES ('DL-01-EF-9012', $1, NOW(), 950, 480, 'draft')
            RETURNING id
        `, [driverId]);
        const sheet3Id = sheet3Result.rows[0].id;

        await db.query(`
            INSERT INTO delivery_items (delivery_sheet_id, customer_id, medium_bags, super_small_bags)
            VALUES 
                ($1, $2, 5, 10)
        `, [sheet3Id, customerIds[7]]);

        console.log('✅ Created 3 delivery sheets');

        // 5. Generate Invoices for Sheet 2 (billed)
        console.log('Generating invoices...');
        const sheet2Items = await db.query(`
            SELECT * FROM delivery_items WHERE delivery_sheet_id = $1
        `, [sheet2Id]);

        for (const item of sheet2Items.rows) {
            const medium_amount = item.medium_bags * 950;
            const super_small_amount = item.super_small_bags * 480;
            const subtotal = medium_amount + super_small_amount;
            const sgst_amount = subtotal * 0.025;
            const cgst_amount = subtotal * 0.025;
            const total_amount = subtotal + sgst_amount + cgst_amount;

            await db.query(`
                INSERT INTO invoices (delivery_sheet_id, customer_id, subtotal, sgst_amount, cgst_amount, expense_amount, total_amount, status, created_at)
                VALUES ($1, $2, $3, $4, $5, 0, $6, 'unpaid', $7)
            `, [sheet2Id, item.customer_id, subtotal, sgst_amount, cgst_amount, total_amount, sheet2Date]);
        }
        console.log(`✅ Generated ${sheet2Items.rows.length} invoices`);

        // 6. Add Some Payments
        console.log('Adding payments...');

        // Payment 1 - 3 days ago
        const payment1Date = new Date();
        payment1Date.setDate(payment1Date.getDate() - 3);
        await db.query(`
            INSERT INTO payments (customer_id, amount, payment_method, payment_date, notes)
            VALUES 
                ($1, 15000, 'cash', $2, 'Partial payment')
        `, [customerIds[3], payment1Date]);

        await db.query(`
            INSERT INTO payments (customer_id, amount, payment_method, payment_date, notes)
            VALUES 
                ($1, 25000, 'upi', $2, 'Full payment')
        `, [customerIds[4], payment1Date]);

        // Payment 2 - Today
        await db.query(`
            INSERT INTO payments (customer_id, amount, payment_method, payment_date, notes)
            VALUES 
                ($1, 10000, 'cheque', NOW(), 'Cheque #123456')
        `, [customerIds[5]]);

        console.log('✅ Added 3 payments');

        // Update invoice statuses based on payments
        await db.query(`
            UPDATE invoices 
            SET status = 'paid' 
            WHERE customer_id = $1
        `, [customerIds[4]]);

        await db.query(`
            UPDATE invoices 
            SET status = 'partial' 
            WHERE customer_id IN ($1, $2)
        `, [customerIds[3], customerIds[5]]);

        console.log('✅ Updated invoice statuses');

        // 7. Summary
        const summary = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM customers) as customers,
                (SELECT COUNT(*) FROM delivery_sheets) as delivery_sheets,
                (SELECT COUNT(*) FROM invoices) as invoices,
                (SELECT COUNT(*) FROM payments) as payments,
                (SELECT SUM(total_amount) FROM invoices) as total_sales,
                (SELECT SUM(amount) FROM payments) as total_collected
        `);

        console.log('\n📊 Database Seeding Complete!');
        console.log('================================');
        console.log(`Customers: ${summary.rows[0].customers}`);
        console.log(`Delivery Sheets: ${summary.rows[0].delivery_sheets}`);
        console.log(`Invoices: ${summary.rows[0].invoices}`);
        console.log(`Payments: ${summary.rows[0].payments}`);
        console.log(`Total Sales: ₹${parseFloat(summary.rows[0].total_sales || 0).toLocaleString()}`);
        console.log(`Total Collected: ₹${parseFloat(summary.rows[0].total_collected || 0).toLocaleString()}`);
        console.log(`Pending: ₹${(parseFloat(summary.rows[0].total_sales || 0) - parseFloat(summary.rows[0].total_collected || 0)).toLocaleString()}`);
        console.log('================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
