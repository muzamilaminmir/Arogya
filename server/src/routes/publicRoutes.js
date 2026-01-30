const express = require('express');
const { getPublicDashboardData } = require('../controllers/publicController');

const router = express.Router();

// Public access (no auth)
router.get('/dashboard', getPublicDashboardData);

module.exports = router;
