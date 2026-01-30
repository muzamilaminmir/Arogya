const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { authorizeRole, authenticateToken } = require('../middleware/auth');

// Public route for submission (or authenticated if patient login exists)
// Assuming public for now as per "Public or Patient selects..."
router.post('/', submitFeedback);

// Admin only for viewing
router.get('/', authenticateToken, authorizeRole(['ADMIN']), getFeedback);

module.exports = router;
