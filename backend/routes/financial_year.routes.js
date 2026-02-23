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

module.exports = router;
