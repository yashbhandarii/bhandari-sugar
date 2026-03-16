
import { db } from './server/db/index.js';
import { godowns } from './server/db/schema.js';

async function seedGodown() {
    try {
        console.log('Seeding Godown...');
        const result = await db.insert(godowns).values({
            name: 'Main Godown',
            location: 'Warehouse 1',
        }).returning();
        console.log('Created Godown:', result);
    } catch (error) {
        console.error('Error seeding Godown:', error);
    }
}

seedGodown();
