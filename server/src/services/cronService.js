const prisma = require('../config/db');

const INACTIVITY_THRESHOLD_MS = 10 * 60 * 1000; // 10 Minutes

const startInactivityChecker = (io) => {
    console.log('Starting Inactivity Checker Service...');

    setInterval(async () => {
        try {
            const now = new Date();
            const thresholdTime = new Date(now.getTime() - INACTIVITY_THRESHOLD_MS);

            // Find doctors who are IN_OPD but idle for > 1 min
            const inactiveDoctors = await prisma.doctor.findMany({
                where: {
                    work_status: 'IN_OPD',
                    lastActionAt: { lt: thresholdTime },
                },
                include: {
                    opdQueue: {
                        where: { status: 'IN_PROGRESS' }
                    },
                    user: true
                }
            });

            for (const doctor of inactiveDoctors) {
                // Check if they are TRULY idle (no IN_PROGRESS visit)
                if (doctor.opdQueue.length === 0) {

                    // Check if anyone is waiting for them
                    const waitingCount = await prisma.oPDQueue.count({
                        where: {
                            doctorId: doctor.id,
                            status: 'WAITING'
                        }
                    });

                    if (waitingCount > 0) {
                        // ALERT! Doctor is idle while patients wait
                        console.log(`Alert: Dr. ${doctor.user.name} is inactive with ${waitingCount} patients waiting.`);

                        // Notify Doctor (if they are listening on their own channel)
                        io.emit('inactivityAlert', {
                            doctorId: doctor.id,
                            message: `⚠️ System Alert: You have been inactive for over 10 minutes with ${waitingCount} patients waiting.`
                        });

                        // Notify Admin
                        io.emit('adminAlert', {
                            type: 'INACTIVITY',
                            doctorId: doctor.id,
                            doctorName: doctor.user.name,
                            message: `Dr. ${doctor.user.name} is inactive for >10m with ${waitingCount} waiting.`
                        });
                    }
                }
            }

        } catch (error) {
            console.error('Inactivity Checker Error:', error);
        }
    }, 30000); // Check every 30 seconds
};

module.exports = { startInactivityChecker };
