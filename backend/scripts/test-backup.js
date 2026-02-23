const { backupDatabase } = require('../utils/backup');

console.log('Testing backup utility...');

backupDatabase()
    .then((filePath) => {
        console.log('Test passed. Backup file created at:', filePath);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Test failed:', err);
        process.exit(1);
    });
