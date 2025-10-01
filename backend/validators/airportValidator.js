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

// Airport creation validation
const validateAirportCreate = [
  body('code.iata')
    .notEmpty()
    .withMessage('Mã IATA là bắt buộc')
    .isLength({ min: 3, max: 3 })
    .withMessage('Mã IATA phải có 3 ký tự')
    .isAlpha()
    .withMessage('Mã IATA chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('code.icao')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Mã ICAO phải có 4 ký tự')
    .isAlpha()
    .withMessage('Mã ICAO chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('name.en')
    .notEmpty()
    .withMessage('Tên tiếng Anh là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Anh phải có từ 2-100 ký tự'),
  
  body('name.vi')
    .notEmpty()
    .withMessage('Tên tiếng Việt là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Việt phải có từ 2-100 ký tự'),
  
  body('location.city.en')
    .notEmpty()
    .withMessage('Tên thành phố tiếng Anh là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố tiếng Anh phải có từ 2-50 ký tự'),
  
  body('location.city.vi')
    .notEmpty()
    .withMessage('Tên thành phố tiếng Việt là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố tiếng Việt phải có từ 2-50 ký tự'),
  
  body('location.country.en')
    .notEmpty()
    .withMessage('Tên quốc gia tiếng Anh là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên quốc gia tiếng Anh phải có từ 2-50 ký tự'),
  
  body('location.country.vi')
    .notEmpty()
    .withMessage('Tên quốc gia tiếng Việt là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên quốc gia tiếng Việt phải có từ 2-50 ký tự'),
  
  body('location.country.code')
    .notEmpty()
    .withMessage('Mã quốc gia là bắt buộc')
    .isLength({ min: 2, max: 2 })
    .withMessage('Mã quốc gia phải có 2 ký tự')
    .isAlpha()
    .withMessage('Mã quốc gia chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ phải từ -90 đến 90'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ phải từ -180 đến 180'),
  
  body('type')
    .optional()
    .isIn(['international', 'domestic', 'regional', 'military', 'private'])
    .withMessage('Loại sân bay không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'under_construction', 'closed'])
    .withMessage('Trạng thái sân bay không hợp lệ'),
  
  body('timezone')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Múi giờ không hợp lệ'),
  
  body('elevation')
    .optional()
    .isInt({ min: -500, max: 10000 })
    .withMessage('Độ cao phải từ -500 đến 10000 mét'),
  
  handleValidationErrors
];

// Airport update validation
const validateAirportUpdate = [
  body('code.iata')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Mã IATA phải có 3 ký tự')
    .isAlpha()
    .withMessage('Mã IATA chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('code.icao')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Mã ICAO phải có 4 ký tự')
    .isAlpha()
    .withMessage('Mã ICAO chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('name.en')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Anh phải có từ 2-100 ký tự'),
  
  body('name.vi')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên tiếng Việt phải có từ 2-100 ký tự'),
  
  body('location.city.en')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố tiếng Anh phải có từ 2-50 ký tự'),
  
  body('location.city.vi')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên thành phố tiếng Việt phải có từ 2-50 ký tự'),
  
  body('location.country.code')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Mã quốc gia phải có 2 ký tự')
    .isAlpha()
    .withMessage('Mã quốc gia chỉ được chứa chữ cái')
    .toUpperCase(),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Vĩ độ phải từ -90 đến 90'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Kinh độ phải từ -180 đến 180'),
  
  body('type')
    .optional()
    .isIn(['international', 'domestic', 'regional', 'military', 'private'])
    .withMessage('Loại sân bay không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'under_construction', 'closed'])
    .withMessage('Trạng thái sân bay không hợp lệ'),
  
  body('timezone')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Múi giờ không hợp lệ'),
  
  body('elevation')
    .optional()
    .isInt({ min: -500, max: 10000 })
    .withMessage('Độ cao phải từ -500 đến 10000 mét'),
  
  handleValidationErrors
];

module.exports = {
  validateAirportCreate,
  validateAirportUpdate
};