const express = require('express');
const TwoFactorAuthService = require('../services/twoFactorAuth');
const { authenticate, authorize } = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/security');
const { 
  secureText, 
  handleValidationErrors,
  sanitizeRequestBody 
} = require('../validators/secureValidator');
const { body } = require('express-validator');

const router = express.Router();

router.use(sanitizeRequestBody);

router.post('/setup', 
  authenticate, 
  authorize(['admin']),
  TwoFactorAuthService.setup2FA
);

router.post('/enable',
  authenticate,
  authorize(['admin']),
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .withMessage('Mã xác thực phải có 6 số')
      .isNumeric()
      .withMessage('Mã xác thực chỉ chứa số'),
    handleValidationErrors
  ],
  TwoFactorAuthService.enable2FA
);

router.post('/disable',
  authenticate,
  authorize(['admin']),
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .withMessage('Mã xác thực phải có 6 số')
      .isNumeric()
      .withMessage('Mã xác thực chỉ chứa số'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Vui lòng nhập mật khẩu'),
    handleValidationErrors
  ],
  TwoFactorAuthService.disable2FA
);

router.post('/verify',
  adminLoginLimiter,
  [
    body('token')
      .isLength({ min: 4, max: 8 })
      .withMessage('Mã xác thực không hợp lệ'),
    body('userId')
      .isMongoId()
      .withMessage('User ID không hợp lệ'),
    body('isBackupCode')
      .optional()
      .isBoolean()
      .withMessage('isBackupCode phải là boolean'),
    handleValidationErrors
  ],
  TwoFactorAuthService.verify2FALogin
);

router.post('/backup-codes',
  authenticate,
  authorize(['admin']),
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Vui lòng nhập mật khẩu'),
    handleValidationErrors
  ],
  TwoFactorAuthService.generateNewBackupCodes
);

router.get('/status',
  authenticate,
  authorize(['admin']),
  TwoFactorAuthService.get2FAStatus
);

module.exports = router;