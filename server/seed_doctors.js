const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const doctorsList = [
    { name: 'Dr. A. Kumar', username: 'doc_kumar', dept: 'General Medicine', room: '101' },
    { name: 'Dr. B. Singh', username: 'doc_singh', dept: 'Orthopedics', room: '102' },
    { name: 'Dr. C. Gupta', username: 'doc_gupta', dept: 'Pediatrics', room: '103' },
    { name: 'Dr. D. Mehta', username: 'doc_mehta', dept: 'Cardiology', room: '104' },
    { name: 'Dr. E. Reddy', username: 'doc_reddy', dept: 'Dermatology', room: '105' },
    { name: 'Dr. F. Khan', username: 'doc_khan', dept: 'Gynecology', room: '106' },
    { name: 'Dr. G. Joshi', username: 'doc_joshi', dept: 'ENT', room: '107' },
    { name: 'Dr. H. Patel', username: 'doc_patel', dept: 'Ophthalmology', room: '108' },
    { name: 'Dr. I. Rao', username: 'doc_rao', dept: 'Neurology', room: '109' },
    { name: 'Dr. J. Nair', username: 'doc_nair', dept: 'Psychiatry', room: '110' }
];

async function main() {
    console.log('Seeding 10 Doctors...');
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const credentials = [];

    for (const doc of doctorsList) {
        // Create User
        const user = await prisma.user.upsert({
            where: { username: doc.username },
            update: {},
            create: {
                name: doc.name,
                username: doc.username,
                password_hash: passwordHash,
                role: 'DOCTOR',
            },
        });

        // Create Doctor Profile
        await prisma.doctor.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                department: doc.dept,
                opd_room: doc.room,
            },
        });

        credentials.push({
            name: doc.name,
            username: doc.username,
            password: password,
            department: doc.dept,
            room: doc.room
        });
    }

    console.log('\n--- Doctor Credentials ---');
    console.table(credentials);
    console.log('--------------------------');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
