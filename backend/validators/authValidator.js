const { body, param, query } = require('express-validator');
const AuthUtils = require('../utils/authUtils');

// Register validation
const validateRegister = [
  body('title')
    .notEmpty()
    .withMessage('Danh xưng là bắt buộc')
    .isIn(['Mr', 'Ms', 'Mrs', 'Dr'])
    .withMessage('Danh xưng không hợp lệ'),
    
  body('firstName')
    .notEmpty()
    .withMessage('Tên là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/u)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
    
  body('lastName')
    .notEmpty()
    .withMessage('Họ là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/u)
    .withMessage('Họ chỉ được chứa chữ cái và khoảng trắng'),
    
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Ngày sinh là bắt buộc')
    .isISO8601()
    .withMessage('Ngày sinh không đúng định dạng')
    .custom((value) => {
      const age = AuthUtils.calculateAge(value);
      if (age < 18) {
        throw new Error('Bạn phải từ 18 tuổi trở lên');
      }
      if (age > 120) {
        throw new Error('Ngày sinh không hợp lệ');
      }
      return true;
    }),
    
  body('gender')
    .notEmpty()
    .withMessage('Giới tính là bắt buộc')
    .isIn(['male', 'female', 'other'])
    .withMessage('Giới tính không hợp lệ'),
    
  body('nationality')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Quốc tịch phải từ 2-50 ký tự'),
    
  body('email')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('phone')
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .custom((value) => {
      if (!AuthUtils.isValidPhone(value)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
      return true;
    }),
    
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    
  body('confirmPassword')
    .notEmpty()
    .withMessage('Xác nhận mật khẩu là bắt buộc')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
];

// Login validation
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me phải là boolean')
];

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
];

// Reset password validation
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token là bắt buộc')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token không hợp lệ'),
    
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    
  body('confirmPassword')
    .notEmpty()
    .withMessage('Xác nhận mật khẩu là bắt buộc')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại là bắt buộc'),
    
  body('newPassword')
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
      }
      return true;
    }),
    
  body('confirmPassword')
    .notEmpty()
    .withMessage('Xác nhận mật khẩu là bắt buộc')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
];

// Refresh token validation
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token là bắt buộc')
];

// Resend verification email validation
const validateResendVerificationEmail = [
  body('email')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
];

// Verify email validation
const validateVerifyEmail = [
  param('token')
    .notEmpty()
    .withMessage('Token là bắt buộc')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token không hợp lệ')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateRefreshToken,
  validateResendVerificationEmail,
  validateVerifyEmail
};