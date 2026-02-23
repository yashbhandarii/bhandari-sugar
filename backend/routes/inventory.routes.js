const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

// GET /api/inventory/stock
router.get('/stock', inventoryController.getCurrentStock);

// POST /api/inventory/movements (Manual adjustment)
router.post('/movements', checkRole(['manager', 'owner']), inventoryController.createMovement);

module.exports = router;
