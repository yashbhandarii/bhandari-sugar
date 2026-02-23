const db = require('./db');

async function seedMinimal() {
    console.log('🌱 Starting minimal database seeding...');

    try {
        // Clear existing data
        console.log('Clearing existing data...');
        await db.query('DELETE FROM payments');
        await db.query('DELETE FROM invoices');
        await db.query('DELETE FROM delivery_items');
        await db.query('DELETE FROM delivery_sheets');
        await db.query('DELETE FROM stock_movements');
        await db.query('DELETE FROM customers');
        console.log('✅ Cleared existing data');

        // Create Customers
        console.log('Creating customers...');
        await db.query(`
            INSERT INTO customers (name, mobile, address)
            VALUES 
                ('Sharma Sweets', '9876543210', 'Shop No. 12, Main Market, Delhi'),
                ('Gupta Traders', '9876543211', '45 Gandhi Road, Mumbai'),
                ('Verma Stores', '9876543212', 'Plot 8, Industrial Area, Pune'),
                ('Patel Brothers', '9876543213', '23 Station Road, Ahmedabad'),
                ('Singh Enterprises', '9876543214', '67 Mall Road, Jaipur')
        `);
        console.log('✅ Created 5 customers');

        // Add Initial Stock
        console.log('Adding initial stock...');
        await db.query(`
            INSERT INTO stock_movements (category, movement_type, bags, reference_type, reference_id)
            VALUES 
                ('medium', 'factory_in', 500, 'purchase', 1),
                ('super_small', 'factory_in', 800, 'purchase', 1)
        `);
        console.log('✅ Added initial stock');

        // Summary
        const summary = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM customers) as customers,
                (SELECT SUM(CASE WHEN movement_type IN ('factory_in', 'godown_in') THEN bags ELSE 0 END) - 
                        SUM(CASE WHEN movement_type = 'delivery_out' THEN bags ELSE 0 END) 
                 FROM stock_movements WHERE category = 'medium') as medium_stock,
                (SELECT SUM(CASE WHEN movement_type IN ('factory_in', 'godown_in') THEN bags ELSE 0 END) - 
                        SUM(CASE WHEN movement_type = 'delivery_out' THEN bags ELSE 0 END) 
                 FROM stock_movements WHERE category = 'super_small') as super_small_stock
        `);

        console.log('\n📊 Database Seeding Complete!');
        console.log('================================');
        console.log(`Customers: ${summary.rows[0].customers}`);
        console.log(`Medium Stock: ${summary.rows[0].medium_stock} bags`);
        console.log(`Super Small Stock: ${summary.rows[0].super_small_stock} bags`);
        console.log('================================');
        console.log('\n✅ You can now use the application to:');
        console.log('   1. Login as Driver (7777777777 / password123)');
        console.log('   2. Create delivery sheets');
        console.log('   3. Login as Manager (8888888888 / password123)');
        console.log('   4. Generate invoices and collect payments');
        console.log('   5. Login as Owner (9999999999 / password123)');
        console.log('   6. View dashboard with real data\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedMinimal();
