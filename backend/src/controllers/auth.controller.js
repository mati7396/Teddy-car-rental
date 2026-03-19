const prisma = require('../utils/prismaClient');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phoneNumber, address } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        if (role && !['CUSTOMER', 'EMPLOYEE', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'CUSTOMER',
                // Create a profile for customers AND employees to store their name
                customerProfile: {
                    create: {
                        firstName: firstName || '',
                        lastName: lastName || '',
                        phoneNumber: phoneNumber || '',
                        address: address || ''
                    }
                }
            },
            include: {
                customerProfile: true
            }
        });

        const token = generateToken(newUser.id, newUser.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                profile: newUser.customerProfile
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { customerProfile: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.customerProfile
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    // UI-07/UI-10: Logout
    // Since we are using stateless JWT, we can't truly invalidate the token server-side without a blacklist/redis.
    // The client is responsible for clearing the token.
    res.json({ message: 'You have been logged out successfully.' });
};

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { customerProfile: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.customerProfile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { idCardUrl, driverLicenseUrl, address, phoneNumber, agreementSigned, firstName, lastName } = req.body;
        const userId = req.user.id;

        console.log(`Updating profile for user ${userId}:`, req.body);

        const updatedProfile = await prisma.customerProfile.upsert({
            where: { userId },
            update: {
                idCardUrl: idCardUrl !== undefined ? idCardUrl : undefined,
                driverLicenseUrl: driverLicenseUrl !== undefined ? driverLicenseUrl : undefined,
                address: address !== undefined ? address : undefined,
                phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
                agreementSigned: agreementSigned !== undefined ? agreementSigned : undefined,
                firstName: firstName !== undefined ? firstName : undefined,
                lastName: lastName !== undefined ? lastName : undefined,
            },
            create: {
                userId,
                firstName: firstName || '',
                lastName: lastName || '',
                phoneNumber: phoneNumber || '',
                idCardUrl,
                driverLicenseUrl,
                address,
                agreementSigned: agreementSigned || false
            }
        });

        console.log('Profile updated successfully:', updatedProfile.id);

        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile
};
