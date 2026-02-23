const cron = require('node-cron');
const { backupDatabase } = require('../utils/backup');
const fs = require('fs');
const path = require('path');

const initScheduler = () => {
    console.log('Initializing Backup Scheduler...');

    // Schedule task to run at 11:59 PM every day
    cron.schedule('59 23 * * *', async () => {
        console.log('Running scheduled daily backup...');
        try {
            const filePath = await backupDatabase();
            console.log(`Scheduled backup successful: ${filePath}`);

            // Optional: Log to a file
            const logMessage = `[${new Date().toISOString()}] Backup successful: ${filePath}\n`;
            fs.appendFileSync(path.join(__dirname, '../backups/backup.log'), logMessage);

        } catch (error) {
            console.error('Scheduled backup failed:', error);
            const logMessage = `[${new Date().toISOString()}] Backup FAILED: ${error.message}\n`;
            fs.appendFileSync(path.join(__dirname, '../backups/backup.log'), logMessage);
        }
    });

    console.log('Backup Scheduler running: 11:59 PM Daily.');
};

module.exports = { initScheduler };
