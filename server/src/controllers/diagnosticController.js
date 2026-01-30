const prisma = require('../config/db');

const getDiagnosticQueue = async (req, res) => {
    const { testType } = req.query; // XRAY, MRI, LAB

    try {
        const queue = await prisma.diagnostic.findMany({
            where: {
                testType,
                status: { in: ['WAITING', 'IN_PROGRESS', 'NOT_AVAILABLE'] }
            },
            include: {
                visit: {
                    include: { patient: true }
                }
            },
            orderBy: [
                { priority: 'desc' }, // Emergency first
                { createdAt: 'asc' }  // Then FIFO
            ]
        });

        res.json(queue);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateTestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, result } = req.body; // status: COMPLETED, IN_PROGRESS, NOT_AVAILABLE, WAITING

    try {
        // Serial Token Enforcement for 'IN_PROGRESS'
        // Serial Token Enforcement
        if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
            const test = await prisma.diagnostic.findUnique({ where: { id: parseInt(id) } });

            // Allow Emergency to skip checks
            if (test.priority === 0 && !test.isEmergency) {
                const queue = await prisma.diagnostic.findMany({
                    where: {
                        testType: test.testType,
                        status: 'WAITING',
                        priority: { gte: test.priority } // Only check against equal or higher priority
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { createdAt: 'asc' }
                    ]
                });

                if (queue.length > 0) {
                    const nextInLine = queue[0];
                    // If the first person in waiting is NOT this test, then block
                    // But we must support completing a test that was already IN_PROGRESS (so not in waiting)
                    // The query above looks for WAITING. 
                    // If I am WAITING, I must be first.
                    // If I am already IN_PROGRESS, I am just finishing up, so no check needed?
                    // User said "mark test complete should be after scanning".
                    // Let's assume we transit Waiting -> Completed directly in this flow or Waiting -> In Progress.

                    if (test.status === 'WAITING' && nextInLine.id !== parseInt(id)) {
                        return res.status(400).json({
                            error: 'Queue Order: Please take patients in serial order.',
                            nextToken: nextInLine.id
                        });
                    }
                }
            }
        }

        const test = await prisma.diagnostic.update({
            where: { id: parseInt(id) },
            data: { status, result }
        });

        res.json(test);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getDiagnosticQueue, updateTestStatus };
