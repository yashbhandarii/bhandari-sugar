const db = require('../db');

async function addTempId() {
    try {
        await db.query('ALTER TABLE delivery_sheets ADD COLUMN IF NOT EXISTS temp_id VARCHAR(255) UNIQUE;');
        console.log('Added temp_id to delivery_sheets');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}
addTempId();
