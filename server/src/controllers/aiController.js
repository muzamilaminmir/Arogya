const prisma = require('../config/db');

// 11.1 AI: PATIENT–DOCTOR RATIO & LOAD MONITORING
const getLoadStats = async (req, res) => {
    try {
        // Active Doctors in OPD
        const activeDoctors = await prisma.doctor.findMany({
            where: { work_status: 'IN_OPD' },
            include: {
                opdQueue: { where: { status: 'WAITING' } },
                user: { select: { name: true } }
            }
        });

        const stats = activeDoctors.map(doc => {
            const queueLength = doc.opdQueue.length;
            let load = 'Normal';
            if (queueLength > 20) load = 'High Load';
            if (queueLength > 40) load = 'Critical Load';

            return {
                doctorId: doc.id,
                doctorName: doc.user?.name,
                department: doc.department,
                patientsWaiting: queueLength,
                loadSeverity: load
            };
        });

        // Department Aggregates
        const deptStats = {};
        stats.forEach(s => {
            if (!deptStats[s.department]) {
                deptStats[s.department] = { doctors: 0, patients: 0 };
            }
            deptStats[s.department].doctors++;
            deptStats[s.department].patients += s.patientsWaiting;
        });

        res.json({ doctorStats: stats, departmentStats: deptStats });
    } catch (error) {
        console.error('Error fetching load stats:', error);
        res.status(500).json({ error: 'Error fetching load stats' });
    }
};

// 11.2 AI: DISEASE TREND & SPREAD ANALYSIS
const getDiseaseTrends = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const visits = await prisma.visit.findMany({
            where: {
                createdAt: { gte: today },
                diagnosis: { not: null }
            },
            select: { diagnosis: true, doctor: { select: { department: true } } }
        });

        const trends = {};
        visits.forEach(v => {
            const disease = v.diagnosis;
            if (disease) {
                if (!trends[disease]) trends[disease] = 0;
                trends[disease]++;
            }
        });

        // Convert to array and sort
        const sortedTrends = Object.entries(trends)
            .map(([disease, count]) => ({ disease, count }))
            .sort((a, b) => b.count - a.count);

        res.json(sortedTrends);
    } catch (error) {
        console.error('Error fetching disease trends:', error);
        res.status(500).json({ error: 'Error fetching disease trends' });
    }
};

// 11.3 AI: MEDICINE PRESCRIPTION PATTERN MONITORING
const getPrescriptionPatterns = async (req, res) => {
    try {
        const medicines = await prisma.medicine.findMany({
            include: { visit: { include: { doctor: true } } }
        });

        const patterns = {}; // { doctorId: { medicineName: count } }
        const deptPatterns = {}; // { department: { medicineName: count } }

        medicines.forEach(med => {
            const docId = med.visit.doctorId;
            const dept = med.visit.doctor.department;
            const medName = med.medicineName;

            // Doctor Stats
            if (!patterns[docId]) patterns[docId] = {};
            if (!patterns[docId][medName]) patterns[docId][medName] = 0;
            patterns[docId][medName]++;

            // Dept Stats
            if (!deptPatterns[dept]) deptPatterns[dept] = {};
            if (!deptPatterns[dept][medName]) deptPatterns[dept][medName] = 0;
            deptPatterns[dept][medName]++;
        });

        res.json({ doctorPatterns: patterns, departmentPatterns: deptPatterns });
    } catch (error) {
        console.error('Error fetching prescription patterns:', error);
        res.status(500).json({ error: 'Error fetching prescription patterns' });
    }
};

// 11.4 AI-BASED DOCTOR ACTIVITY MONITORING
const checkDoctorActivity = async (req, res) => {
    try {
        const activeDoctors = await prisma.doctor.findMany({
            where: { work_status: 'IN_OPD' },
            include: {
                opdQueue: { where: { status: 'WAITING' } },
                visits: {
                    where: { status: 'COMPLETED' },
                    orderBy: { completedAt: 'desc' },
                    take: 1
                },
                user: { select: { name: true } }
            }
        });

        const alerts = [];
        const now = new Date();

        activeDoctors.forEach(doc => {
            if (doc.opdQueue.length > 0) {
                const lastVisit = doc.visits[0];
                // If no completed visits, use updated (when they logged in/changed status)
                // Note: Prisma doesn't auto-update updatedAt on all models unless configured, but let's assume we can use current time if nothing else, or skip.
                // Better: if no visits, check if they have been IN_OPD for a while? 
                // For now, let's use a default safe fallback or skip if no data.

                let lastActiveTime = lastVisit ? new Date(lastVisit.completedAt) : null;

                if (lastActiveTime) {
                    const timeDiff = (now - lastActiveTime) / (1000 * 60); // minutes

                    if (timeDiff > 15) {
                        alerts.push({
                            doctorId: doc.id,
                            name: doc.user?.name,
                            inactiveMinutes: Math.round(timeDiff),
                            queueLength: doc.opdQueue.length,
                            message: `Doctor ${doc.user?.name} has been inactive for ${Math.round(timeDiff)} mins with ${doc.opdQueue.length} patients waiting.`
                        });
                    }
                }
            }
        });

        res.json(alerts);
    } catch (error) {
        console.error('Error checking activity:', error);
        res.status(500).json({ error: 'Error checking activity' });
    }
};

// 11.5 MEDICINE PRESCRIPTION ANALYTICS (Day/Week/Month)
const getPrescriptionAnalytics = async (req, res) => {
    try {
        const medicines = await prisma.medicine.findMany({
            include: {
                visit: {
                    include: {
                        doctor: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                }
            }
        });

        const analytics = {
            daily: {},
            weekly: {},
            monthly: {}
        };

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday start
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        medicines.forEach(med => {
            const date = new Date(med.createdAt);
            const docName = med.visit.doctor.user.name;
            const medName = med.medicineName;

            const updateCount = (periodObj) => {
                if (!periodObj[docName]) periodObj[docName] = {};
                if (!periodObj[docName][medName]) periodObj[docName][medName] = 0;
                periodObj[docName][medName]++;
            };

            if (date >= startOfDay) updateCount(analytics.daily);
            if (date >= startOfWeek) updateCount(analytics.weekly);
            if (date >= startOfMonth) updateCount(analytics.monthly);
        });

        res.json(analytics);
    } catch (error) {
        console.error('Error fetching prescription analytics:', error);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
};

module.exports = { getLoadStats, getDiseaseTrends, getPrescriptionPatterns, checkDoctorActivity, getPrescriptionAnalytics };
