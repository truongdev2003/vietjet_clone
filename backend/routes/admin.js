const express = require('express');
const AdminController = require('../controllers/adminController');
const NotificationController = require('../controllers/notificationController');
const PaymentController = require('../controllers/paymentController');
const CheckinController = require('../controllers/checkinController');
const BannerController = require('../controllers/bannerController');
const AircraftController = require('../controllers/aircraftController');
const AirportController = require('../controllers/airportController');
const RouteController = require('../controllers/routeController');
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
router.patch('/users/:userId/role', AdminController.updateUserRole);
router.delete('/users/:userId', AdminController.deleteUser);

// Booking management
router.get('/bookings', AdminController.getBookings);
router.patch('/bookings/:bookingId/cancel', AdminController.cancelBooking);

// Payment management
router.get('/payments', PaymentController.getAllPayments);

// Notification management
router.get('/notifications', NotificationController.getAllNotifications);

// Check-in management
router.get('/checkins', CheckinController.getAllCheckins);

// Banner management
router.get('/banners/stats', BannerController.getBannerStats);
router.get('/banners', BannerController.getAllBanners);
router.get('/banners/:id', BannerController.getBannerById);
router.post('/banners', BannerController.createBanner);
router.put('/banners/:id', BannerController.updateBanner);
router.delete('/banners/:id', BannerController.deleteBanner);
router.patch('/banners/:id/toggle', BannerController.toggleBannerStatus);
router.post('/banners/reorder', BannerController.updateBannersOrder);

// Aircraft management
router.get('/aircraft/stats', AircraftController.getAircraftStats);
router.get('/aircraft/available', AircraftController.getAvailableAircraft);
router.get('/aircraft', AircraftController.getAllAircraft);
router.get('/aircraft/:id', AircraftController.getAircraftById);
router.post('/aircraft', AircraftController.createAircraft);
router.put('/aircraft/:id', AircraftController.updateAircraft);
router.patch('/aircraft/:id/status', AircraftController.updateAircraftStatus);
router.delete('/aircraft/:id', AircraftController.deleteAircraft);

// Airport management
router.get('/airports/stats', AirportController.getAirportStats);
router.get('/airports', AirportController.getAllAirports);
router.get('/airports/:airportId', AirportController.getAirportDetails);
router.post('/airports', AirportController.createAirport);
router.put('/airports/:airportId', AirportController.updateAirport);
router.delete('/airports/:airportId', AirportController.deleteAirport);

// Route management
router.get('/routes/stats/:routeId', RouteController.getRouteStats);
router.get('/routes/find', RouteController.findRoute);
router.get('/routes', RouteController.getAllRoutes);
router.get('/routes/:routeId', RouteController.getRouteById);
router.post('/routes', RouteController.createRoute);
router.put('/routes/:routeId', RouteController.updateRoute);
router.patch('/routes/:routeId/status', RouteController.updateRouteStatus);
router.delete('/routes/:routeId', RouteController.deleteRoute);

// Reports
router.get('/reports', AdminController.getReports);

// Flight updates
router.post('/flight-updates', AdminController.sendFlightUpdate);

module.exports = router;