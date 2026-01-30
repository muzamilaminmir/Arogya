const prisma = require('../config/db');

const getPublicDashboardData = async (req, res) => {
    try {
        // 1. Get Doctors and their current status + current token
        const doctors = await prisma.doctor.findMany({
            include: {
                user: { select: { name: true } },
                opdQueue: {
                    where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
                    select: { status: true, visit: { select: { tokenNumber: true } } }
                }
            }
        });

        const opdStatus = doctors.map(doc => {
            const activeQueue = doc.opdQueue.filter(q => q.status === 'WAITING' || q.status === 'IN_PROGRESS');
            const current = doc.opdQueue.find(q => q.status === 'IN_PROGRESS');

            return {
                id: doc.id,
                name: doc.user.name,
                department: doc.department,
                room: doc.opd_room,
                status: doc.work_status, // AVAILABLE, IN_OPD, IN_OT
                delay_reason: doc.delay_reason,
                currentToken: current?.visit.tokenNumber || '-',
                queueLength: activeQueue.length
            };
        });

        // 2. Get Diagnostic Queue Stats
        const diagnostics = await prisma.diagnostic.groupBy({
            by: ['testType'],
            where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
            _count: { id: true }
        });

        // Get current token for each test type (approximate by taking first waiting/in-progress)
        const currentTests = await prisma.diagnostic.findMany({
            where: { status: 'IN_PROGRESS' },
            select: { testType: true, visit: { select: { tokenNumber: true } } }
        });

        const diagnosticStatus = {
            XRAY: { count: 0, currentToken: '-' },
            MRI: { count: 0, currentToken: '-' },
            LAB: { count: 0, currentToken: '-' }
        };

        diagnostics.forEach(d => {
            if (diagnosticStatus[d.testType]) {
                diagnosticStatus[d.testType].count = d._count.id;
            }
        });

        currentTests.forEach(t => {
            if (diagnosticStatus[t.testType]) {
                diagnosticStatus[t.testType].currentToken = t.visit.tokenNumber;
            }
        });

        res.json({
            opd: opdStatus,
            diagnostics: diagnosticStatus,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Public dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getPublicDashboardData };
