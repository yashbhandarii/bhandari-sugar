const express = require('express');
const router = express.Router();
const financialYearController = require('../controllers/financial_year.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

const verifyOwner = checkRole(['owner']);

router.use(verifyToken);

// Get all financial years
router.get('/', financialYearController.getAllYears);

// Get active financial year
router.get('/active', financialYearController.getActiveYear);

// Owner strictly
router.post('/', verifyOwner, financialYearController.createYear);
router.post('/:id/close', verifyOwner, financialYearController.closeYear);
router.post('/:id/soft-lock', verifyOwner, financialYearController.toggleSoftLock);

// Download full PDF report for any year (owner only)
router.get('/:id/report', verifyOwner, financialYearController.downloadYearReport);

// Download full JSON export of all year data (owner only)
router.get('/:id/export-json', verifyOwner, financialYearController.downloadYearJSON);

// Permanently delete all transactional data - IRREVERSIBLE (owner only, year must be closed)
router.delete('/:id/purge', verifyOwner, financialYearController.purgeYearData);

module.exports = router;
