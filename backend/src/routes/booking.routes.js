const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Customer routes
router.post('/', authenticate, bookingController.createBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.patch('/:id', authenticate, bookingController.updateBooking);

// Employee/Admin routes
router.get('/', authenticate, authorize('EMPLOYEE', 'ADMIN'), bookingController.getAllBookings);
router.patch('/:id/status', authenticate, authorize('EMPLOYEE', 'ADMIN'), bookingController.updateBookingStatus);
router.patch('/:id/assign-driver', authenticate, authorize('EMPLOYEE', 'ADMIN'), bookingController.assignDriver);

module.exports = router;
