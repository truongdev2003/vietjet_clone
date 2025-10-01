const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');
const { securityLogger } = require('../middleware/security');

class TwoFactorAuthService {
  
  // Generate 2FA secret for user
  static generateSecret(userEmail, issuer = 'VietJet Air') {
    return speakeasy.generateSecret({
      name: userEmail,
      issuer: issuer,
      length: 32
    });
  }

  // Generate QR Code for secret
  static async generateQRCode(secret) {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: secret.label,
      issuer: secret.issuer,
      encoding: 'base32'
    });
    
    return await QRCode.toDataURL(otpauthUrl);
  }

  // Verify TOTP token
  static verifyTOTP(token, secret, window = 1) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window // Allow 1 step tolerance for time drift
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Setup 2FA for admin user
  static setup2FA = asyncHandler(async (req, res, next) => {
    const user = req.currentUser;

    // Only allow admin users to setup 2FA
    if (user.role !== 'admin') {
      return next(new AppError('Chỉ admin mới có thể thiết lập 2FA', 403));
    }

    // Check if 2FA is already enabled
    if (user.twoFactorAuth?.isEnabled) {
      return next(new AppError('2FA đã được kích hoạt cho tài khoản này', 400));
    }

    // Generate secret
    const secret = this.generateSecret(user.contactInfo.email, 'VietJet Air Admin');
    
    // Generate QR code
    const qrCodeUrl = await this.generateQRCode(secret);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store temporary secret (not yet enabled)
    user.twoFactorAuth = {
      tempSecret: secret.base32,
      isEnabled: false,
      backupCodes: backupCodes.map(code => ({
        code: crypto.createHash('sha256').update(code).digest('hex'),
        used: false
      })),
      createdAt: new Date()
    };
    
    await user.save();

    securityLogger.info('2FA setup initiated', {
      userId: user._id,
      email: user.contactInfo.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json(
      ApiResponse.success('2FA setup được khởi tạo', {
        qrCode: qrCodeUrl,
        secret: secret.base32,
        backupCodes: backupCodes,
        manualEntryKey: secret.base32,
        instructions: [
          '1. Quét mã QR bằng ứng dụng Google Authenticator hoặc Authy',
          '2. Nhập mã 6 số từ ứng dụng để xác nhận',
          '3. Lưu các mã backup an toàn để khôi phục khi cần'
        ]
      })
    );
  });

  // Verify and enable 2FA
  static enable2FA = asyncHandler(async (req, res, next) => {
    const { token } = req.body;
    const user = req.currentUser;

    if (!token) {
      return next(new AppError('Vui lòng cung cấp mã xác thực', 400));
    }

    if (!user.twoFactorAuth?.tempSecret) {
      return next(new AppError('Không tìm thấy thiết lập 2FA. Vui lòng khởi tạo lại.', 400));
    }

    // Verify token
    const isValid = this.verifyTOTP(token, user.twoFactorAuth.tempSecret);
    
    if (!isValid) {
      securityLogger.warn('Invalid 2FA token during setup', {
        userId: user._id,
        email: user.contactInfo.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        token: token.substring(0, 2) + '****'
      });
      return next(new AppError('Mã xác thực không đúng', 400));
    }

    // Enable 2FA
    user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
    user.twoFactorAuth.isEnabled = true;
    user.twoFactorAuth.enabledAt = new Date();
    delete user.twoFactorAuth.tempSecret;
    
    await user.save();

    securityLogger.info('2FA enabled successfully', {
      userId: user._id,
      email: user.contactInfo.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json(
      ApiResponse.success('2FA đã được kích hoạt thành công', {
        isEnabled: true,
        backupCodesRemaining: user.twoFactorAuth.backupCodes.filter(code => !code.used).length
      })
    );
  });

  // Disable 2FA
  static disable2FA = asyncHandler(async (req, res, next) => {
    const { token, password } = req.body;
    const user = req.currentUser;

    if (!user.twoFactorAuth?.isEnabled) {
      return next(new AppError('2FA chưa được kích hoạt', 400));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Mật khẩu không đúng', 400));
    }

    // Verify 2FA token
    const isTokenValid = this.verifyTOTP(token, user.twoFactorAuth.secret);
    if (!isTokenValid) {
      return next(new AppError('Mã 2FA không đúng', 400));
    }

    // Disable 2FA
    user.twoFactorAuth = {
      isEnabled: false,
      disabledAt: new Date()
    };
    
    await user.save();

    securityLogger.info('2FA disabled', {
      userId: user._id,
      email: user.contactInfo.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json(
      ApiResponse.success('2FA đã được vô hiệu hóa')
    );
  });

  // Verify 2FA token during login
  static verify2FALogin = asyncHandler(async (req, res, next) => {
    const { token, userId, isBackupCode = false } = req.body;

    if (!token || !userId) {
      return next(new AppError('Thiếu thông tin xác thực', 400));
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth?.isEnabled) {
      return next(new AppError('Không tìm thấy thiết lập 2FA', 400));
    }

    let isValid = false;

    if (isBackupCode) {
      // Verify backup code
      const hashedCode = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
      const backupCode = user.twoFactorAuth.backupCodes.find(
        code => code.code === hashedCode && !code.used
      );

      if (backupCode) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        isValid = true;
        await user.save();

        securityLogger.info('Backup code used for 2FA', {
          userId: user._id,
          email: user.contactInfo.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    } else {
      // Verify TOTP token
      isValid = this.verifyTOTP(token, user.twoFactorAuth.secret);
    }

    if (!isValid) {
      securityLogger.warn('Invalid 2FA token during login', {
        userId: user._id,
        email: user.contactInfo.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        isBackupCode,
        token: token.substring(0, 2) + '****'
      });
      return next(new AppError('Mã xác thực không đúng', 400));
    }

    // 2FA verified successfully
    req.user = user;
    req.twoFactorVerified = true;
    
    next();
  });

  // Generate new backup codes
  static generateNewBackupCodes = asyncHandler(async (req, res, next) => {
    const { password } = req.body;
    const user = req.currentUser;

    if (!user.twoFactorAuth?.isEnabled) {
      return next(new AppError('2FA chưa được kích hoạt', 400));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Mật khẩu không đúng', 400));
    }

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes();
    
    user.twoFactorAuth.backupCodes = newBackupCodes.map(code => ({
      code: crypto.createHash('sha256').update(code).digest('hex'),
      used: false,
      createdAt: new Date()
    }));
    
    await user.save();

    securityLogger.info('New backup codes generated', {
      userId: user._id,
      email: user.contactInfo.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json(
      ApiResponse.success('Mã backup mới đã được tạo', {
        backupCodes: newBackupCodes,
        warning: 'Lưu các mã này ở nơi an toàn. Chúng sẽ không được hiển thị lại.'
      })
    );
  });

  // Get 2FA status
  static get2FAStatus = asyncHandler(async (req, res, next) => {
    const user = req.currentUser;

    const status = {
      isEnabled: user.twoFactorAuth?.isEnabled || false,
      enabledAt: user.twoFactorAuth?.enabledAt,
      backupCodesRemaining: user.twoFactorAuth?.backupCodes ? 
        user.twoFactorAuth.backupCodes.filter(code => !code.used).length : 0
    };

    res.status(200).json(
      ApiResponse.success('Trạng thái 2FA', status)
    );
  });
}

module.exports = TwoFactorAuthService;