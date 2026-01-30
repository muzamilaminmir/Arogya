require('dotenv').config();
const { httpServer } = require('./app');
const prisma = require('./config/db');
const { startInactivityChecker } = require('./services/cronService');
const { io } = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Check DB connection
        await prisma.$connect();
        await prisma.$connect();
        console.log('Database connected successfully');
        startInactivityChecker(io);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
