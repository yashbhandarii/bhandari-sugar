const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Apply verifyToken to all routes
router.use(verifyToken);

// GET /api/customers - List customers
router.get('/', customerController.getAllCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customerController.getCustomerById);

const { validateCustomer } = require('../middleware/validation.middleware');

// POST /api/customers - Create/Update/Delete (Manager Only)
router.post('/', checkRole(['manager', 'owner']), validateCustomer, customerController.createCustomer);
router.put('/:id', checkRole(['manager', 'owner']), customerController.updateCustomer); // Ensure updateCustomer exists in customerController
router.delete('/:id', checkRole(['manager', 'owner']), customerController.deleteCustomer); // Ensure deleteCustomer exists in customerController

module.exports = router;
