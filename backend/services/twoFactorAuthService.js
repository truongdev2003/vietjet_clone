const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Two-Factor Authentication Service
 * Provides TOTP-based 2FA functionality
 */

class TwoFactorAuthService {
  /**
   * Generate 2FA secret for user
   * @param {string} userEmail - User's email
   * @returns {Object} Secret and otpauth URL
   */
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `VietJet Clone (${userEmail})`,
      issuer: 'VietJet Clone',
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code from otpauth URL
   * @param {string} otpauthUrl - OTPAuth URL
   * @returns {Promise<string>} QR code as data URL
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  }

  /**
   * Verify TOTP token
   * @param {string} token - 6-digit token from authenticator app
   * @param {string} secret - User's 2FA secret
   * @param {number} window - Time window (default: 2 = ±1 minute)
   * @returns {boolean} Token validity
   */
  static verifyToken(token, secret, window = 2) {
    if (!token || !secret) {
      return false;
    }

    // Remove any spaces or special characters from token
    const cleanToken = token.toString().replace(/\s/g, '');

    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: window // Allow ±1 minute time drift
    });
  }

  /**
   * Generate backup codes for 2FA
   * @param {number} count - Number of backup codes (default: 10)
   * @returns {Promise<Array>} Array of backup codes
   */
  static async generateBackupCodes(count = 10) {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Hash the code for storage
      const hashedCode = await bcrypt.hash(code, 10);
      
      codes.push({
        plainCode: code,
        hashedCode: hashedCode
      });
    }

    return codes;
  }

  /**
   * Verify backup code
   * @param {string} inputCode - Code entered by user
   * @param {string} hashedCode - Stored hashed code
   * @returns {Promise<boolean>} Code validity
   */
  static async verifyBackupCode(inputCode, hashedCode) {
    if (!inputCode || !hashedCode) {
      return false;
    }

    const cleanCode = inputCode.toUpperCase().replace(/\s/g, '');
    return await bcrypt.compare(cleanCode, hashedCode);
  }

  /**
   * Format backup codes for display
   * @param {Array} codes - Array of backup codes
   * @returns {Array} Formatted codes (grouped)
   */
  static formatBackupCodes(codes) {
    return codes.map(code => {
      // Insert dash in the middle: ABCD1234 -> ABCD-1234
      return code.match(/.{1,4}/g).join('-');
    });
  }

  /**
   * Get current TOTP token (for testing)
   * @param {string} secret - 2FA secret
   * @returns {string} Current token
   */
  static getCurrentToken(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
  }

  /**
   * Calculate time remaining for current token
   * @returns {number} Seconds remaining
   */
  static getTokenTimeRemaining() {
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const countDown = 30 - (epoch % 30);
    return countDown;
  }

  /**
   * Validate 2FA setup data
   * @param {Object} data - Setup data
   * @returns {Object} Validation result
   */
  static validateSetupData(data) {
    const errors = [];

    if (!data.token || !/^\d{6}$/.test(data.token)) {
      errors.push('Valid 6-digit token is required');
    }

    if (!data.secret || data.secret.length < 16) {
      errors.push('Valid secret is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = TwoFactorAuthService;
