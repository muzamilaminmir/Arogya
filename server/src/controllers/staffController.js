const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllStaff = async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: { in: ['DOCTOR', 'RECEPTIONIST', 'LAB_TECH'] },
                active: true
            },
            include: { doctorProfile: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Error fetching staff' });
    }
};

const createStaff = async (req, res) => {
    const { name, username, password, role, department, opd_room } = req.body;

    if (!name || !username || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check if username exists
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name,
                    username,
                    password_hash: hashedPassword,
                    role
                }
            });

            if (role === 'DOCTOR') {
                if (!department || !opd_room) {
                    throw new Error('Doctor requires department and room');
                }
                await prisma.doctor.create({
                    data: {
                        userId: user.id,
                        department,
                        opd_room
                    }
                });
            }
            return user;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Create staff error:", error);
        res.status(500).json({ error: error.message || 'Error creating staff' });
    }
};

const deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { active: false }
        });
        res.json({ message: 'Staff deactivated' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Error deleting staff' });
    }
};

module.exports = { getAllStaff, createStaff, deleteStaff };
