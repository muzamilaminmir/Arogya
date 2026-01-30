const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'System Administrator',
            username: 'admin',
            password_hash: passwordHash,
            role: 'ADMIN',
        },
    });
    console.log({ admin });

    // 2. Create Receptionist
    const receptionist = await prisma.user.upsert({
        where: { username: 'reception' },
        update: {},
        create: {
            name: 'Front Desk',
            username: 'reception',
            password_hash: passwordHash,
            role: 'RECEPTIONIST',
        },
    });
    console.log({ receptionist });

    // 3. Create Doctors
    const doc1User = await prisma.user.upsert({
        where: { username: 'doc_sharma' },
        update: {},
        create: {
            name: 'Dr. Sharma',
            username: 'doc_sharma',
            password_hash: passwordHash,
            role: 'DOCTOR',
        },
    });

    const doc1 = await prisma.doctor.upsert({
        where: { userId: doc1User.id },
        update: {},
        create: {
            userId: doc1User.id,
            department: 'General Medicine',
            opd_room: '101',
        },
    });
    console.log({ doc1 });

    const doc2User = await prisma.user.upsert({
        where: { username: 'doc_verma' },
        update: {},
        create: {
            name: 'Dr. Verma',
            username: 'doc_verma',
            password_hash: passwordHash,
            role: 'DOCTOR',
        },
    });

    const doc2 = await prisma.doctor.upsert({
        where: { userId: doc2User.id },
        update: {},
        create: {
            userId: doc2User.id,
            department: 'Orthopedics',
            opd_room: '102',
        },
    });
    console.log({ doc2 });

    // 4. Create Lab Tech
    const labTech = await prisma.user.upsert({
        where: { username: 'lab_tech' },
        update: {},
        create: {
            name: 'Lab Technician',
            username: 'lab_tech',
            password_hash: passwordHash,
            role: 'LAB_TECH',
        },
    });
    console.log({ labTech });
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
