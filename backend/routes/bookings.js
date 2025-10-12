const express = require('express');
const BookingController = require('../controllers/bookingController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateBookingCreate, validateBookingUpdate, validateBookingCancel } = require('../validators/bookingValidator');

const router = express.Router();

// Public routes
router.post('/search', BookingController.findBookingByReference);
router.get('/lookup/:reference', BookingController.guestBookingLookup); // Tra cứu cho guest
router.get('/code/:bookingCode', BookingController.guestBookingLookup); // Tra cứu theo mã booking

// Download PDF cho guest (cần email verification)
router.get('/download/:reference/pdf', BookingController.downloadGuestBookingPDF);

// Resend booking confirmation email
router.post('/:reference/resend-confirmation', BookingController.resendBookingConfirmation);

// Routes hỗ trợ cả guest và user đã đăng nhập
router.post('/', optionalAuth, validateBookingCreate, BookingController.createBooking);

// Retry payment - hỗ trợ cả guest và user
router.post('/:bookingId/retry-payment', optionalAuth, BookingController.retryPayment);

// Protected routes (require authentication) - SPECIFIC ROUTES FIRST
router.get('/my-bookings', authenticate, BookingController.getUserBookings);

// Get booking by ID - hỗ trợ cả guest và user (cho payment callback)
// MUST be after /my-bookings to avoid route conflict
router.get('/:bookingId', optionalAuth, BookingController.getBooking);

// Apply authentication for remaining protected routes
router.use(authenticate);

// Other user routes
router.get('/:reference/download-pdf', BookingController.downloadBookingPDF);
router.put('/:bookingId', validateBookingUpdate, BookingController.updateBooking);
router.post('/:bookingId/cancel', validateBookingCancel, BookingController.cancelBooking);
router.post('/:bookingId/checkin', BookingController.onlineCheckin);

// Admin/Cron job routes
router.delete('/cleanup/expired', BookingController.cleanupExpiredBookings);

module.exports = router;