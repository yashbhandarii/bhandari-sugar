const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const { cacheFor } = require('../middleware/cache.middleware');

router.use(verifyToken);
const ownerOnly = checkRole(['owner']);
const managerOrOwner = checkRole(['manager', 'owner']);

// ════════════════════════════════════════════════════════
// EXISTING ROUTES (with caching)
// ════════════════════════════════════════════════════════

// GET /api/reports/dashboard (Manager)
router.get('/dashboard', managerOrOwner, cacheFor(30), reportController.getDashboardSummary);

// GET /api/reports/owner-dashboard (Aggregated)
router.get('/owner-dashboard', ownerOnly, cacheFor(30), reportController.getOwnerDashboard);

// Specific Owner APIs
router.get('/summary', ownerOnly, cacheFor(30), reportController.getOwnerSummary);
router.get('/payment-method-summary', ownerOnly, cacheFor(60), reportController.getPaymentMethodSummary);
router.get('/weekly-sales', ownerOnly, cacheFor(60), reportController.getWeeklySales);
router.get('/risky-customers', ownerOnly, cacheFor(60), reportController.getRiskyCustomers);

// Combined Dashboard Endpoints (Performance — single API call)
router.get('/owner-all', ownerOnly, cacheFor(30), reportController.getOwnerDashboardAll);
router.get('/manager-all', managerOrOwner, cacheFor(30), reportController.getManagerDashboardAll);

router.get('/day', managerOrOwner, cacheFor(60), reportController.getDayReport);
router.get('/week', managerOrOwner, cacheFor(60), reportController.getWeekReport);
router.get('/month', managerOrOwner, cacheFor(60), reportController.getMonthReport);

// ════════════════════════════════════════════════════════
// ADVANCED REPORTING ROUTES (with caching)
// ════════════════════════════════════════════════════════

// REPORT 1: TODAY'S CASH COLLECTION
router.get('/today-cash', managerOrOwner, cacheFor(30), reportController.getTodayCashCollection);

// REPORT 2: CUSTOMER SUMMARY
router.get('/customer-summary', managerOrOwner, cacheFor(60), reportController.getCustomerSummary);

// REPORT 3: AGING REPORT
router.get('/aging', managerOrOwner, cacheFor(60), reportController.getAgingReport);

// REPORT 4: DISCOUNT IMPACT
router.get('/discount-impact', managerOrOwner, cacheFor(60), reportController.getDiscountImpactReport);

// REPORT 5: PAYMENT DELAY REPORT
router.get('/payment-delay', managerOrOwner, cacheFor(60), reportController.getPaymentDelayReport);

// REPORT 6: ENHANCED DASHBOARD SUMMARY
router.get('/dashboard-summary-advanced', managerOrOwner, cacheFor(30), reportController.getDashboardSummaryAdvanced);

// ════════════════════════════════════════════════════════
// PDF DOWNLOAD (no cache — streams binary)
// ════════════════════════════════════════════════════════
router.get('/download', managerOrOwner, reportController.downloadReport);

module.exports = router;
