const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

// Booking creation validation
const validateBookingCreate = [
  body('flights')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất một chuyến bay'),
  
  body('flights.*.flightId')
    .notEmpty()
    .withMessage('ID chuyến bay là bắt buộc')
    .isMongoId()
    .withMessage('ID chuyến bay không hợp lệ'),
  
  body('flights.*.seatClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  body('passengers')
    .isArray({ min: 1 })
    .withMessage('Phải có ít nhất một hành khách'),
  
  body('passengers.*.title')
    .notEmpty()
    .withMessage('Danh xưng hành khách là bắt buộc')
    .isIn(['Mr', 'Ms', 'Mrs', 'Dr'])
    .withMessage('Danh xưng không hợp lệ'),
  
  body('passengers.*.firstName')
    .notEmpty()
    .withMessage('Tên hành khách là bắt buộc')
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên phải có từ 1-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
  
  body('passengers.*.lastName')
    .notEmpty()
    .withMessage('Họ hành khách là bắt buộc')
    .isLength({ min: 1, max: 50 })
    .withMessage('Họ phải có từ 1-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Họ chỉ được chứa chữ cái và khoảng trắng'),
  
  body('passengers.*.dateOfBirth')
    .notEmpty()
    .withMessage('Ngày sinh là bắt buộc')
    .isISO8601()
    .withMessage('Ngày sinh không hợp lệ')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        throw new Error('Ngày sinh phải trong quá khứ');
      }
      return true;
    }),
  
  body('passengers.*.gender')
    .notEmpty()
    .withMessage('Giới tính là bắt buộc')
    .isIn(['male', 'female'])
    .withMessage('Giới tính không hợp lệ'),
  
  body('passengers.*.nationality')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Quốc tịch không hợp lệ'),
  
  body('passengers.*.document.type')
    .notEmpty()
    .withMessage('Loại giấy tờ là bắt buộc')
    .isIn(['passport', 'national_id'])
    .withMessage('Loại giấy tờ không hợp lệ'),
  
  body('passengers.*.document.number')
    .notEmpty()
    .withMessage('Số giấy tờ là bắt buộc')
    .isLength({ min: 6, max: 20 })
    .withMessage('Số giấy tờ phải có từ 6-20 ký tự'),
  
  body('passengers.*.document.expiryDate')
    .notEmpty()
    .withMessage('Ngày hết hạn giấy tờ là bắt buộc')
    .isISO8601()
    .withMessage('Ngày hết hạn không hợp lệ')
    .custom((value) => {
      const expiryDate = new Date(value);
      const today = new Date();
      if (expiryDate <= today) {
        throw new Error('Giấy tờ đã hết hạn');
      }
      return true;
    }),
  
  body('passengers.*.document.issuedCountry')
    .notEmpty()
    .withMessage('Quốc gia cấp giấy tờ là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Quốc gia cấp giấy tờ không hợp lệ'),
  
  body('contactInfo.email')
    .notEmpty()
    .withMessage('Email liên lạc là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('contactInfo.phone')
    .notEmpty()
    .withMessage('Số điện thoại liên lạc là bắt buộc')
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('contactInfo.firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên người liên lạc không hợp lệ'),
  
  body('contactInfo.lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Họ người liên lạc không hợp lệ'),
  
  body('services.baggage.additionalWeight')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Trọng lượng hành lý bổ sung phải từ 0-50kg'),
  
  body('services.meal')
    .optional()
    .isBoolean()
    .withMessage('Dịch vụ ăn uống phải là true/false'),
  
  body('services.seat')
    .optional()
    .isBoolean()
    .withMessage('Dịch vụ chọn ghế phải là true/false'),
  
  handleValidationErrors
];

// Booking update validation
const validateBookingUpdate = [
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('contactInfo.phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  
  body('passengers.*.services.meal')
    .optional()
    .isBoolean()
    .withMessage('Dịch vụ ăn uống phải là true/false'),
  
  body('passengers.*.services.seat')
    .optional()
    .isBoolean()
    .withMessage('Dịch vụ chọn ghế phải là true/false'),
  
  handleValidationErrors
];

// Booking cancellation validation
const validateBookingCancel = [
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Lý do hủy phải có từ 5-200 ký tự'),
  
  handleValidationErrors
];

// Booking search validation
const validateBookingSearch = [
  body('reference')
    .notEmpty()
    .withMessage('Mã đặt chỗ là bắt buộc')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã đặt chỗ phải có 6 ký tự')
    .isAlphanumeric()
    .withMessage('Mã đặt chỗ chỉ được chứa chữ và số'),
  
  body('email')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  handleValidationErrors
];

module.exports = {
  validateBookingCreate,
  validateBookingUpdate,
  validateBookingCancel,
  validateBookingSearch
};