const express = require('express');
const SeatController = require('../controllers/seatController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/flight/:flightId/map', SeatController.getSeatMap);

// Protected routes
router.use(authenticate);

router.get('/flight/:flightId/recommended', SeatController.getRecommendedSeats);
router.get('/booking/:bookingId', SeatController.getBookingSeats);
router.post('/booking/:bookingId/select', SeatController.selectSeat);
router.post('/booking/:bookingId/unselect', SeatController.unselectSeat);

module.exports = router;