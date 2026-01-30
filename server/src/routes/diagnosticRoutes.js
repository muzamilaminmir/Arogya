const express = require('express');
const { getDiagnosticQueue, updateTestStatus } = require('../controllers/diagnosticController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/queue', authorizeRole(['LAB_TECH', 'ADMIN']), getDiagnosticQueue);
router.put('/:id', authorizeRole(['LAB_TECH', 'ADMIN']), updateTestStatus);

module.exports = router;
