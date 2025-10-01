const express = require('express');
const FareController = require('../controllers/fareController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateFareCreate, validateFareUpdate, validateFareCalculation } = require('../validators/fareValidator');

const router = express.Router();

// Public routes
router.get('/route/:routeId', FareController.getFaresByRoute);
router.post('/calculate', validateFareCalculation, FareController.calculateFare);
router.get('/:fareId', FareController.getFareDetails);

// Protected routes (require authentication)
router.use(authenticate);

// Admin routes
router.get('/', authorize(['admin', 'staff']), FareController.getAllFares);
router.post('/', authorize(['admin']), validateFareCreate, FareController.createFare);
router.put('/:fareId', authorize(['admin']), validateFareUpdate, FareController.updateFare);
router.delete('/:fareId', authorize(['admin']), FareController.deleteFare);

module.exports = router;