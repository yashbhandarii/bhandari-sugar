import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('bhandari-sugar.db');
export const db = drizzle(sqlite, { schema });

// Initialize database with default data
export async function initializeDatabase() {
    try {
        // Check if categories exist
        const existingCategories = db.select().from(schema.categories).all();

        if (existingCategories.length === 0) {
            // Insert default categories
            db.insert(schema.categories).values([
                { name: 'Medium', defaultBagWeight: 50 },
                { name: 'Super Small', defaultBagWeight: 50 },
            ]).run();

            console.log('✅ Default categories created');
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}
