const express = require('express');
const AdminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Tất cả admin routes yêu cầu authentication và admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// User management
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserDetail);
router.patch('/users/:userId/status', AdminController.updateUserStatus);

// Booking management
router.get('/bookings', AdminController.getBookings);
router.patch('/bookings/:bookingId/cancel', AdminController.cancelBooking);

// Reports
router.get('/reports', AdminController.getReports);

// Flight updates
router.post('/flight-updates', AdminController.sendFlightUpdate);

module.exports = router;