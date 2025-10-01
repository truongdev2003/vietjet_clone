const express = require('express');
const AirportController = require('../controllers/airportController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAirportCreate, validateAirportUpdate } = require('../validators/airportValidator');

const router = express.Router();

router.get('/', AirportController.getAllAirports);
router.get('/search', AirportController.searchAirports);
router.get('/popular', AirportController.getPopularAirports);
router.get('/country/:countryCode', AirportController.getAirportsByCountry);
router.get('/nearby', AirportController.getNearbyAirports);
router.get('/:airportId', AirportController.getAirportDetails);

router.use(authenticate);

router.post('/', authorize(['admin']), validateAirportCreate, AirportController.createAirport);
router.put('/:airportId', authorize(['admin']), validateAirportUpdate, AirportController.updateAirport);
router.delete('/:airportId', authorize(['admin']), AirportController.deleteAirport);
router.get('/:airportId/stats', authorize(['admin', 'staff']), AirportController.getAirportStats);

module.exports = router;