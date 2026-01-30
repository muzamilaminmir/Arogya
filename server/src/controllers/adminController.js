const prisma = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Get all Doctors and their status
        const doctors = await prisma.doctor.findMany({
            include: {
                user: { select: { name: true } },
                opdQueue: {
                    where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
                    orderBy: [
                        { priority: 'desc' }, // High priority first
                        { visit: { tokenNumber: 'asc' } }
                    ],
                    include: {
                        visit: {
                            include: { patient: true }
                        }
                    }
                }
            }
        });

        // 2. Get Diagnostic Queues
        const diagnostics = await prisma.diagnostic.findMany({
            where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
            include: { visit: { include: { patient: true } } }
        });

        // 3. Get Recent Logs
        const logs = await prisma.auditLog.findMany({
            take: 20,
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { name: true } } }
        });

        res.json({
            doctors: doctors.map(d => ({
                id: d.id,
                name: d.user.name,
                status: d.work_status,
                delay_reason: d.delay_reason,
                queueLength: d.opdQueue.length,
                currentPatient: d.opdQueue[0] ? d.opdQueue[0].visitId : null
            })),
            queues: {
                opd: doctors.flatMap(d => d.opdQueue.map(q => ({
                    ...q,
                    doctorName: d.user.name
                }))),
                diagnostics
            },
            logs
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const overrideQueue = async (req, res) => {
    const { visitId, reason } = req.body;
    const userId = req.user.userId; // Admin ID

    try {
        // 1. Update Queue Priority
        const queueItem = await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { priority: 1 }
        });

        // 2. Log the Override
        await prisma.auditLog.create({
            data: {
                action: 'EMERGENCY_OVERRIDE',
                userId,
                details: `Priority override for Visit #${visitId}. Reason: ${reason}`
            }
        });

        // 3. Emit Update
        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: queueItem.doctorId });

        res.json({ message: 'Patient prioritized successfully' });
    } catch (error) {
        console.error('Override error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateDelayReason = async (req, res) => {
    const { doctorId, reason } = req.body;

    try {
        await prisma.doctor.update({
            where: { id: parseInt(doctorId) },
            data: { delay_reason: reason }
        });

        const io = req.app.get('io');
        io.emit('doctorStatusUpdate', { doctorId, status: 'DELAYED', reason });

        res.json({ message: 'Delay reason updated' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getDashboardStats, overrideQueue, updateDelayReason };
