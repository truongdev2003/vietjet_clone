const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validate promo code validation request
exports.validatePromoCodeRequest = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã khuyến mãi là bắt buộc')
    .isLength({ min: 4, max: 20 }).withMessage('Mã khuyến mãi phải từ 4-20 ký tự')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã khuyến mãi chỉ được chứa chữ in hoa và số'),

  body('amount')
    .notEmpty().withMessage('Số tiền là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Số tiền phải là số dương'),

  body('userId')
    .optional()
    .isMongoId().withMessage('User ID không hợp lệ'),

  body('routeId')
    .optional()
    .isMongoId().withMessage('Route ID không hợp lệ'),

  body('airlineId')
    .optional()
    .isMongoId().withMessage('Airline ID không hợp lệ'),

  validate
];

// Validate apply promo code request
exports.validateApplyPromoCode = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã khuyến mãi là bắt buộc')
    .isLength({ min: 4, max: 20 }).withMessage('Mã khuyến mãi phải từ 4-20 ký tự'),

  body('bookingId')
    .notEmpty().withMessage('Booking ID là bắt buộc')
    .isMongoId().withMessage('Booking ID không hợp lệ'),

  body('userId')
    .optional()
    .isMongoId().withMessage('User ID không hợp lệ'),

  validate
];

// Validate create promo code (Admin)
exports.validateCreatePromoCode = [
  body('code')
    .trim()
    .notEmpty().withMessage('Mã khuyến mãi là bắt buộc')
    .isLength({ min: 4, max: 20 }).withMessage('Mã khuyến mãi phải từ 4-20 ký tự')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã khuyến mãi chỉ được chứa chữ in hoa và số'),

  body('description')
    .trim()
    .notEmpty().withMessage('Mô tả là bắt buộc')
    .isLength({ min: 10, max: 500 }).withMessage('Mô tả phải từ 10-500 ký tự'),

  body('type')
    .notEmpty().withMessage('Loại khuyến mãi là bắt buộc')
    .isIn(['percentage', 'fixed']).withMessage('Loại khuyến mãi không hợp lệ'),

  body('value')
    .notEmpty().withMessage('Giá trị khuyến mãi là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá trị khuyến mãi phải là số dương')
    .custom((value, { req }) => {
      if (req.body.type === 'percentage' && value > 100) {
        throw new Error('Phần trăm giảm giá không được vượt quá 100');
      }
      return true;
    }),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá trị giảm tối đa phải là số dương'),

  body('minAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá trị tối thiểu phải là số dương'),

  body('validFrom')
    .notEmpty().withMessage('Ngày bắt đầu là bắt buộc')
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),

  body('validUntil')
    .notEmpty().withMessage('Ngày kết thúc là bắt buộc')
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),

  body('usageLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Giới hạn sử dụng phải là số nguyên dương'),

  body('perUserLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Giới hạn mỗi người dùng phải là số nguyên dương'),

  body('applicableRoutes')
    .optional()
    .isArray().withMessage('Danh sách routes phải là mảng')
    .custom((routes) => {
      if (routes.some(r => !r.match(/^[0-9a-fA-F]{24}$/))) {
        throw new Error('Route ID không hợp lệ');
      }
      return true;
    }),

  body('applicableAirlines')
    .optional()
    .isArray().withMessage('Danh sách airlines phải là mảng')
    .custom((airlines) => {
      if (airlines.some(a => !a.match(/^[0-9a-fA-F]{24}$/))) {
        throw new Error('Airline ID không hợp lệ');
      }
      return true;
    }),

  body('newUserOnly')
    .optional()
    .isBoolean().withMessage('newUserOnly phải là boolean'),

  body('active')
    .optional()
    .isBoolean().withMessage('active phải là boolean'),

  body('notes')
    .optional()
    .isString().withMessage('notes phải là chuỗi'),

  validate
];

// Validate update promo code (Admin)
exports.validateUpdatePromoCode = [
  param('id')
    .isMongoId().withMessage('Promo code ID không hợp lệ'),

  body('code')
    .optional()
    .trim()
    .isLength({ min: 4, max: 20 }).withMessage('Mã khuyến mãi phải từ 4-20 ký tự')
    .matches(/^[A-Z0-9]+$/).withMessage('Mã khuyến mãi chỉ được chứa chữ in hoa và số'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Mô tả phải từ 10-500 ký tự'),

  body('type')
    .optional()
    .isIn(['percentage', 'fixed']).withMessage('Loại khuyến mãi không hợp lệ'),

  body('value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá trị khuyến mãi phải là số dương')
    .custom((value, { req }) => {
      if (req.body.type === 'percentage' && value > 100) {
        throw new Error('Phần trăm giảm giá không được vượt quá 100');
      }
      return true;
    }),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá trị giảm tối đa phải là số dương'),

  body('minAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Giá trị tối thiểu phải là số dương'),

  body('validFrom')
    .optional()
    .isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),

  body('validUntil')
    .optional()
    .isISO8601().withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (req.body.validFrom && new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),

  body('usageLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Giới hạn sử dụng phải là số nguyên dương'),

  body('perUserLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Giới hạn mỗi người dùng phải là số nguyên dương'),

  body('active')
    .optional()
    .isBoolean().withMessage('active phải là boolean'),

  validate
];

// Validate get all promo codes query (Admin)
exports.validateGetAllPromoCodes = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),

  query('active')
    .optional()
    .isIn(['true', 'false']).withMessage('active phải là true hoặc false'),

  query('type')
    .optional()
    .isIn(['percentage', 'fixed']).withMessage('type không hợp lệ'),

  query('search')
    .optional()
    .isString().withMessage('search phải là chuỗi'),

  validate
];

// Validate promo code ID param
exports.validatePromoCodeId = [
  param('id')
    .isMongoId().withMessage('Promo code ID không hợp lệ'),

  validate
];
