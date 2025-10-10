const express = require('express');
const FlightController = require('../controllers/flightController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateFlightSearch, validateFlightCreate, validateFlightUpdate } = require('../validators/flightValidator');

const router = express.Router();

// Public routes
router.get('/search', validateFlightSearch, FlightController.searchFlights);
router.post('/search', validateFlightSearch, FlightController.searchFlights);
router.get('/:flightId', FlightController.getFlightDetails);

// Protected routes (require authentication)
router.use(authenticate);

// Admin routes
router.get('/', authorize(['admin', 'staff']), FlightController.getAllFlights);
router.post('/', authorize(['admin']), validateFlightCreate, FlightController.createFlight);
router.put('/:flightId', authorize(['admin']), validateFlightUpdate, FlightController.updateFlight);
router.delete('/:flightId', authorize(['admin']), FlightController.deleteFlight);
router.patch('/:flightId/status', authorize(['admin', 'staff']), FlightController.updateFlightStatus);

module.exports = router;