const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePaymentCreate, validateRefund } = require('../validators/paymentValidator');

const router = express.Router();

// Public routes (for payment callbacks)
router.post('/callback/:provider', PaymentController.handlePaymentCallback);

// Protected routes (require authentication)
router.use(authenticate);

// User routes
router.post('/', validatePaymentCreate, PaymentController.createPayment);
router.get('/my-payments', PaymentController.getUserPayments);
router.get('/:paymentId', PaymentController.getPayment);

// Payment code routes
router.post('/validate-code', PaymentController.validatePaymentCode);

// Admin routes
router.post('/:paymentId/refund', authorize(['admin']), validateRefund, PaymentController.refundPayment);

module.exports = router;