const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { protect, requireEmailVerification } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const fileUploadService = require('../utils/fileUploadService');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateRefreshToken,
  validateResendVerificationEmail,
  validateVerifyEmail
} = require('../validators/authValidator');

const {
  validateUpdateProfile,
  validateUpdateContactInfo,
  validateDocument,
  validateUpdatePreferences,
  validateFrequentFlyerInfo,
  validateDeactivateAccount,
  validateDeleteAccount,
  validateDocumentId
} = require('../validators/userValidator');

// Setup multer for file uploads
const avatarUpload = fileUploadService.getAvatarUpload();
const documentUpload = fileUploadService.getDocumentUpload();

// Public routes
router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  AuthController.register
);

router.post('/login', 
  validateLogin, 
  handleValidationErrors, 
  AuthController.login
);

router.post('/refresh-token', 
  validateRefreshToken, 
  handleValidationErrors, 
  AuthController.refreshToken
);

router.post('/forgot-password', 
  validateForgotPassword, 
  handleValidationErrors, 
  AuthController.forgotPassword
);

router.post('/reset-password', 
  validateResetPassword, 
  handleValidationErrors, 
  AuthController.resetPassword
);

router.get('/verify-email/:token', 
  validateVerifyEmail, 
  handleValidationErrors, 
  AuthController.verifyEmail
);

router.post('/resend-verification-email', 
  validateResendVerificationEmail, 
  handleValidationErrors, 
  AuthController.resendVerificationEmail
);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

router.post('/logout', AuthController.logout);

router.post('/change-password', 
  validateChangePassword, 
  handleValidationErrors, 
  AuthController.changePassword
);

// Profile management
router.get('/profile', AuthController.getProfile);

router.put('/profile', 
  validateUpdateProfile, 
  handleValidationErrors, 
  AuthController.updateProfile
);

router.put('/contact-info', 
  validateUpdateContactInfo, 
  handleValidationErrors, 
  AuthController.updateContactInfo
);

router.put('/preferences', 
  validateUpdatePreferences, 
  handleValidationErrors, 
  AuthController.updatePreferences
);

router.put('/frequent-flyer', 
  validateFrequentFlyerInfo, 
  handleValidationErrors, 
  AuthController.updateFrequentFlyerInfo
);

// Avatar management
router.post('/avatar', 
  avatarUpload.single('avatar'),
  fileUploadService.handleMulterError,
  AuthController.uploadAvatar
);

router.delete('/avatar', AuthController.deleteAvatar);

// Document management
router.put('/documents/:documentId', 
  validateDocument, 
  handleValidationErrors, 
  AuthController.updateDocument
);

router.delete('/documents/:documentId', 
  validateDocumentId, 
  handleValidationErrors, 
  AuthController.deleteDocument
);

router.post('/documents/:documentId/upload', 
  documentUpload.single('document'),
  fileUploadService.handleMulterError,
  AuthController.uploadDocumentFile
);

// Account management
router.get('/stats', AuthController.getUserStats);

router.post('/deactivate', 
  validateDeactivateAccount, 
  handleValidationErrors, 
  AuthController.deactivateAccount
);

router.delete('/delete-account', 
  validateDeleteAccount, 
  handleValidationErrors, 
  AuthController.deleteAccount
);

// Routes that require email verification
router.get('/profile/verified', 
  requireEmailVerification, 
  AuthController.getProfile
);

module.exports = router;