const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// ════════════════════════════════════════════════════════
// EXISTING ROUTES
// ════════════════════════════════════════════════════════

// GET /api/reports/dashboard
// GET /api/reports/dashboard (Manager)
router.get('/dashboard', reportController.getDashboardSummary);

// GET /api/reports/owner-dashboard (Aggregated)
router.get('/owner-dashboard', reportController.getOwnerDashboard);

// Specific Owner APIs
router.get('/summary', reportController.getOwnerSummary); // For /api/dashboard/summary
router.get('/payment-method-summary', reportController.getPaymentMethodSummary);
router.get('/weekly-sales', reportController.getWeeklySales);
router.get('/risky-customers', reportController.getRiskyCustomers);

router.get('/day', reportController.getDayReport);
router.get('/week', reportController.getWeekReport);
router.get('/month', reportController.getMonthReport);

// ════════════════════════════════════════════════════════
// ADVANCED REPORTING ROUTES (NEW)
// ════════════════════════════════════════════════════════

// REPORT 1: TODAY'S CASH COLLECTION
// GET /api/reports/today-cash
router.get('/today-cash', reportController.getTodayCashCollection);

// REPORT 2: CUSTOMER SUMMARY
// GET /api/reports/customer-summary?type=day|week|month&date=YYYY-MM-DD
router.get('/customer-summary', reportController.getCustomerSummary);

// REPORT 3: AGING REPORT
// GET /api/reports/aging
router.get('/aging', reportController.getAgingReport);

// REPORT 4: DISCOUNT IMPACT
// GET /api/reports/discount-impact?type=day|week|month&date=YYYY-MM-DD
router.get('/discount-impact', reportController.getDiscountImpactReport);

// REPORT 5: PAYMENT DELAY REPORT
// GET /api/reports/payment-delay
router.get('/payment-delay', reportController.getPaymentDelayReport);

// REPORT 6: ENHANCED DASHBOARD SUMMARY
// GET /api/reports/dashboard-summary-advanced
router.get('/dashboard-summary-advanced', reportController.getDashboardSummaryAdvanced);

// ════════════════════════════════════════════════════════
// PDF DOWNLOAD
// ════════════════════════════════════════════════════════
// GET /api/reports/download?type=aging|discount|summary|customer-summary&date=...
router.get('/download', reportController.downloadReport);

module.exports = router;
