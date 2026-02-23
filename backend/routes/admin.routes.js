const express = require('express');
const router = express.Router();
const { backupDatabase } = require('../utils/backup');
const { restoreDatabase } = require('../utils/restore');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `restore_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// @route   GET /api/admin/backup
// @desc    Trigger database backup and download SQL file
// @access  Private (Owner only)
router.get('/backup', verifyToken, checkRole(['owner']), async (req, res) => {
    try {
        const filePath = await backupDatabase();
        res.download(filePath, (err) => {
            if (err) {
                console.error('File download failed:', err);
                res.status(500).json({ error: 'Failed to download backup file' });
            }
        });
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).json({ error: 'Backup generation failed', details: error.message });
    }
});

// @route   POST /api/admin/restore
// @desc    Restore database from uploaded SQL file
// @access  Private (Owner only)
router.post('/restore', verifyToken, checkRole(['owner']), upload.single('backupFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const filePath = req.file.path;

    try {
        await restoreDatabase(filePath);

        // Clean up uploaded file after restore
        fs.unlinkSync(filePath);

        res.json({ message: 'Database restored successfully' });
    } catch (error) {
        console.error('Restore failed:', error);
        res.status(500).json({ error: 'Database restore failed', details: error.message });
    }
});

module.exports = router;
