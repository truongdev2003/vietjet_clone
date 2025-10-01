const express = require('express');
const CheckinController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes for check-in
router.post('/eligibility', CheckinController.checkEligibility);
router.post('/perform', CheckinController.performCheckin);
router.get('/status/:bookingReference', CheckinController.getCheckinStatus);

// Protected routes
router.use(authenticate);

router.get('/boarding-pass/:bookingReference/:passengerId', CheckinController.getBoardingPass);
router.get('/mobile-boarding-pass/:bookingReference/:passengerId', CheckinController.generateMobileBoardingPass);

module.exports = router;