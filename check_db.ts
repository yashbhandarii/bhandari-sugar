
import { db } from './server/db/index.js';
import { categories, godowns, inventoryPurchases } from './server/db/schema.js';

async function checkDb() {
    try {
        console.log('Checking Categories...');
        const allCategories = await db.select().from(categories).all();
        console.log('Categories:', allCategories);

        console.log('\nChecking Godowns...');
        const allGodowns = await db.select().from(godowns).all();
        console.log('Godowns:', allGodowns);

        console.log('\nChecking Purchases...');
        const allPurchases = await db.select().from(inventoryPurchases).all();
        console.log('Purchases:', allPurchases);

    } catch (error) {
        console.error('Error checking DB:', error);
    }
}

checkDb();
