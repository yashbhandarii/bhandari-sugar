const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const getBackupDir = () => {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
};

const backupDatabase = () => {
    return new Promise((resolve, reject) => {
        const backupDir = getBackupDir();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const fileName = `backup_${year}_${month}_${day}_${hours}_${minutes}.sql`;
        const filePath = path.join(backupDir, fileName);

        // Construct pg_dump command
        // Using PGPASSWORD environment variable for password to avoid interactive prompt
        // Note: It's better to use .pgpass file in production, but for this setup we'll use env var injection in the child process

        const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

        // Ensure we have all necessary env vars
        if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD) {
            return reject(new Error('Missing database configuration in environment variables'));
        }

        const command = `set PGPASSWORD=${DB_PASSWORD}&& pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT || 5432} -d ${DB_NAME} -f "${filePath}"`;

        console.log(`Starting backup: ${fileName}...`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup failed: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                // pg_dump writes to stderr for progress, but usually if exit code is 0 it's fine.
                // However, we can log it.
                // console.warn(`Backup stderr: ${stderr}`);
            }

            console.log(`Backup completed successfully: ${filePath}`);
            resolve(filePath);
        });
    });
};

module.exports = { backupDatabase };
