const prisma = require('../utils/prismaClient');

const createBooking = async (req, res) => {
    try {
        const {
            carId,
            packageId,
            startDate,
            endDate,
            idCardUrl,
            driverLicenseUrl,
            totalAmount,
            pickupLocation,
            returnLocation,
            isDelivery,
            paymentDetails
        } = req.body;
        const userId = req.user.id;

        // BR-03: Bookings cannot be submitted without document uploads.
        if (!idCardUrl || !driverLicenseUrl) {
            return res.status(400).json({ message: 'Document uploads (ID Card and Driver License) are mandatory.' });
        }

        // For car bookings, check car availability
        if (carId) {
            const conflictingBooking = await prisma.booking.findFirst({
                where: {
                    carId: parseInt(carId),
                    status: {
                        in: ['PENDING', 'VERIFIED', 'APPROVED', 'PAID', 'ACTIVE']
                    },
                    OR: [
                        {
                            startDate: { lte: new Date(endDate) },
                            endDate: { gte: new Date(startDate) }
                        }
                    ]
                }
            });

            if (conflictingBooking) {
                return res.status(400).json({ message: 'Car is not available for the selected dates.' });
            }
        }

        // Build location string - include package info if booking a package
        let locationInfo = pickupLocation;
        if (packageId && !pickupLocation) {
            locationInfo = `Package Booking - Package ID: ${packageId}`;
        }

        // Check if user has any previously verified bookings (documents already verified)
        const previousVerifiedBooking = await prisma.booking.findFirst({
            where: {
                userId,
                status: {
                    in: ['VERIFIED', 'APPROVED', 'PAID', 'ACTIVE', 'COMPLETED']
                }
            }
        });

        // If user has verified bookings before, skip document verification
        const initialStatus = previousVerifiedBooking ? 'VERIFIED' : 'PENDING';

        const booking = await prisma.booking.create({
            data: {
                userId,
                carId: carId ? parseInt(carId) : null,
                packageId: packageId ? parseInt(packageId) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                totalAmount: parseFloat(totalAmount),
                idCardUrl,
                driverLicenseUrl,
                pickupLocation: locationInfo,
                returnLocation,
                isDelivery: isDelivery || false,
                status: initialStatus,
                payment: (paymentDetails && paymentDetails.method) ? {
                    create: {
                        amount: parseFloat(totalAmount),
                        method: paymentDetails.method,
                        transactionId: paymentDetails.transactionNumber || 'N/A',
                        payerIdentifier: (paymentDetails.method === 'TELEBIRR'
                            ? (paymentDetails.phoneNumber || 'N/A')
                            : (paymentDetails.accountNumber || 'N/A')),
                        status: 'PENDING'
                    }
                } : undefined
            },
            include: {
                payment: true,
                package: true,
                car: true
            }
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user.id },
            include: { car: true, payment: true, rentalAgreement: true, package: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: {
                user: {
                    include: { customerProfile: true }
                },
                car: true,
                payment: true,
                package: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, carId, assignedDriver, driverPhone } = req.body;
        const employeeId = req.user.id;

        const updateData = {
            status,
            processedById: employeeId,
        };

        if (carId) {
            updateData.carId = parseInt(carId);
        }

        if (assignedDriver) {
            updateData.assignedDriver = assignedDriver;
        }

        if (driverPhone) {
            updateData.driverPhone = driverPhone;
        }

        const booking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                user: {
                    include: { customerProfile: true }
                },
                car: true,
                payment: true
            }
        });

        // Sync Car Status
        if (status === 'ACTIVE' && booking.carId) {
            await prisma.car.update({
                where: { id: booking.carId },
                data: { status: 'RENTED' }
            });
        } else if (status === 'COMPLETED' && booking.carId) {
            await prisma.car.update({
                where: { id: booking.carId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.json(booking);

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const assignDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { driverName } = req.body;

        const booking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: {
                assignedDriver: driverName
            }
        });

        res.json({ message: 'Driver assigned successfully', booking });
    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(id) },
            include: {
                car: true,
                package: true,
                user: {
                    include: { customerProfile: true }
                },
                payment: true
            }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Security: Only owner or staff can see details
        if (booking.userId !== userId && userRole === 'CUSTOMER') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Get booking by id error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        // Check if booking exists and belongs to user
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(id) }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this booking' });
        }

        // Handle payment details if provided
        if (updateData.paymentDetails) {
            const { method, phoneNumber, accountNumber, transactionNumber } = updateData.paymentDetails;
            
            // Create or update payment record
            await prisma.payment.upsert({
                where: { bookingId: parseInt(id) },
                update: {
                    method,
                    amount: updateData.totalAmount || booking.totalAmount,
                    payerIdentifier: phoneNumber || accountNumber,
                    transactionId: transactionNumber,
                    status: 'PENDING'
                },
                create: {
                    bookingId: parseInt(id),
                    method,
                    amount: updateData.totalAmount || booking.totalAmount,
                    payerIdentifier: phoneNumber || accountNumber,
                    transactionId: transactionNumber,
                    status: 'PENDING'
                }
            });

            delete updateData.paymentDetails;
        }

        // Update booking
        const updatedBooking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                car: true,
                package: true,
                payment: true,
                user: {
                    include: {
                        customerProfile: true
                    }
                }
            }
        });

        res.json(updatedBooking);
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getAllBookings,
    updateBookingStatus,
    assignDriver,
    getBookingById,
    updateBooking
};
