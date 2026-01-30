const express = require('express');
const { createVisit, getVisitByQR } = require('../controllers/visitController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Public route for scanning QR (No auth required for reading basic status, 
// but maybe we want to restrict it? The prompt says "Public Action: Scan QR Code -> Patient Dashboard (NO LOGIN)")
router.get('/scan/:qrHash', getVisitByQR);

// Staff only routes
router.post('/', authenticateToken, authorizeRole(['RECEPTIONIST', 'ADMIN']), createVisit);

module.exports = router;
