const prisma = require('../config/db');
const QRCode = require('qrcode');
const crypto = require('crypto');

const createVisit = async (req, res) => {
    const { patientId, doctorId, priority, isProtected } = req.body;

    try {
        // 1. Get current token number for this doctor today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastVisit = await prisma.visit.findFirst({
            where: {
                doctorId: parseInt(doctorId),
                createdAt: { gte: today }
            },
            orderBy: { tokenNumber: 'desc' }
        });

        const tokenNumber = lastVisit ? lastVisit.tokenNumber + 1 : 1;

        // 2. Generate QR Hash (Unique visit identifier)
        const qrData = `${patientId}-${doctorId}-${Date.now()}`;
        const qrCodeHash = crypto.createHash('sha256').update(qrData).digest('hex');

        // 3. Create Visit
        const visit = await prisma.visit.create({
            data: {
                patientId: parseInt(patientId),
                doctorId: parseInt(doctorId),
                tokenNumber,
                qrCodeHash,
                status: 'WAITING',
                isProtected: isProtected !== undefined ? isProtected : true
            },
            include: {
                patient: true,
                doctor: { include: { user: true } }
            }
        });

        // 4. Add to OPD Queue
        await prisma.oPDQueue.create({
            data: {
                doctorId: parseInt(doctorId),
                visitId: visit.id,
                status: 'WAITING',
                priority: priority ? 1 : 0 // Set priority if requested
            }
        });

        // 5. Generate QR Image (Data URL)
        const qrImage = await QRCode.toDataURL(qrCodeHash);

        // 6. Emit Socket Event (Update Queue)
        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId });

        res.status(201).json({ visit, qrImage });
    } catch (error) {
        console.error('Create visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getVisitByQR = async (req, res) => {
    const { qrHash } = req.params;

    try {
        const visit = await prisma.visit.findUnique({
            where: { qrCodeHash: qrHash },
            include: {
                patient: true,
                doctor: { include: { user: true } },
                opdQueue: true,
                diagnostics: true,
                medicines: true
            }
        });

        if (!visit) {
            return res.status(404).json({ error: 'Visit not found' });
        }

        // Check Password Protection
        if (visit.isProtected) {
            const authHeader = req.headers['x-visit-password']; // DOB passed here
            const patientDob = visit.patient.dob;

            // If No Auth Header Provided -> Return 401
            if (!authHeader) {
                return res.status(401).json({ error: 'Password Required', isProtected: true });
            }

            // Verify DOB (Simple string match YYYY-MM-DD or whatever format)
            if (authHeader !== patientDob) {
                return res.status(403).json({ error: 'Invalid Date of Birth', isProtected: true });
            }
        }

        // Calculate Queue Metrics
        const activeQueue = await prisma.oPDQueue.findMany({
            where: {
                doctorId: visit.doctorId,
                status: { in: ['WAITING', 'IN_PROGRESS'] }
            },
            orderBy: [
                { priority: 'desc' },
                { visit: { tokenNumber: 'asc' } }
            ],
            include: { visit: true }
        });

        const position = activeQueue.findIndex(q => q.visitId === visit.id);
        const tokensAhead = position === -1 ? 0 : position;
        const estimatedWaitTime = tokensAhead * 10; // Approx 10 mins per patient
        const currentToken = activeQueue.find(q => q.status === 'IN_PROGRESS')?.visit.tokenNumber || '-';

        res.json({
            ...visit,
            queue: {
                position: position + 1,
                tokensAhead,
                estimatedWaitTime,
                currentToken
            },
            doctor: {
                ...visit.doctor,
                delay_reason: visit.doctor.delay_reason
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createVisit, getVisitByQR };
