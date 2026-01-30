const prisma = require('../config/db');

const getOverviewStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total Visits Today
        const totalVisitsToday = await prisma.visit.count({
            where: { createdAt: { gte: today } }
        });

        // 2. Pending Visits
        const pendingVisits = await prisma.oPDQueue.count({
            where: { status: 'WAITING' }
        });

        // 3. Completed Visits Today
        const completedVisitsToday = await prisma.visit.count({
            where: {
                status: 'COMPLETED',
                updatedAt: { gte: today } // Assuming update happens on completion
            }
        });

        // Note: Using updatedAt as proxy for completedAt if completedAt not available, 
        // but verify schema has completedAt. Schema HAS completedAt.
        // Let's refine step 3
        const completedVisitsTodayAccurate = await prisma.visit.count({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: today }
            }
        });


        // 4. Avg Wait Time (Simple Avg of Completed Visits Today)
        const completedVisits = await prisma.visit.findMany({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: today }
            },
            select: { createdAt: true, completedAt: true }
        });

        let avgWaitMinutes = 0;
        if (completedVisits.length > 0) {
            const totalWaitMs = completedVisits.reduce((acc, v) => acc + (new Date(v.completedAt) - new Date(v.createdAt)), 0);
            avgWaitMinutes = Math.round((totalWaitMs / completedVisits.length) / (1000 * 60));
        }

        res.json({
            totalVisitsToday,
            pendingVisits,
            completedVisits: completedVisitsTodayAccurate,
            avgWaitTime: avgWaitMinutes
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

const getPeakHourData = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group visits by hour of creation
        // Prisma doesn't support complex groupBy date parts easily across DBs (SQLite vs Postgres)
        // For compatibility, we'll fetch ID + CreatedAt and aggregate in JS
        // Since it's "Version 1 -> 2", data volume is manageable for JS aggregation for now.

        const visits = await prisma.visit.findMany({
            where: { createdAt: { gte: today } },
            select: { createdAt: true }
        });

        const hours = {};
        for (let i = 8; i <= 20; i++) hours[i] = 0; // Initialize 8 AM to 8 PM

        visits.forEach(v => {
            const h = new Date(v.createdAt).getHours();
            if (hours[h] !== undefined) hours[h]++;
        });

        const chartData = Object.entries(hours).map(([hour, count]) => ({
            hour: `${hour}:00`,
            patients: count
        }));

        res.json(chartData);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch peak hours' });
    }
};

const getDoctorPerformance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const doctors = await prisma.doctor.findMany({
            include: {
                user: { select: { name: true } },
                _count: {
                    select: {
                        visits: {
                            where: {
                                completedAt: { gte: today },
                                status: 'COMPLETED'
                            }
                        }
                    }
                }
            }
        });

        const data = doctors.map(d => ({
            name: d.user.name,
            patientsSeen: d._count.visits,
            status: d.work_status
        }));

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch doctor stats' });
    }
};

module.exports = {
    getOverviewStats,
    getPeakHourData,
    getDoctorPerformance
};
