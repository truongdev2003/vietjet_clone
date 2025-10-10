const { body, query, param } = require('express-validator');
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

// Flight search validation - supports both GET (query) and POST (body)
const validateFlightSearch = [
  // Check both query and body for 'from' parameter
  query('from')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Mã sân bay khởi hành phải có ít nhất 2 ký tự'),
  
  body('from')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Mã sân bay khởi hành phải có ít nhất 2 ký tự'),
  
  // Check both query and body for 'to' parameter
  query('to')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Mã sân bay đến phải có ít nhất 2 ký tự'),
  
  body('to')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Mã sân bay đến phải có ít nhất 2 ký tự'),
  
  // Check both query and body for 'departureDate' parameter
  query('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày khởi hành không hợp lệ')
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Ngày khởi hành không thể trong quá khứ');
      }
      return true;
    }),
  
  body('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày khởi hành không hợp lệ')
    .custom((value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Ngày khởi hành không thể trong quá khứ');
      }
      return true;
    }),
  
  // Check both query and body for 'returnDate' parameter
  query('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày khứ hồi không hợp lệ')
    .custom((value, { req }) => {
      if (value && (req.query.departureDate || req.body.departureDate)) {
        const returnDate = new Date(value);
        const departureDate = new Date(req.query.departureDate || req.body.departureDate);
        if (returnDate <= departureDate) {
          throw new Error('Ngày khứ hồi phải sau ngày khởi hành');
        }
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
  
  // Passengers validation
  query('passengers')
    .optional(),
  
  body('passengers.adults')
    .optional()
    .isInt({ min: 1, max: 9 })
    .withMessage('Số người lớn phải từ 1 đến 9'),
  
  body('passengers.children')
    .optional()
    .isInt({ min: 0, max: 8 })
    .withMessage('Số trẻ em phải từ 0 đến 8'),
  
  body('passengers.infants')
    .optional()
    .isInt({ min: 0, max: 4 })
    .withMessage('Số em bé phải từ 0 đến 4'),
  
  // Seat class validation
  query('seatClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
    
  body('seatClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  // Trip type validation
  query('tripType')
    .optional()
    .isIn(['one-way', 'round-trip', 'one_way', 'round_trip', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
    
  body('tripType')
    .optional()
    .isIn(['one_way', 'round_trip', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
  
  // Custom validation to ensure required fields are present in either query or body
  (req, res, next) => {
    const from = req.query.from || req.body.from;
    const to = req.query.to || req.body.to;
    const departureDate = req.query.departureDate || req.body.departureDate;
    
    if (!from) {
      return next(new AppError('Điểm khởi hành là bắt buộc', 400));
    }
    if (!to) {
      return next(new AppError('Điểm đến là bắt buộc', 400));
    }
    if (!departureDate) {
      return next(new AppError('Ngày khởi hành là bắt buộc', 400));
    }
    
    next();
  },
  
  handleValidationErrors
];

// Flight creation validation
const validateFlightCreate = [
  body('flightNumber')
    .notEmpty()
    .withMessage('Số hiệu chuyến bay là bắt buộc')
    .matches(/^[A-Z]{2}\d{1,4}$/)
    .withMessage('Số hiệu chuyến bay không hợp lệ (VD: VJ123)'),
  
  body('route.departure.airport')
    .notEmpty()
    .withMessage('Sân bay khởi hành là bắt buộc')
    .isMongoId()
    .withMessage('ID sân bay khởi hành không hợp lệ'),
  
  body('route.arrival.airport')
    .notEmpty()
    .withMessage('Sân bay đến là bắt buộc')
    .isMongoId()
    .withMessage('ID sân bay đến không hợp lệ'),
  
  body('route.departure.time')
    .notEmpty()
    .withMessage('Thời gian khởi hành là bắt buộc')
    .isISO8601()
    .withMessage('Thời gian khởi hành không hợp lệ'),
  
  body('route.arrival.time')
    .notEmpty()
    .withMessage('Thời gian đến là bắt buộc')
    .isISO8601()
    .withMessage('Thời gian đến không hợp lệ')
    .custom((value, { req }) => {
      if (req.body.route?.departure?.time) {
        const arrivalTime = new Date(value);
        const departureTime = new Date(req.body.route.departure.time);
        if (arrivalTime <= departureTime) {
          throw new Error('Thời gian đến phải sau thời gian khởi hành');
        }
      }
      return true;
    }),
  
  body('aircraft.type')
    .notEmpty()
    .withMessage('Loại máy bay là bắt buộc')
    .isString()
    .withMessage('Loại máy bay phải là chuỗi ký tự')
    .isLength({ min: 3, max: 100 })
    .withMessage('Loại máy bay phải từ 3 đến 100 ký tự'),

  body('aircraft.registration')
    .optional()
    .isString()
    .withMessage('Số đăng ký máy bay phải là chuỗi ký tự'),
  
  body('route.distance')
    .notEmpty()
    .withMessage('Khoảng cách là bắt buộc')
    .isNumeric()
    .withMessage('Khoảng cách phải là số'),
  
  body('route.duration.scheduled')
    .notEmpty()
    .withMessage('Thời gian bay dự kiến là bắt buộc')
    .isInt({ min: 30 })
    .withMessage('Thời gian bay phải ít nhất 30 phút'),
  
  handleValidationErrors
];

// Flight update validation
const validateFlightUpdate = [
  body('flightNumber')
    .optional()
    .matches(/^[A-Z]{2}\d{1,4}$/)
    .withMessage('Số hiệu chuyến bay không hợp lệ'),
  
  body('route.departure.time')
    .optional()
    .isISO8601()
    .withMessage('Thời gian khởi hành không hợp lệ'),
  
  body('route.arrival.time')
    .optional()
    .isISO8601()
    .withMessage('Thời gian đến không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'boarding', 'departed', 'in_flight', 'arrived', 'delayed', 'cancelled'])
    .withMessage('Trạng thái chuyến bay không hợp lệ'),
  
  handleValidationErrors
];

module.exports = {
  validateFlightSearch,
  validateFlightCreate,
  validateFlightUpdate
};