const User = require('../models/User');
const TwoFactorAuthService = require('../services/twoFactorAuthService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management
 */

class TwoFactorAuthController {
  /**
   * Setup 2FA - Generate secret and QR code
   * POST /api/2fa/setup
   */
  static async setup2FA(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      // Check if 2FA is already enabled
      if (user.twoFactorAuth.isEnabled) {
        return errorResponse(res, '2FA is already enabled for this account', 400);
      }

      // Generate new secret
      const { secret, otpauthUrl } = TwoFactorAuthService.generateSecret(
        user.contactInfo.email
      );

      // Generate QR code
      const qrCodeDataUrl = await TwoFactorAuthService.generateQRCode(otpauthUrl);

      // Store temporary secret (not enabled yet)
      user.twoFactorAuth.tempSecret = secret;
      user.twoFactorAuth.createdAt = new Date();
      await user.save();

      return successResponse(res, {
        secret,
        qrCode: qrCodeDataUrl,
        otpauthUrl,
        message: 'Scan QR code with your authenticator app (Google Authenticator, Authy, etc.)'
      }, 'Two-factor authentication setup initiated');
    } catch (error) {
      console.error('2FA Setup Error:', error);
      return errorResponse(res, 'Failed to setup 2FA', 500);
    }
  }

  /**
   * Verify and enable 2FA
   * POST /api/2fa/verify-setup
   */
  static async verifySetup(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return errorResponse(res, 'Verification token is required', 400);
      }

      const user = await User.findById(userId);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (!user.twoFactorAuth.tempSecret) {
        return errorResponse(res, 'No 2FA setup in progress', 400);
      }

      // Verify the token
      const isValid = TwoFactorAuthService.verifyToken(
        token,
        user.twoFactorAuth.tempSecret
      );

      if (!isValid) {
        return errorResponse(res, 'Invalid verification code', 400);
      }

      // Generate backup codes
      const backupCodesData = await TwoFactorAuthService.generateBackupCodes(10);
      const plainBackupCodes = backupCodesData.map(bc => bc.plainCode);

      // Enable 2FA
      user.twoFactorAuth.isEnabled = true;
      user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
      user.twoFactorAuth.tempSecret = undefined;
      user.twoFactorAuth.enabledAt = new Date();
      
      // Store hashed backup codes
      user.twoFactorAuth.backupCodes = backupCodesData.map(bc => ({
        code: bc.hashedCode,
        used: false,
        createdAt: new Date()
      }));

      await user.save();

      // Format backup codes for display
      const formattedCodes = TwoFactorAuthService.formatBackupCodes(plainBackupCodes);

      return successResponse(res, {
        backupCodes: formattedCodes,
        message: 'Save these backup codes in a safe place. Each code can only be used once.'
      }, '2FA enabled successfully');
    } catch (error) {
      console.error('2FA Verify Setup Error:', error);
      return errorResponse(res, 'Failed to verify 2FA setup', 500);
    }
  }

  /**
   * Verify 2FA token during login
   * POST /api/2fa/verify
   */
  static async verify2FA(req, res) {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        return errorResponse(res, 'User ID and token are required', 400);
      }

      const user = await User.findById(userId);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (!user.twoFactorAuth.isEnabled) {
        return errorResponse(res, '2FA is not enabled for this account', 400);
      }

      // Try to verify with TOTP token first
      const isValidToken = TwoFactorAuthService.verifyToken(
        token,
        user.twoFactorAuth.secret
      );

      if (isValidToken) {
        return successResponse(res, null, '2FA verification successful');
      }

      // If TOTP fails, try backup codes
      const cleanToken = token.toUpperCase().replace(/[\s-]/g, '');
      
      for (const backupCode of user.twoFactorAuth.backupCodes) {
        if (backupCode.used) continue;

        const isValidBackup = await TwoFactorAuthService.verifyBackupCode(
          cleanToken,
          backupCode.code
        );

        if (isValidBackup) {
          // Mark backup code as used
          backupCode.used = true;
          backupCode.usedAt = new Date();
          await user.save();

          return successResponse(res, {
            usedBackupCode: true,
            remainingBackupCodes: user.twoFactorAuth.backupCodes.filter(bc => !bc.used).length
          }, '2FA verification successful using backup code');
        }
      }

      return errorResponse(res, 'Invalid verification code', 400);
    } catch (error) {
      console.error('2FA Verify Error:', error);
      return errorResponse(res, 'Failed to verify 2FA token', 500);
    }
  }

  /**
   * Disable 2FA
   * POST /api/2fa/disable
   */
  static async disable2FA(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return errorResponse(res, 'Password is required to disable 2FA', 400);
      }

      const user = await User.findById(userId).select('+account.password');

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (!user.twoFactorAuth.isEnabled) {
        return errorResponse(res, '2FA is not enabled', 400);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return errorResponse(res, 'Invalid password', 401);
      }

      // Disable 2FA
      user.twoFactorAuth.isEnabled = false;
      user.twoFactorAuth.secret = undefined;
      user.twoFactorAuth.tempSecret = undefined;
      user.twoFactorAuth.disabledAt = new Date();
      user.twoFactorAuth.backupCodes = [];

      await user.save();

      return successResponse(res, null, '2FA disabled successfully');
    } catch (error) {
      console.error('2FA Disable Error:', error);
      return errorResponse(res, 'Failed to disable 2FA', 500);
    }
  }

  /**
   * Get 2FA status
   * GET /api/2fa/status
   */
  static async get2FAStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      const status = {
        isEnabled: user.twoFactorAuth.isEnabled || false,
        enabledAt: user.twoFactorAuth.enabledAt,
        hasBackupCodes: user.twoFactorAuth.backupCodes?.length > 0,
        unusedBackupCodes: user.twoFactorAuth.backupCodes?.filter(bc => !bc.used).length || 0
      };

      return successResponse(res, status, '2FA status retrieved');
    } catch (error) {
      console.error('Get 2FA Status Error:', error);
      return errorResponse(res, 'Failed to get 2FA status', 500);
    }
  }

  /**
   * Regenerate backup codes
   * POST /api/2fa/regenerate-backup-codes
   */
  static async regenerateBackupCodes(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return errorResponse(res, 'Password is required', 400);
      }

      const user = await User.findById(userId).select('+account.password');

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (!user.twoFactorAuth.isEnabled) {
        return errorResponse(res, '2FA is not enabled', 400);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return errorResponse(res, 'Invalid password', 401);
      }

      // Generate new backup codes
      const backupCodesData = await TwoFactorAuthService.generateBackupCodes(10);
      const plainBackupCodes = backupCodesData.map(bc => bc.plainCode);

      // Replace old backup codes
      user.twoFactorAuth.backupCodes = backupCodesData.map(bc => ({
        code: bc.hashedCode,
        used: false,
        createdAt: new Date()
      }));

      await user.save();

      const formattedCodes = TwoFactorAuthService.formatBackupCodes(plainBackupCodes);

      return successResponse(res, {
        backupCodes: formattedCodes,
        message: 'Save these backup codes. Old backup codes are now invalid.'
      }, 'Backup codes regenerated successfully');
    } catch (error) {
      console.error('Regenerate Backup Codes Error:', error);
      return errorResponse(res, 'Failed to regenerate backup codes', 500);
    }
  }
}

module.exports = TwoFactorAuthController;
