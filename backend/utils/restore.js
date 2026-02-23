const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const restoreDatabase = (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            return reject(new Error('Backup file path is required'));
        }

        const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

        if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD) {
            return reject(new Error('Missing database configuration in environment variables'));
        }

        // WARNING: This will overwrite data. 
        // psql command to restore from a plain SQL file
        const command = `set PGPASSWORD=${DB_PASSWORD}&& psql -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT || 5432} -d ${DB_NAME} -f "${filePath}"`;

        console.log(`Starting restore from: ${filePath}...`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Restore failed: ${error.message}`);
                return reject(error);
            }
            // psql output might be in stdout or stderr depending on messages
            console.log(`Restore completed successfully.`);
            resolve(true);
        });
    });
};

module.exports = { restoreDatabase };
