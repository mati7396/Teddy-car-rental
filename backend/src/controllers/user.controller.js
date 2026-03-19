const prisma = require('../utils/prismaClient');

const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const users = await prisma.user.findMany({
            where: { role: role || undefined },
            include: { customerProfile: true },
            orderBy: { createdAt: 'desc' }
        });

        // Remove passwords from response
        const sanitizedUsers = users.map(user => {
            const { password, ...rest } = user;
            return rest;
        });

        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { customerProfile: true, bookings: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, ...sanitizedUser } = user;
        res.json(sanitizedUser);
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['CUSTOMER', 'EMPLOYEE', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, email: true, role: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Prevent admin from deleting themselves
        if (parseInt(id) === adminId) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Always soft delete - just deactivate the user
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { 
                isActive: false
            }
        });

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive: true }
        });

        res.json({ message: 'User reactivated successfully' });
    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    reactivateUser
};
