const fs = require('fs');
const path = require('path');
const db = require('../db');

async function applyFix() {
    console.log('--- APPLYING DATABASE FIXES ---');
    const fixSqlPath = path.join(__dirname, '../../database/fix_missing_tables.sql');

    try {
        const sql = fs.readFileSync(fixSqlPath, 'utf8');
        console.log('Executing fix_missing_tables.sql...');

        await db.pool.query(sql);

        console.log('SUCCESS: All missing tables and columns have been created.');

        // Now try to run recover-setup.js to seed the data
        console.log('Attempting to seed required data (categories, active year)...');
        const { exec } = require('child_process');
        exec('node backend/scripts/recover-setup.js', { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Seeding error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Seeding stderr: ${stderr}`);
                return;
            }
            console.log(`Seeding output: ${stdout}`);
            console.log('DATABASE IS NOW FULLY RECOVERED.');
            process.exit(0);
        });

    } catch (err) {
        console.error('FIX FAILED:', err);
        process.exit(1);
    }
}

applyFix();
