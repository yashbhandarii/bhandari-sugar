const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// POST /api/delivery-items
router.post('/', deliveryController.addItemInDeliverySheet);

module.exports = router;
