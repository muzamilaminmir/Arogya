const express = require('express');
const router = express.Router();
const { getLoadStats, getDiseaseTrends, getPrescriptionPatterns, checkDoctorActivity, getPrescriptionAnalytics } = require('../controllers/aiController');

router.get('/load-stats', getLoadStats);
router.get('/disease-trends', getDiseaseTrends);
router.get('/prescription-patterns', getPrescriptionPatterns);
router.get('/doctor-activity', checkDoctorActivity);
router.get('/prescription-analytics', getPrescriptionAnalytics);

module.exports = router;
