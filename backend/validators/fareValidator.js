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

// Fare creation validation
const validateFareCreate = [
  body('code')
    .notEmpty()
    .withMessage('Mã giá vé là bắt buộc')
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã giá vé phải có từ 3-20 ký tự')
    .isAlphanumeric()
    .withMessage('Mã giá vé chỉ được chứa chữ và số'),
  
  body('name.vi')
    .notEmpty()
    .withMessage('Tên tiếng Việt là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Việt phải có từ 2-100 ký tự'),
  
  body('name.en')
    .notEmpty()
    .withMessage('Tên tiếng Anh là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Anh phải có từ 2-100 ký tự'),
  
  body('route')
    .notEmpty()
    .withMessage('Tuyến bay là bắt buộc')
    .isMongoId()
    .withMessage('ID tuyến bay không hợp lệ'),
  
  body('airline')
    .notEmpty()
    .withMessage('Hãng hàng không là bắt buộc')
    .isMongoId()
    .withMessage('ID hãng hàng không không hợp lệ'),
  
  body('cabinClass')
    .notEmpty()
    .withMessage('Hạng ghế là bắt buộc')
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  body('tripType')
    .notEmpty()
    .withMessage('Loại hành trình là bắt buộc')
    .isIn(['one_way', 'round_trip', 'open_jaw', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
  
  body('type')
    .optional()
    .isIn(['published', 'private', 'negotiated', 'promotional', 'group'])
    .withMessage('Loại giá vé không hợp lệ'),
  
  body('pricing.base')
    .notEmpty()
    .withMessage('Giá cơ bản là bắt buộc')
    .isNumeric()
    .withMessage('Giá cơ bản phải là số')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Giá cơ bản phải lớn hơn 0');
      }
      return true;
    }),
  
  body('pricing.currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR'])
    .withMessage('Loại tiền tệ không hợp lệ'),
  
  body('pricing.taxRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Tỷ lệ thuế phải từ 0-1'),
  
  body('pricing.fees')
    .optional()
    .isNumeric()
    .withMessage('Phí dịch vụ phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Phí dịch vụ không thể âm');
      }
      return true;
    }),
  
  body('validity.startDate')
    .notEmpty()
    .withMessage('Ngày bắt đầu hiệu lực là bắt buộc')
    .isISO8601()
    .withMessage('Ngày bắt đầu hiệu lực không hợp lệ'),
  
  body('validity.endDate')
    .notEmpty()
    .withMessage('Ngày kết thúc hiệu lực là bắt buộc')
    .isISO8601()
    .withMessage('Ngày kết thúc hiệu lực không hợp lệ')
    .custom((value, { req }) => {
      if (req.body.validity?.startDate) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.validity.startDate);
        if (endDate <= startDate) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
      }
      return true;
    }),
  
  body('bookingClasses')
    .optional()
    .isArray()
    .withMessage('Hạng đặt chỗ phải là mảng'),
  
  body('bookingClasses.*.code')
    .if(body('bookingClasses').exists())
    .notEmpty()
    .withMessage('Mã hạng đặt chỗ là bắt buộc')
    .isLength({ min: 1, max: 1 })
    .withMessage('Mã hạng đặt chỗ phải có 1 ký tự')
    .isAlpha()
    .withMessage('Mã hạng đặt chỗ phải là chữ cái'),
  
  body('bookingClasses.*.availability')
    .if(body('bookingClasses').exists())
    .optional()
    .isInt({ min: 0, max: 9 })
    .withMessage('Tình trạng còn chỗ phải từ 0-9'),
  
  body('bookingClasses.*.price')
    .if(body('bookingClasses').exists())
    .notEmpty()
    .withMessage('Giá hạng đặt chỗ là bắt buộc')
    .isNumeric()
    .withMessage('Giá hạng đặt chỗ phải là số'),
  
  handleValidationErrors
];

// Fare update validation
const validateFareUpdate = [
  body('name.vi')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Việt phải có từ 2-100 ký tự'),
  
  body('name.en')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Anh phải có từ 2-100 ký tự'),
  
  body('cabinClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  body('tripType')
    .optional()
    .isIn(['one_way', 'round_trip', 'open_jaw', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
  
  body('type')
    .optional()
    .isIn(['published', 'private', 'negotiated', 'promotional', 'group'])
    .withMessage('Loại giá vé không hợp lệ'),
  
  body('pricing.base')
    .optional()
    .isNumeric()
    .withMessage('Giá cơ bản phải là số')
    .custom((value) => {
      if (value && value <= 0) {
        throw new Error('Giá cơ bản phải lớn hơn 0');
      }
      return true;
    }),
  
  body('pricing.currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR'])
    .withMessage('Loại tiền tệ không hợp lệ'),
  
  body('pricing.taxRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Tỷ lệ thuế phải từ 0-1'),
  
  body('pricing.fees')
    .optional()
    .isNumeric()
    .withMessage('Phí dịch vụ phải là số')
    .custom((value) => {
      if (value && value < 0) {
        throw new Error('Phí dịch vụ không thể âm');
      }
      return true;
    }),
  
  body('validity.startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu hiệu lực không hợp lệ'),
  
  body('validity.endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc hiệu lực không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'expired'])
    .withMessage('Trạng thái không hợp lệ'),
  
  handleValidationErrors
];

// Fare calculation validation
const validateFareCalculation = [
  body('routeId')
    .notEmpty()
    .withMessage('ID tuyến bay là bắt buộc')
    .isMongoId()
    .withMessage('ID tuyến bay không hợp lệ'),
  
  body('cabinClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  body('passengers.adults')
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage('Số người lớn phải từ 1-9'),
  
  body('passengers.children')
    .optional()
    .isInt({ min: 0, max: 8 })
    .withMessage('Số trẻ em phải từ 0-8'),
  
  body('passengers.infants')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Số em bé phải từ 0-4'),
  
  body('departureDate')
    .notEmpty()
    .withMessage('Ngày khởi hành là bắt buộc')
    .isISO8601()
    .withMessage('Ngày khởi hành không hợp lệ')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Ngày khởi hành không thể trong quá khứ');
      }
      return true;
    }),
  
  body('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày khứ hồi không hợp lệ')
    .custom((value, { req }) => {
      if (value && req.body.departureDate) {
        const returnDate = new Date(value);
        const departureDate = new Date(req.body.departureDate);
        if (returnDate <= departureDate) {
          throw new Error('Ngày khứ hồi phải sau ngày khởi hành');
        }
      }
      return true;
    }),
  
  body('tripType')
    .optional()
    .isIn(['one_way', 'round_trip', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
  
  body('promoCode')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã khuyến mãi phải có từ 3-20 ký tự')
    .isAlphanumeric()
    .withMessage('Mã khuyến mãi chỉ được chứa chữ và số'),
  
  handleValidationErrors
];

module.exports = {
  validateFareCreate,
  validateFareUpdate,
  validateFareCalculation
};