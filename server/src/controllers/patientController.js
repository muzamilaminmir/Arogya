const prisma = require('../config/db');

const registerPatient = async (req, res) => {
    const { name, age, phone, address, abha_id } = req.body;

    try {
        // Basic validation
        if (!name || !age || !phone || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const patient = await prisma.patient.create({
            data: {
                name,
                dob: req.body.dob || "", // Save DOB
                age: parseInt(age),
                phone,
                address,
                abha_id: abha_id || null
            }
        });

        res.status(201).json(patient);
    } catch (error) {
        console.error('Register patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const searchPatients = async (req, res) => {
    let { query } = req.query;
    if (!query) return res.json([]);

    query = query.trim(); // Remove whitespace

    try {
        let patients = [];

        console.log(`Searching for: '${query}'`);

        // 1. Search by QR Code Hash (Exact Match)
        const visitByQR = await prisma.visit.findUnique({
            where: { qrCodeHash: query },
            include: { patient: true }
        });
        if (visitByQR) {
            console.log('Found by QR:', visitByQR.patient.name);
            return res.json([visitByQR.patient]);
        }

        // 2. Search by Token Number (Today's visits) OR Visit ID OR Patient ID
        // Handle formatted token: DOC001-20260125-002 -> extract 002
        let tokenNum = NaN;
        if (query.includes('-')) {
            const parts = query.split('-');
            const lastPart = parts[parts.length - 1];
            tokenNum = parseInt(lastPart);
        } else {
            tokenNum = parseInt(query);
        }

        if (!isNaN(tokenNum)) {
            console.log(`Searching for Numeric: ${tokenNum}`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 2a. Search by Token Number
            const visitsByToken = await prisma.visit.findMany({
                where: {
                    tokenNumber: tokenNum,
                    // createdAt: { gte: today } 
                },
                include: { patient: true }
            });

            // 2b. Search by Visit ID
            const visitById = await prisma.visit.findUnique({
                where: { id: tokenNum },
                include: { patient: true }
            });

            // 2c. Search by Patient ID
            const patientById = await prisma.patient.findUnique({
                where: { id: tokenNum }
            });

            let combinedPatients = [];
            if (visitsByToken.length > 0) combinedPatients.push(...visitsByToken.map(v => v.patient));
            if (visitById) combinedPatients.push(visitById.patient);
            if (patientById) combinedPatients.push(patientById);

            if (combinedPatients.length > 0) {
                console.log(`Found ${combinedPatients.length} records by numeric search`);
                // Deduplicate
                const uniquePatients = [...new Map(combinedPatients.map(p => [p.id, p])).values()];
                return res.json(uniquePatients);
            }
        }

        // 3. Search by Name, Phone, ABHA
        console.log('Searching by text fields');
        patients = await prisma.patient.findMany({
            where: {
                OR: [
                    { phone: { contains: query } },
                    { name: { contains: query } },
                    { abha_id: { contains: query } }
                ]
            },
            take: 10
        });

        console.log(`Found ${patients.length} patients by text`);
        res.json(patients);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search error' });
    }
};

const getPatientHistory = async (req, res) => {
    const { patientId } = req.params;

    try {
        const history = await prisma.visit.findMany({
            where: {
                patientId: parseInt(patientId),
                status: { in: ['COMPLETED', 'REFERRED'] }
            },
            include: {
                doctor: {
                    include: { user: { select: { name: true } } }
                },
                medicines: true,
                diagnostics: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(history);
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Error fetching history' });
    }
};

module.exports = { registerPatient, searchPatients, getPatientHistory };
