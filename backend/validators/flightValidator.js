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

// Flight search validation
const validateFlightSearch = [
  body('from')
    .notEmpty()
    .withMessage('Điểm khởi hành là bắt buộc')
    .isLength({ min: 2 })
    .withMessage('Mã sân bay phải có ít nhất 2 ký tự'),
  
  body('to')
    .notEmpty()
    .withMessage('Điểm đến là bắt buộc')
    .isLength({ min: 2 })
    .withMessage('Mã sân bay phải có ít nhất 2 ký tự'),
  
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
  
  body('seatClass')
    .optional()
    .isIn(['economy', 'premium_economy', 'business', 'first'])
    .withMessage('Hạng ghế không hợp lệ'),
  
  body('tripType')
    .optional()
    .isIn(['one_way', 'round_trip', 'multi_city'])
    .withMessage('Loại hành trình không hợp lệ'),
  
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
    .isIn(['Airbus A320', 'Airbus A321', 'Boeing 737', 'Boeing 787', 'ATR 72'])
    .withMessage('Loại máy bay không hợp lệ'),
  
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