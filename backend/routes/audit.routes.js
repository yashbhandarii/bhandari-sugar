const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// All audit routes require a valid token and owner role
router.use(verifyToken);
router.use(checkRole(['owner']));

// GET /api/audit?page=1&limit=50&action=&entity_type=&date_from=&date_to=
router.get('/', auditController.getAuditLogs);

// GET /api/audit/action-types
router.get('/action-types', auditController.getActionTypes);

module.exports = router;
