const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
async function main() {
    const doctors = await prisma.doctor.findMany();
    fs.writeFileSync('doctors_dump.json', JSON.stringify(doctors, null, 2));
    console.log('Dumped to doctors_dump.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
