const prisma = require('../config/db');

const getDoctorQueue = async (req, res) => {
    const { doctorId } = req.params;

    try {
        const queue = await prisma.oPDQueue.findMany({
            where: {
                doctorId: parseInt(doctorId),
                status: { in: ['WAITING', 'IN_PROGRESS'] }
            },
            include: {
                visit: {
                    include: { patient: true }
                }
            },
            orderBy: [
                { priority: 'desc' }, // Emergency first
                { visit: { tokenNumber: 'asc' } }
            ]
        });

        res.json(queue);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateVisitStatus = async (req, res) => {
    const { visitId } = req.params;
    const { status, medicines, diagnostics, diagnosis } = req.body; // status: COMPLETED, REFERRED

    try {
        // 1. Update Visit Status
        const visit = await prisma.visit.update({
            where: { id: parseInt(visitId) },
            data: {
                status,
                diagnosis, // Save diagnosis
                completedAt: status === 'COMPLETED' ? new Date() : null
            }
        });

        // 2. Update OPD Queue Status
        await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { status: 'COMPLETED' }
        });

        // 2.1 Update Doctor Last Action
        const visitData = await prisma.visit.findUnique({ where: { id: parseInt(visitId) } });
        if (visitData) {
            await prisma.doctor.update({
                where: { id: visitData.doctorId },
                data: { lastActionAt: new Date() }
            });
        }

        // 3. Add Medicines
        if (medicines && medicines.length > 0) {
            await prisma.medicine.createMany({
                data: medicines.map(med => ({
                    visitId: parseInt(visitId),
                    medicineName: med.name,
                    dosage: med.dosage
                }))
            });
        }

        // 4. Add Diagnostics (Referrals)
        if (diagnostics && diagnostics.length > 0) {
            for (const test of diagnostics) {
                await prisma.diagnostic.create({
                    data: {
                        visitId: parseInt(visitId),
                        testType: test.type, // XRAY, MRI, LAB
                        status: 'WAITING',
                        isEmergency: test.isEmergency || false, // Use per-test flag
                        priority: test.isEmergency ? 1 : 0
                    }
                });
            }
        }

        // 5. Emit Socket Event
        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: visit.doctorId });

        res.json({ message: 'Visit updated successfully' });
    } catch (error) {
        console.error('Update visit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateDoctorStatus = async (req, res) => {
    const { doctorId } = req.params;
    const { status } = req.body; // AVAILABLE, IN_OPD, IN_OT, LEAVE

    try {
        const doctor = await prisma.doctor.update({
            where: { id: parseInt(doctorId) },
            data: { work_status: status }
        });

        // Emit update for public dashboard
        const io = req.app.get('io');
        io.emit('doctorStatusUpdate', { doctorId, status });

        res.json(doctor);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const startConsultation = async (req, res) => {
    const { visitId } = req.params;

    try {
        const visit = await prisma.visit.findUnique({ where: { id: parseInt(visitId) } });

        // 15.1 Token Enforcement Rule
        const queue = await prisma.oPDQueue.findMany({
            where: {
                doctorId: visit.doctorId,
                status: 'WAITING'
            },
            orderBy: [
                { priority: 'desc' },
                { visit: { tokenNumber: 'asc' } }
            ]
        });

        if (queue.length > 0) {
            const nextInLine = queue[0];
            if (nextInLine.visitId !== parseInt(visitId)) {
                return res.status(400).json({
                    error: 'Serial Token Enforcement: Please wait for your turn.',
                    nextInLine: nextInLine.visitId
                });
            }
        }

        // 1. Update Visit Status
        await prisma.visit.update({
            where: { id: parseInt(visitId) },
            data: { status: 'IN_PROGRESS' }
        });

        // 2. Update OPD Queue Status
        await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { status: 'IN_PROGRESS' }
        });

        // 2.1 Update Doctor Last Action
        await prisma.doctor.update({
            where: { id: visit.doctorId },
            data: { lastActionAt: new Date() }
        });

        // 3. Emit Socket Event
        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: visit.doctorId });

        res.json({ message: 'Consultation started', visit });
    } catch (error) {
        console.error('Start consultation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const markEmergency = async (req, res) => {
    const { visitId } = req.params;
    const { reason } = req.body;

    try {
        const visit = await prisma.visit.update({
            where: { id: parseInt(visitId) },
            data: { isEmergency: true, emergencyReason: reason }
        });

        await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { priority: 1 }
        });

        // Propagate to Diagnostics
        await prisma.diagnostic.updateMany({
            where: { visitId: parseInt(visitId) },
            data: { isEmergency: true, priority: 1 }
        });

        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: visit.doctorId });
        io.emit('emergencyAlert', {
            doctorId: visit.doctorId,
            message: `Emergency Alert: Token ${visit.tokenNumber} marked as Emergency!`
        });

        res.json({ message: 'Marked as Emergency', visit });
    } catch (error) {
        res.status(500).json({ error: 'Error marking emergency' });
    }
};

const markPatientNotAvailable = async (req, res) => {
    const { visitId } = req.params;

    try {
        const visit = await prisma.visit.findUnique({ where: { id: parseInt(visitId) } });

        await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { status: 'NOT_AVAILABLE' }
        });

        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: visit.doctorId });

        res.json({ message: 'Patient marked as Not Available' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating status' });
    }
};

const reactivatePatient = async (req, res) => {
    const { visitId } = req.params;

    try {
        const visit = await prisma.visit.findUnique({ where: { id: parseInt(visitId) } });

        await prisma.oPDQueue.update({
            where: { visitId: parseInt(visitId) },
            data: { status: 'WAITING' }
        });

        const io = req.app.get('io');
        io.emit('queueUpdate', { doctorId: visit.doctorId });

        res.json({ message: 'Patient reactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Error reactivating patient' });
    }
};

module.exports = {
    getDoctorQueue,
    updateVisitStatus,
    updateDoctorStatus,
    startConsultation,
    markEmergency,
    markPatientNotAvailable,
    reactivatePatient
};
