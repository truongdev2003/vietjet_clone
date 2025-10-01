const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateBookingCreate, validateBookingUpdate, validateBookingCancel } = require('../validators/bookingValidator');

const router = express.Router();

// Public routes
router.post('/search', BookingController.findBookingByReference);
router.get('/lookup/:reference', BookingController.guestBookingLookup); // Tra cứu cho guest

// Routes hỗ trợ cả guest và user đã đăng nhập
router.post('/', optionalAuth, validateBookingCreate, BookingController.createBooking);

// Protected routes (require authentication)
router.use(authenticate);

// User routes
router.get('/my-bookings', BookingController.getUserBookings);
router.get('/:bookingId', BookingController.getBooking);
router.put('/:bookingId', validateBookingUpdate, BookingController.updateBooking);
router.post('/:bookingId/cancel', validateBookingCancel, BookingController.cancelBooking);
router.post('/:bookingId/checkin', BookingController.onlineCheckin);

module.exports = router;