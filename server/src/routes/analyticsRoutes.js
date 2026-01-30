const express = require('express');
const router = express.Router();
const { getOverviewStats, getPeakHourData, getDoctorPerformance } = require('../controllers/analyticsController');

// All routes prefixed with /api/analytics
router.get('/overview', getOverviewStats);
router.get('/peak-hours', getPeakHourData);
router.get('/doctor-performance', getDoctorPerformance);

module.exports = router;
