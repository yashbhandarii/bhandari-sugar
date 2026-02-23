const express = require('express');
const router = express.Router();
const godownController = require('../controllers/godown.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes
router.use(authMiddleware.verifyToken);

// Require 'owner' or 'manager' for these routes
const restrictToPrivileged = (req, res, next) => {
    if (req.userRole !== 'owner' && req.userRole !== 'manager') {
        return res.status(403).json({ error: 'Access denied: Must be owner or manager' });
    }
    next();
};

// Invoices
router.get('/invoices/:id/download', godownController.downloadInvoice);

// Reports (Open to all verified users)
router.get('/reports/summary', godownController.getSummary);
router.get('/reports/customer-summary', godownController.getCustomerSummary);
router.get('/reports/pending', godownController.getPendingInvoices);
router.get('/reports/all-invoices', godownController.getAllInvoices);

// Admin/Manager only actions
router.post('/stock', restrictToPrivileged, godownController.addStock);
router.post('/invoices', restrictToPrivileged, godownController.createInvoice);
router.post('/payments', restrictToPrivileged, godownController.addPayment);
router.get('/reports/stock', restrictToPrivileged, godownController.getStock);

module.exports = router;
