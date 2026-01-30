const express = require('express');
const { getAllStaff, createStaff, deleteStaff } = require('../controllers/staffController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const prisma = require('../config/db');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// Staff Management
router.get('/staff', getAllStaff);
router.post('/staff', createStaff);
router.delete('/staff/:id', deleteStaff);

// Audit Logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            take: 100,
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { name: true, role: true } } }
        });
        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Error fetching logs' });
    }
});

module.exports = router;
