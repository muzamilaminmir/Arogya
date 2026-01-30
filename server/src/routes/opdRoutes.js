const {
    getDoctorQueue,
    updateVisitStatus,
    updateDoctorStatus,
    startConsultation,
    markEmergency,
    markPatientNotAvailable,
    reactivatePatient
} = require('../controllers/opdController');
const { getDashboardStats, overrideQueue, updateDelayReason } = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const express = require('express');

const router = express.Router();

router.use(authenticateToken);

// Doctor Routes
router.get('/:doctorId/queue', getDoctorQueue);
router.put('/visit/:visitId', authorizeRole(['DOCTOR']), updateVisitStatus);
router.put('/visit/:visitId/start', authorizeRole(['DOCTOR']), startConsultation);
router.put('/:doctorId/status', authorizeRole(['DOCTOR']), updateDoctorStatus);

// Queue Management (Doctor/Receptionist/Admin)
router.put('/visit/:visitId/emergency', authorizeRole(['DOCTOR', 'RECEPTIONIST']), markEmergency);
router.put('/visit/:visitId/not-available', authorizeRole(['DOCTOR', 'RECEPTIONIST', 'LAB_TECH']), markPatientNotAvailable);
router.put('/visit/:visitId/reactivate', authorizeRole(['DOCTOR', 'RECEPTIONIST', 'LAB_TECH']), reactivatePatient);

// Admin Routes
router.get('/admin/stats', authorizeRole(['ADMIN']), getDashboardStats);
router.post('/admin/override', authorizeRole(['ADMIN']), overrideQueue);
router.put('/admin/delay', authorizeRole(['ADMIN', 'DOCTOR']), updateDelayReason);

module.exports = router;
