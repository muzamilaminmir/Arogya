const express = require('express');
const { registerPatient, searchPatients, getPatientHistory } = require('../controllers/patientController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Only staff can register/search patients
router.use(authenticateToken);

router.post('/', authorizeRole(['RECEPTIONIST', 'ADMIN']), registerPatient);
router.get('/search', authorizeRole(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), searchPatients);
router.get('/:patientId/history', authorizeRole(['DOCTOR', 'ADMIN']), getPatientHistory);

module.exports = router;
