const express = require('express');
const router = express.Router();
const TwoFactorAuthController = require('../controllers/twoFactorAuthController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * Two-Factor Authentication Routes
 * All routes except /verify require authentication
 */

// Setup 2FA - Generate secret and QR code
router.post('/setup',
  protect,
  TwoFactorAuthController.setup2FA
);

// Verify setup and enable 2FA
router.post('/verify-setup',
  protect,
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .withMessage('Token must be 6 digits')
      .isNumeric()
      .withMessage('Token must contain only numbers'),
    handleValidationErrors
  ],
  TwoFactorAuthController.verifySetup
);

// Verify 2FA token during login (public route for login flow)
router.post('/verify',
  [
    body('userId')
      .notEmpty()
      .withMessage('User ID is required'),
    body('token')
      .isLength({ min: 6, max: 8 })
      .withMessage('Token must be 6-8 characters')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('Invalid token format'),
    handleValidationErrors
  ],
  TwoFactorAuthController.verify2FA
);

// Disable 2FA
router.post('/disable',
  protect,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  TwoFactorAuthController.disable2FA
);

// Get 2FA status
router.get('/status',
  protect,
  TwoFactorAuthController.get2FAStatus
);

// Regenerate backup codes
router.post('/regenerate-backup-codes',
  protect,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  TwoFactorAuthController.regenerateBackupCodes
);

module.exports = router;
