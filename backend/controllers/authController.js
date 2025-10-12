const User = require('../models/User');
const JWTService = require('../config/jwt');
const AuthUtils = require('../utils/authUtils');
const ApiResponse = require('../utils/apiResponse');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const fileUploadService = require('../utils/fileUploadService');
const crypto = require('crypto');
const path = require('path');

class AuthController {
  // Register new user
  static register = asyncHandler(async (req, res, next) => {
    try {
      console.log('=== REGISTER REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const {
        title,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        nationality,
        email,
        phone,
        password,
        confirmPassword
      } = req.body;

      // Validate required fields
      if (!title || !firstName || !lastName || !dateOfBirth || !gender || !email || !phone || !password) {
        console.log('Missing fields:', {
          title: !!title,
          firstName: !!firstName,
          lastName: !!lastName,
          dateOfBirth: !!dateOfBirth,
          gender: !!gender,
          email: !!email,
          phone: !!phone,
          password: !!password
        });
        return next(new AppError('Vui lòng điền đầy đủ thông tin bắt buộc', 400));
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        return next(new AppError('Mật khẩu xác nhận không khớp', 400));
      }

      // Validate email format
      if (!AuthUtils.isValidEmail(email)) {
        return next(new AppError('Email không hợp lệ', 400));
      }

      // Validate phone format
      if (!AuthUtils.isValidPhone(phone)) {
        return next(new AppError('Số điện thoại không hợp lệ', 400));
      }

      // Validate date of birth
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return next(new AppError('Ngày sinh không hợp lệ', 400));
      }

      // Calculate age
      const age = AuthUtils.calculateAge(dateOfBirth);
      if (age < 18) {
        return next(new AppError('Bạn phải từ 18 tuổi trở lên để đăng ký', 400));
      }

      if (age > 120) {
        return next(new AppError('Ngày sinh không hợp lệ', 400));
      }

      // Validate gender
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(gender)) {
        console.log('Invalid gender:', gender);
        return next(new AppError('Giới tính không hợp lệ', 400));
      }

      // Validate title - PHẢI KHỚP VỚI USER SCHEMA
      const validTitles = ['Mr', 'Mrs', 'Ms', 'Dr'];
      if (!validTitles.includes(title)) {
        console.log('Invalid title:', title, 'Valid titles:', validTitles);
        return next(new AppError('Danh xưng không hợp lệ. Chọn: Mr, Mrs, Ms, Dr', 400));
      }

      // Check if user already exists
      let existingUser;
      try {
        existingUser = await User.findOne({
          $or: [
            { 'contactInfo.email': email.toLowerCase() },
            { 'contactInfo.phone': AuthUtils.formatPhoneNumber(phone) }
          ]
        });
      } catch (dbError) {
        console.error('Database error checking existing user:', dbError);
        return next(new AppError('Không thể kiểm tra thông tin người dùng. Vui lòng thử lại.', 500));
      }

      if (existingUser) {
        return next(new AppError('Email hoặc số điện thoại đã được sử dụng', 400));
      }

      // Generate email verification token
      let emailVerificationToken, hashedEmailToken;
      try {
        emailVerificationToken = AuthUtils.generateRandomToken();
        hashedEmailToken = AuthUtils.hashToken(emailVerificationToken);
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
        return next(new AppError('Không thể tạo mã xác thực. Vui lòng thử lại.', 500));
      }

      // Create new user
      let newUser;
      try {
        newUser = await User.create({
          personalInfo: {
            title: AuthUtils.sanitizeInput(title),
            firstName: AuthUtils.sanitizeInput(firstName),
            lastName: AuthUtils.sanitizeInput(lastName),
            dateOfBirth: birthDate,
            gender,
            nationality: nationality || 'Vietnam'
          },
          contactInfo: {
            email: email.toLowerCase().trim(),
            phone: AuthUtils.formatPhoneNumber(phone)
          },
          account: {
            password, // Will be hashed by pre-save middleware
            emailVerificationToken: hashedEmailToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          metadata: {
            registrationSource: 'web'
          }
        });
      } catch (createError) {
        console.error('User creation error:', createError);
        
        // Handle specific MongoDB errors
        if (createError.code === 11000) {
          return next(new AppError('Email hoặc số điện thoại đã được sử dụng', 400));
        }
        
        if (createError.name === 'ValidationError') {
          const messages = Object.values(createError.errors).map(err => err.message);
          return next(new AppError(messages.join(', '), 400));
        }
        
        return next(new AppError('Không thể tạo tài khoản. Vui lòng thử lại.', 500));
      }

      // Generate tokens
      let tokens;
      try {
        const payload = {
          userId: newUser._id,
          email: newUser.contactInfo.email,
          isEmailVerified: newUser.account.isEmailVerified
        };
        
        tokens = JWTService.generateTokenPair(payload);
      } catch (jwtError) {
        console.error('JWT generation error:', jwtError);
        // User created but token generation failed - still return success
        // User can login manually
        return next(new AppError('Đăng ký thành công nhưng không thể tạo token. Vui lòng đăng nhập.', 201));
      }

      // Send verification email
      try {
        const emailService = require('../services/emailService');
        const emailResult = await emailService.sendRegistrationConfirmation(newUser, emailVerificationToken);
        
        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          // Không throw error, user vẫn có thể resend email sau
        } else {
          console.log('✅ Verification email sent successfully to:', newUser.contactInfo.email);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue - user is created, email can be resent later
      }

      // Remove sensitive data from response
      const userResponse = { ...newUser.toObject() };
      delete userResponse.account.password;
      delete userResponse.account.emailVerificationToken;
      delete userResponse.account.passwordResetToken;

      const response = ApiResponse.created({
        user: userResponse,
        tokens,
        message: 'Vui lòng kiểm tra email để xác thực tài khoản'
      }, 'Đăng ký thành công');

      response.send(res);
    } catch (error) {
      console.error('Unexpected error in register:', error);
      return next(new AppError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 500));
    }
  });

  // Login user
  static login = asyncHandler(async (req, res, next) => {
    try {
      const { email, password, rememberMe } = req.body;

      // Validate input
      if (!email || !password) {
        return next(new AppError('Vui lòng nhập email và mật khẩu', 400));
      }

      // Validate email format
      if (!AuthUtils.isValidEmail(email)) {
        return next(new AppError('Email không hợp lệ', 400));
      }

      // Find user by email
      let user;
      try {
        user = await User.findOne({ 'contactInfo.email': email.toLowerCase() })
          .select('+account.password +account.loginAttempts +account.lockUntil');
      } catch (dbError) {
        console.error('Database error finding user:', dbError);
        return next(new AppError('Không thể đăng nhập. Vui lòng thử lại.', 500));
      }

      if (!user) {
        return next(new AppError('Email hoặc mật khẩu không đúng', 401));
      }

      // Check if account is locked
      if (user.isLocked) {
        const lockTime = Math.ceil((user.account.lockUntil - Date.now()) / 60000);
        return next(new AppError(`Tài khoản đã bị khóa. Vui lòng thử lại sau ${lockTime} phút.`, 423));
      }

      // Check if account is active
      if (user.status !== 'active') {
        return next(new AppError('Tài khoản không hoạt động', 401));
      }

      // Verify password
      let isPasswordValid;
      try {
        isPasswordValid = await user.comparePassword(password);
      } catch (pwdError) {
        console.error('Password comparison error:', pwdError);
        return next(new AppError('Không thể xác thực mật khẩu. Vui lòng thử lại.', 500));
      }
      
      if (!isPasswordValid) {
        // Increment login attempts
        try {
          await user.incLoginAttempts();
        } catch (incError) {
          console.error('Error incrementing login attempts:', incError);
        }
        return next(new AppError('Email hoặc mật khẩu không đúng', 401));
      }

      // Reset login attempts on successful login
      try {
        const updates = {
          'account.lastLogin': new Date(),
          $unset: {
            'account.loginAttempts': 1,
            'account.lockUntil': 1
          }
        };
        await User.updateOne({ _id: user._id }, updates);
      } catch (updateError) {
        console.error('Error updating login info:', updateError);
        // Continue - this is not critical
      }

      // Generate tokens
      let tokens;
      try {
        const payload = {
          userId: user._id,
          email: user.contactInfo.email,
          isEmailVerified: user.account.isEmailVerified
        };
        
        tokens = JWTService.generateTokenPair(payload, rememberMe);
      } catch (jwtError) {
        console.error('JWT generation error:', jwtError);
        return next(new AppError('Không thể tạo phiên đăng nhập. Vui lòng thử lại.', 500));
      }

      // Remove sensitive data from response
      const userResponse = { ...user.toObject() };
      delete userResponse.account.password;
      delete userResponse.account.emailVerificationToken;
      delete userResponse.account.passwordResetToken;
      delete userResponse.account.loginAttempts;
      delete userResponse.account.lockUntil;

      const response = ApiResponse.success({
        user: userResponse,
        tokens
      }, 'Đăng nhập thành công');

      response.send(res);
    } catch (error) {
      console.error('Unexpected error in login:', error);
      return next(new AppError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 500));
    }
  });

  // Refresh access token
  static refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token là bắt buộc', 400));
    }

    // Verify refresh token - let the error bubble up to be caught by asyncHandler
    let decoded;
    try {
      decoded = JWTService.verifyRefreshToken(refreshToken);
    } catch (error) {
      // JWT verification errors will be caught by global error handler
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
    }

    if (!decoded || !decoded.userId) {
      return next(new AppError('Token không hợp lệ', 401));
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    // Generate new tokens
    const payload = {
      userId: user._id,
      email: user.contactInfo.email,
      isEmailVerified: user.account.isEmailVerified
    };
    
    const tokens = JWTService.generateTokenPair(payload);

    const response = ApiResponse.success({
      tokens
    }, 'Token được làm mới thành công');

    response.send(res);
  });

  // Logout user
  static logout = asyncHandler(async (req, res, next) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just send a success response
    
    const response = ApiResponse.success(null, 'Đăng xuất thành công');
    response.send(res);
  });

  // Forgot password
  static forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Vui lòng nhập email', 400));
    }

    // Validate email format
    if (!AuthUtils.isValidEmail(email)) {
      return next(new AppError('Email không hợp lệ', 400));
    }

    // Find user by email
    const user = await User.findOne({ 'contactInfo.email': email.toLowerCase() });
    
    if (!user) {
      return next(new AppError('Không tìm thấy tài khoản với email này', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    // Generate reset token
    const resetToken = AuthUtils.generateRandomToken();
    const hashedResetToken = AuthUtils.hashToken(resetToken);

    // Save reset token to user
    user.account.passwordResetToken = hashedResetToken;
    user.account.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    try {
      await user.save({ validateBeforeSave: false });
      
      // Send reset email
      const emailService = require('../services/emailService');
      const emailResult = await emailService.sendPasswordReset(user, resetToken);
      
      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Không throw error, vẫn response success để tránh tiết lộ thông tin
      }
    } catch (error) {
      user.account.passwordResetToken = undefined;
      user.account.passwordResetExpires = undefined;
      return next(new AppError('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(
      { email: AuthUtils.maskEmail(email) },
      'Đã gửi email hướng dẫn đặt lại mật khẩu'
    );

    response.send(res);
  });

  // Reset password
  static resetPassword = asyncHandler(async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return next(new AppError('Vui lòng điền đầy đủ thông tin', 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Mật khẩu xác nhận không khớp', 400));
    }

    // Hash the token
    const hashedToken = AuthUtils.hashToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      'account.passwordResetToken': hashedToken,
      'account.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
    }

    // Reset password
    user.account.password = password; // Will be hashed by pre-save middleware
    user.account.passwordResetToken = undefined;
    user.account.passwordResetExpires = undefined;
    user.account.loginAttempts = undefined;
    user.account.lockUntil = undefined;
    
    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể đặt lại mật khẩu. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(null, 'Đặt lại mật khẩu thành công');
    response.send(res);
  });

  // Verify email
  static verifyEmail = asyncHandler(async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
      return next(new AppError('Token xác thực là bắt buộc', 400));
    }

    // Hash the token
    const hashedToken = AuthUtils.hashToken(token);

    // Find user with valid verification token
    const user = await User.findOne({
      'account.emailVerificationToken': hashedToken,
      'account.emailVerificationExpires': { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
    }

    if (user.account.isEmailVerified) {
      return next(new AppError('Email đã được xác thực trước đó', 400));
    }

    // Verify email
    user.account.isEmailVerified = true;
    user.account.emailVerificationToken = undefined;
    user.account.emailVerificationExpires = undefined;
    
    try {
      await user.save({ validateBeforeSave: false });
    } catch (error) {
      return next(new AppError('Không thể xác thực email. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(null, 'Xác thực email thành công');
    response.send(res);
  });

  // Resend verification email
  static resendVerificationEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Vui lòng nhập email', 400));
    }

    // Validate email format
    if (!AuthUtils.isValidEmail(email)) {
      return next(new AppError('Email không hợp lệ', 400));
    }

    const user = await User.findOne({ 'contactInfo.email': email.toLowerCase() });
    
    if (!user) {
      return next(new AppError('Không tìm thấy tài khoản với email này', 404));
    }

    if (user.account.isEmailVerified) {
      return next(new AppError('Email đã được xác thực', 400));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    // Generate new verification token
    const emailVerificationToken = AuthUtils.generateRandomToken();
    const hashedEmailToken = AuthUtils.hashToken(emailVerificationToken);

    user.account.emailVerificationToken = hashedEmailToken;
    user.account.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    try {
      await user.save({ validateBeforeSave: false });
    } catch (error) {
      return next(new AppError('Không thể gửi lại email xác thực. Vui lòng thử lại.', 500));
    }

    // TODO: Send verification email
    console.log('New email verification token:', emailVerificationToken);

    const response = ApiResponse.success(
      { email: AuthUtils.maskEmail(email) },
      'Đã gửi lại email xác thực'
    );

    response.send(res);
  });

  // Change password
  static changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Vui lòng điền đầy đủ thông tin', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('Mật khẩu mới không khớp', 400));
    }

    if (currentPassword === newPassword) {
      return next(new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400));
    }

    // Find user
    const user = await User.findById(userId).select('+account.password');
    
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return next(new AppError('Mật khẩu hiện tại không đúng', 400));
    }

    // Update password
    user.account.password = newPassword; // Will be hashed by pre-save middleware
    user.account.loginAttempts = undefined;
    user.account.lockUntil = undefined;
    
    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể đổi mật khẩu. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(null, 'Đổi mật khẩu thành công');
    response.send(res);
  });

  // Get current user profile
  static getProfile = asyncHandler(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId)
        .populate('bookingCount');

      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 404));
      }

      if (user.status !== 'active') {
        return next(new AppError('Tài khoản không hoạt động', 401));
      }

      // Remove sensitive data
      const userResponse = { ...user.toObject() };
      delete userResponse.account.password;
      delete userResponse.account.emailVerificationToken;
      delete userResponse.account.passwordResetToken;
      delete userResponse.account.loginAttempts;
      delete userResponse.account.lockUntil;

      const response = ApiResponse.success(userResponse, 'Lấy thông tin người dùng thành công');
      response.send(res);
    } catch (error) {
      console.error('Error in getProfile:', error);
      return next(new AppError('Không thể lấy thông tin người dùng. Vui lòng thử lại.', 500));
    }
  });

  // Update user profile (general info)
  static updateProfile = asyncHandler(async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const allowedFields = [
        'personalInfo.title',
        'personalInfo.firstName', 
        'personalInfo.lastName',
        'personalInfo.dateOfBirth',
        'personalInfo.gender',
        'personalInfo.nationality',
        'contactInfo.alternatePhone',
        'contactInfo.address',
        'preferences.language',
        'preferences.currency',
        'preferences.seatPreference',
        'preferences.mealPreference',
        'preferences.specialAssistance',
        'preferences.marketingConsent'
      ];

      // Extract only allowed fields from request body
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      // Check if there are any updates
      if (Object.keys(updates).length === 0) {
        return next(new AppError('Không có thông tin nào để cập nhật', 400));
      }

      // Validate date of birth if provided
      if (updates['personalInfo.dateOfBirth']) {
        const birthDate = new Date(updates['personalInfo.dateOfBirth']);
        if (isNaN(birthDate.getTime())) {
          return next(new AppError('Ngày sinh không hợp lệ', 400));
        }
        
        const age = AuthUtils.calculateAge(updates['personalInfo.dateOfBirth']);
        if (age < 18) {
          return next(new AppError('Bạn phải từ 18 tuổi trở lên', 400));
        }
        if (age > 120) {
          return next(new AppError('Ngày sinh không hợp lệ', 400));
        }
        
        updates['personalInfo.dateOfBirth'] = birthDate;
      }

      // Validate gender if provided
      if (updates['personalInfo.gender']) {
        const validGenders = ['male', 'female', 'other'];
        if (!validGenders.includes(updates['personalInfo.gender'])) {
          return next(new AppError('Giới tính không hợp lệ', 400));
        }
      }

      // Validate title if provided
      if (updates['personalInfo.title']) {
        const validTitles = ['Mr', 'Mrs', 'Ms', 'Dr'];
        if (!validTitles.includes(updates['personalInfo.title'])) {
          return next(new AppError('Danh xưng không hợp lệ. Chọn: Mr, Mrs, Ms, Dr', 400));
        }
      }

      // Sanitize text inputs
      const textFields = ['personalInfo.firstName', 'personalInfo.lastName'];
      textFields.forEach(field => {
        if (updates[field]) {
          if (typeof updates[field] !== 'string' || updates[field].trim().length === 0) {
            return next(new AppError(`${field === 'personalInfo.firstName' ? 'Tên' : 'Họ'} không hợp lệ`, 400));
          }
          updates[field] = AuthUtils.sanitizeInput(updates[field]);
        }
      });

      let user;
      try {
        user = await User.findByIdAndUpdate(
          userId, 
          { $set: updates },
          { new: true, runValidators: true }
        );
      } catch (updateError) {
        console.error('Error updating profile:', updateError);
        
        if (updateError.name === 'ValidationError') {
          const messages = Object.values(updateError.errors).map(err => err.message);
          return next(new AppError(messages.join(', '), 400));
        }
        
        return next(new AppError('Không thể cập nhật thông tin. Vui lòng thử lại.', 500));
      }

      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 404));
      }

      // Remove sensitive data
      const userResponse = { ...user.toObject() };
      delete userResponse.account.password;
      delete userResponse.account.emailVerificationToken;
      delete userResponse.account.passwordResetToken;
      delete userResponse.account.loginAttempts;
      delete userResponse.account.lockUntil;

      const response = ApiResponse.success(userResponse, 'Cập nhật thông tin thành công');
      response.send(res);
    } catch (error) {
      console.error('Unexpected error in updateProfile:', error);
      return next(new AppError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 500));
    }
  });

  // Update contact info (requires email verification for email changes)
  static updateContactInfo = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { email, phone, alternatePhone, address } = req.body;

    if (!email && !phone && alternatePhone === undefined && address === undefined) {
      return next(new AppError('Vui lòng cung cấp ít nhất một thông tin để cập nhật', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    const updates = {};

    // Handle email change
    if (email && email !== user.contactInfo.email) {
      if (!AuthUtils.isValidEmail(email)) {
        return next(new AppError('Email không hợp lệ', 400));
      }

      // Check if email already exists
      const existingUser = await User.findOne({ 
        'contactInfo.email': email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return next(new AppError('Email đã được sử dụng', 400));
      }

      updates['contactInfo.email'] = email.toLowerCase();
      updates['account.isEmailVerified'] = false;
      
      // Generate new verification token
      const emailVerificationToken = AuthUtils.generateRandomToken();
      const hashedEmailToken = AuthUtils.hashToken(emailVerificationToken);
      updates['account.emailVerificationToken'] = hashedEmailToken;
      updates['account.emailVerificationExpires'] = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log('New email verification token:', emailVerificationToken);
    }

    // Handle phone change
    if (phone && phone !== user.contactInfo.phone) {
      if (!AuthUtils.isValidPhone(phone)) {
        return next(new AppError('Số điện thoại không hợp lệ', 400));
      }

      const formattedPhone = AuthUtils.formatPhoneNumber(phone);
      
      // Check if phone already exists
      const existingUser = await User.findOne({ 
        'contactInfo.phone': formattedPhone,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return next(new AppError('Số điện thoại đã được sử dụng', 400));
      }

      updates['contactInfo.phone'] = formattedPhone;
    }

    // Handle other contact info
    if (alternatePhone !== undefined) {
      if (alternatePhone && !AuthUtils.isValidPhone(alternatePhone)) {
        return next(new AppError('Số điện thoại phụ không hợp lệ', 400));
      }
      updates['contactInfo.alternatePhone'] = alternatePhone ? AuthUtils.formatPhoneNumber(alternatePhone) : '';
    }

    if (address !== undefined) {
      updates['contactInfo.address'] = address;
    }

    let updatedUser;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );
    } catch (error) {
      return next(new AppError('Không thể cập nhật thông tin liên lạc. Vui lòng thử lại.', 500));
    }

    if (!updatedUser) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    // Remove sensitive data
    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.account.password;
    delete userResponse.account.emailVerificationToken;
    delete userResponse.account.passwordResetToken;

    let message = 'Cập nhật thông tin liên lạc thành công';
    if (email && email !== user.contactInfo.email) {
      message += '. Vui lòng kiểm tra email mới để xác thực.';
    }

    const response = ApiResponse.success(userResponse, message);
    response.send(res);
  });

  // Add/Update document (passport, national ID, etc.)
  static updateDocument = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { type, number, issuedDate, expiryDate, issuedBy, issuedCountry, isPrimary } = req.body;

    if (!type || !number || !expiryDate) {
      return next(new AppError('Loại giấy tờ, số và ngày hết hạn là bắt buộc', 400));
    }

    // Validate document type
    const validTypes = ['passport', 'national_id', 'driver_license'];
    if (!validTypes.includes(type)) {
      return next(new AppError('Loại giấy tờ không hợp lệ', 400));
    }

    // Validate expiry date
    if (new Date(expiryDate) <= new Date()) {
      return next(new AppError('Ngày hết hạn phải sau ngày hiện tại', 400));
    }

    // Validate issued date if provided
    if (issuedDate) {
      const issued = new Date(issuedDate);
      const expiry = new Date(expiryDate);
      if (issued >= expiry) {
        return next(new AppError('Ngày cấp phải trước ngày hết hạn', 400));
      }
      if (issued > new Date()) {
        return next(new AppError('Ngày cấp không được sau ngày hiện tại', 400));
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    const documentData = {
      type,
      number: number.toUpperCase().trim(),
      issuedDate: issuedDate ? new Date(issuedDate) : undefined,
      expiryDate: new Date(expiryDate),
      issuedBy: issuedBy || '',
      issuedCountry: issuedCountry || 'Vietnam',
      isPrimary: isPrimary || false
    };

    if (documentId && documentId !== 'new') {
      // Update existing document
      const docIndex = user.documents.findIndex(doc => doc._id.toString() === documentId);
      if (docIndex === -1) {
        return next(new AppError('Giấy tờ không tồn tại', 404));
      }
      user.documents[docIndex] = { ...user.documents[docIndex].toObject(), ...documentData };
    } else {
      // Add new document
      // If this is primary, set others to non-primary
      if (documentData.isPrimary) {
        user.documents.forEach(doc => {
          doc.isPrimary = false;
        });
      }
      user.documents.push(documentData);
    }

    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể lưu giấy tờ. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(
      user.documents,
      documentId && documentId !== 'new' ? 'Cập nhật giấy tờ thành công' : 'Thêm giấy tờ thành công'
    );
    response.send(res);
  });

  // Delete document
  static deleteDocument = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      return next(new AppError('ID giấy tờ là bắt buộc', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    const docIndex = user.documents.findIndex(doc => doc._id.toString() === documentId);
    if (docIndex === -1) {
      return next(new AppError('Giấy tờ không tồn tại', 404));
    }

    user.documents.splice(docIndex, 1);
    
    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể xóa giấy tờ. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(user.documents, 'Xóa giấy tờ thành công');
    response.send(res);
  });

  // Update preferences
  static updatePreferences = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { 
      language, 
      currency, 
      seatPreference, 
      mealPreference, 
      specialAssistance,
      marketingConsent 
    } = req.body;

    if (
      language === undefined && 
      currency === undefined && 
      seatPreference === undefined && 
      mealPreference === undefined && 
      specialAssistance === undefined && 
      marketingConsent === undefined
    ) {
      return next(new AppError('Vui lòng cung cấp ít nhất một tùy chọn để cập nhật', 400));
    }

    const updates = {};

    if (language !== undefined) {
      const validLanguages = ['vi', 'en', 'zh', 'ja', 'ko'];
      if (!validLanguages.includes(language)) {
        return next(new AppError('Ngôn ngữ không hợp lệ', 400));
      }
      updates['preferences.language'] = language;
    }

    if (currency !== undefined) {
      const validCurrencies = ['VND', 'USD', 'EUR', 'JPY'];
      if (!validCurrencies.includes(currency)) {
        return next(new AppError('Đơn vị tiền tệ không hợp lệ', 400));
      }
      updates['preferences.currency'] = currency;
    }

    if (seatPreference !== undefined) {
      const validSeats = ['window', 'aisle', 'middle', 'no_preference'];
      if (!validSeats.includes(seatPreference)) {
        return next(new AppError('Tùy chọn ghế ngồi không hợp lệ', 400));
      }
      updates['preferences.seatPreference'] = seatPreference;
    }

    if (mealPreference !== undefined) {
      const validMeals = ['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'no_meal'];
      if (!validMeals.includes(mealPreference)) {
        return next(new AppError('Tùy chọn suất ăn không hợp lệ', 400));
      }
      updates['preferences.mealPreference'] = mealPreference;
    }

    if (specialAssistance !== undefined) {
      if (!Array.isArray(specialAssistance)) {
        return next(new AppError('Yêu cầu hỗ trợ đặc biệt phải là một mảng', 400));
      }
      updates['preferences.specialAssistance'] = specialAssistance;
    }

    if (marketingConsent !== undefined) {
      if (typeof marketingConsent !== 'boolean') {
        return next(new AppError('Đồng ý tiếp thị phải là true hoặc false', 400));
      }
      updates['preferences.marketingConsent'] = marketingConsent;
    }

    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );
    } catch (error) {
      return next(new AppError('Không thể cập nhật tùy chọn. Vui lòng thử lại.', 500));
    }

    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    const response = ApiResponse.success(user.preferences, 'Cập nhật tùy chọn thành công');
    response.send(res);
  });

  // Update frequent flyer info
  static updateFrequentFlyerInfo = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { membershipNumber } = req.body;

    if (!membershipNumber) {
      return next(new AppError('Số thành viên là bắt buộc', 400));
    }

    if (typeof membershipNumber !== 'string' || membershipNumber.trim().length === 0) {
      return next(new AppError('Số thành viên không hợp lệ', 400));
    }

    // Check if membership number already exists
    const existingUser = await User.findOne({
      'frequentFlyerInfo.membershipNumber': membershipNumber.trim(),
      _id: { $ne: userId }
    });

    if (existingUser) {
      return next(new AppError('Số thành viên đã được sử dụng', 400));
    }

    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            'frequentFlyerInfo.membershipNumber': membershipNumber.trim()
          }
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      return next(new AppError('Không thể cập nhật thông tin hành khách thường xuyên. Vui lòng thử lại.', 500));
    }

    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    const response = ApiResponse.success(
      user.frequentFlyerInfo, 
      'Cập nhật thông tin hành khách thường xuyên thành công'
    );
    response.send(res);
  });

  // Deactivate account
  static deactivateAccount = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { password, reason } = req.body;

    if (!password) {
      return next(new AppError('Vui lòng nhập mật khẩu để xác nhận', 400));
    }

    const user = await User.findById(userId).select('+account.password');
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status === 'inactive') {
      return next(new AppError('Tài khoản đã bị vô hiệu hóa trước đó', 400));
    }

    if (user.status === 'deleted') {
      return next(new AppError('Tài khoản đã bị xóa', 400));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Mật khẩu không đúng', 400));
    }

    // Deactivate account
    user.status = 'inactive';
    user.metadata.deactivationReason = reason || 'User requested';
    user.metadata.deactivationDate = new Date();
    
    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể vô hiệu hóa tài khoản. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(null, 'Tài khoản đã được vô hiệu hóa');
    response.send(res);
  });

  // Delete account permanently
  static deleteAccount = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { password, confirmText } = req.body;

    if (!password || confirmText !== 'DELETE_MY_ACCOUNT') {
      return next(new AppError('Vui lòng nhập mật khẩu và xác nhận bằng cách gõ "DELETE_MY_ACCOUNT"', 400));
    }

    const user = await User.findById(userId).select('+account.password');
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status === 'deleted') {
      return next(new AppError('Tài khoản đã bị xóa trước đó', 400));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Mật khẩu không đúng', 400));
    }

    // Check for active bookings
    const Booking = require('../models/Booking');
    let activeBookings;
    try {
      activeBookings = await Booking.countDocuments({
        user: userId,
        status: { $in: ['confirmed', 'checked_in'] }
      });
    } catch (error) {
      return next(new AppError('Không thể kiểm tra trạng thái booking. Vui lòng thử lại.', 500));
    }

    if (activeBookings > 0) {
      return next(new AppError('Không thể xóa tài khoản vì còn có booking đang hoạt động', 400));
    }

    // Soft delete - change status instead of permanent deletion
    user.status = 'deleted';
    user.metadata.deletionDate = new Date();
    // Anonymize personal data
    user.personalInfo.firstName = 'Deleted';
    user.personalInfo.lastName = 'User';
    user.contactInfo.email = `deleted_${Date.now()}@deleted.com`;
    user.contactInfo.phone = '';
    user.documents = [];
    
    try {
      await user.save();
    } catch (error) {
      return next(new AppError('Không thể xóa tài khoản. Vui lòng thử lại.', 500));
    }

    const response = ApiResponse.success(null, 'Tài khoản đã được xóa');
    response.send(res);
  });

  // Upload avatar
  static uploadAvatar = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;

    if (!req.file) {
      return next(new AppError('Vui lòng chọn file ảnh', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      // Clean up uploaded file
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    try {
      // Delete old avatar if exists
      if (user.personalInfo.avatar) {
        const oldAvatarPath = path.join(__dirname, '../uploads/avatars', user.personalInfo.avatar);
        fileUploadService.deleteFile(oldAvatarPath);
      }

      // Delete old thumbnails if exist
      if (user.personalInfo.avatarThumbnails) {
        Object.values(user.personalInfo.avatarThumbnails).forEach(filename => {
          const thumbnailPath = path.join(__dirname, '../uploads/avatars', filename);
          fileUploadService.deleteFile(thumbnailPath);
        });
      }

      // Create thumbnails
      const originalPath = req.file.path;
      const thumbnails = await fileUploadService.createAvatarThumbnails(originalPath, req.file.filename);

      // Update user avatar
      user.personalInfo.avatar = req.file.filename;
      user.personalInfo.avatarThumbnails = thumbnails;
      await user.save();

      const avatarUrl = fileUploadService.getFileUrl(req.file.filename, 'avatars');
      const thumbnailUrls = {};
      
      Object.entries(thumbnails).forEach(([size, filename]) => {
        thumbnailUrls[size] = fileUploadService.getFileUrl(filename, 'avatars');
      });

      const response = ApiResponse.success({
        avatar: avatarUrl,
        thumbnails: thumbnailUrls
      }, 'Upload ảnh đại diện thành công');
      
      response.send(res);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Không thể upload ảnh đại diện. Vui lòng thử lại.', 500));
    }
  });

  // Delete avatar
  static deleteAvatar = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    if (!user.personalInfo.avatar) {
      return next(new AppError('Không có ảnh đại diện để xóa', 400));
    }

    try {
      // Delete avatar file
      const avatarPath = path.join(__dirname, '../uploads/avatars', user.personalInfo.avatar);
      fileUploadService.deleteFile(avatarPath);

      // Delete thumbnails
      if (user.personalInfo.avatarThumbnails) {
        Object.values(user.personalInfo.avatarThumbnails).forEach(filename => {
          const thumbnailPath = path.join(__dirname, '../uploads/avatars', filename);
          fileUploadService.deleteFile(thumbnailPath);
        });
      }

      // Update user
      user.personalInfo.avatar = undefined;
      user.personalInfo.avatarThumbnails = undefined;
      await user.save();

      const response = ApiResponse.success(null, 'Xóa ảnh đại diện thành công');
      response.send(res);
    } catch (error) {
      return next(new AppError('Không thể xóa ảnh đại diện. Vui lòng thử lại.', 500));
    }
  });

  // Upload document file
  static uploadDocumentFile = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!documentId) {
      // Clean up uploaded file if documentId missing
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('ID giấy tờ là bắt buộc', 400));
    }

    if (!req.file) {
      return next(new AppError('Vui lòng chọn file', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      // Clean up uploaded file if user not found
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    if (user.status !== 'active') {
      // Clean up uploaded file
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Tài khoản không hoạt động', 401));
    }

    const docIndex = user.documents.findIndex(doc => doc._id.toString() === documentId);
    if (docIndex === -1) {
      // Clean up uploaded file if document not found
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Giấy tờ không tồn tại', 404));
    }

    try {
      // Delete old file if exists
      if (user.documents[docIndex].filePath) {
        const oldFilePath = path.join(__dirname, '../uploads/documents', user.documents[docIndex].filePath);
        fileUploadService.deleteFile(oldFilePath);
      }

      // Update document with file info
      user.documents[docIndex].filePath = req.file.filename;
      user.documents[docIndex].fileOriginalName = req.file.originalname;
      user.documents[docIndex].fileSize = req.file.size;
      user.documents[docIndex].uploadedAt = new Date();
      
      await user.save();

      const fileUrl = fileUploadService.getFileUrl(req.file.filename, 'documents');

      const response = ApiResponse.success({
        document: user.documents[docIndex],
        fileUrl
      }, 'Upload file giấy tờ thành công');
      
      response.send(res);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        fileUploadService.deleteFile(req.file.path);
      }
      return next(new AppError('Không thể upload file giấy tờ. Vui lòng thử lại.', 500));
    }
  });

  // Get user statistics
  static getUserStats = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;

    // Get user basic info
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    // Get booking statistics
    const Booking = require('../models/Booking');
    let bookingStats = [];
    let recentBookings = [];

    try {
      bookingStats = await Booking.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      // Get recent bookings
      recentBookings = await Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('flight', 'flightNumber route.departure.airport route.arrival.airport')
        .select('bookingReference status totalAmount createdAt');
    } catch (error) {
      // Continue even if booking stats fail - show user info at least
      console.error('Error fetching booking stats:', error);
    }

    // Calculate profile completeness
    let completeness = 0;
    const checks = [
      user.personalInfo.firstName,
      user.personalInfo.lastName,
      user.personalInfo.dateOfBirth,
      user.contactInfo.email,
      user.contactInfo.phone,
      user.account.isEmailVerified,
      user.documents.length > 0,
      user.personalInfo.avatar
    ];
    
    completeness = (checks.filter(Boolean).length / checks.length) * 100;

    const stats = {
      profileCompleteness: Math.round(completeness),
      totalBookings: bookingStats.reduce((sum, stat) => sum + stat.count, 0),
      totalSpent: bookingStats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0),
      frequentFlyerLevel: user.frequentFlyerInfo.membershipLevel,
      totalMiles: user.frequentFlyerInfo.totalMiles,
      totalFlights: user.frequentFlyerInfo.totalFlights,
      memberSince: user.createdAt,
      lastLogin: user.account.lastLogin,
      bookingsByStatus: bookingStats,
      recentBookings
    };

    const response = ApiResponse.success(stats, 'Lấy thống kê người dùng thành công');
    response.send(res);
  });
}

module.exports = AuthController;