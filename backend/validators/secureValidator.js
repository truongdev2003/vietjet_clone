const { body, query, param, validationResult } = require('express-validator');
const xss = require('xss');
const { securityLogger } = require('../middleware/security');

// XSS Sanitization function
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  return xss(value, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    css: false
  });
};

// SQL Injection patterns to detect
const sqlInjectionPatterns = [
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/i,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
  /(--|#|\/\*|\*\/)/,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bINSERT\b.*\bINTO\b)/i,
  /(\bDELETE\b.*\bFROM\b)/i,
  /(\bUPDATE\b.*\bSET\b)/i
];

// NoSQL Injection patterns
const noSqlInjectionPatterns = [
  /\$where/i,
  /\$regex/i,
  /\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin/i,
  /\$or|\$and|\$not|\$nor/i,
  /\$exists|\$type|\$mod|\$all|\$size/i,
  /\$eval|\$expr/i
];

// Check for injection patterns
const detectInjection = (value, patterns, type) => {
  if (typeof value !== 'string') return false;
  
  return patterns.some(pattern => {
    const match = pattern.test(value);
    if (match) {
      securityLogger.warn(`${type} injection pattern detected`, {
        value: value.substring(0, 100) + '...',
        pattern: pattern.source
      });
    }
    return match;
  });
};

// Custom validator for SQL injection
const noSqlInjection = (value, { req }) => {
  if (detectInjection(value, sqlInjectionPatterns, 'SQL')) {
    throw new Error('Dữ liệu nhập vào không hợp lệ');
  }
  if (detectInjection(value, noSqlInjectionPatterns, 'NoSQL')) {
    throw new Error('Dữ liệu nhập vào không hợp lệ');
  }
  return true;
};

// Custom validator for XSS
const noXSS = (value, { req }) => {
  if (typeof value === 'string') {
    const sanitized = sanitizeInput(value);
    if (sanitized !== value) {
      securityLogger.warn('XSS attempt detected', {
        original: value.substring(0, 100) + '...',
        sanitized: sanitized.substring(0, 100) + '...',
        ip: req?.ip,
        userAgent: req?.get('User-Agent')
      });
      throw new Error('Dữ liệu chứa nội dung không an toàn');
    }
  }
  return true;
};

// Enhanced Email Validator
const secureEmail = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .custom(noXSS)
    .custom(noSqlInjection)
    .isLength({ max: 254 })
    .withMessage('Email quá dài')
];

// Enhanced Password Validator
const securePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Mật khẩu phải từ 8-128 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt')
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced Text Input Validator
const secureText = (field, options = {}) => [
  body(field)
    .trim()
    .isLength({ 
      min: options.min || 1, 
      max: options.max || 255 
    })
    .withMessage(`${field} phải từ ${options.min || 1}-${options.max || 255} ký tự`)
    .custom(noXSS)
    .custom(noSqlInjection)
    .matches(/^[a-zA-ZÀ-ỹ0-9\s\-_.@]+$/)
    .withMessage(`${field} chứa ký tự không được phép`)
];

// Enhanced Phone Validator
const securePhone = [
  body('phone')
    .matches(/^[+]?[0-9\s\-()]{10,15}$/)
    .withMessage('Số điện thoại không hợp lệ')
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced ID Validator (MongoDB ObjectId)
const secureObjectId = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`${field} không hợp lệ`)
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced Query Parameter Validator
const secureQuery = (field, options = {}) => [
  query(field)
    .optional()
    .trim()
    .isLength({ max: options.max || 100 })
    .withMessage(`${field} quá dài`)
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced Booking Reference Validator
const secureBookingReference = [
  body('reference')
    .matches(/^[A-Z0-9]{6}$/)
    .withMessage('Mã booking phải có 6 ký tự chữ hoa và số')
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced Date Validator
const secureDate = (field) => [
  body(field)
    .isISO8601()
    .withMessage(`${field} phải có định dạng ngày hợp lệ`)
    .custom(noXSS)
    .custom(noSqlInjection)
];

// Enhanced Number Validator
const secureNumber = (field, options = {}) => [
  body(field)
    .isNumeric()
    .withMessage(`${field} phải là số`)
    .isFloat({ 
      min: options.min || 0, 
      max: options.max || Number.MAX_SAFE_INTEGER 
    })
    .withMessage(`${field} phải trong khoảng ${options.min || 0}-${options.max || 'không giới hạn'}`)
    .custom(noSqlInjection)
];

// Validation Error Handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: typeof error.value === 'string' ? 
             error.value.substring(0, 50) + '...' : 
             error.value
    }));
    
    securityLogger.warn('Validation errors detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      errors: errorDetails
    });
    
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ',
      details: errorDetails.map(e => ({ field: e.field, message: e.message }))
    });
  }
  
  next();
};

// Sanitize Request Body
const sanitizeRequestBody = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'string') {
          obj[index] = sanitizeInput(item);
        } else if (typeof item === 'object') {
          sanitizeObject(item);
        }
      });
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  
  next();
};

// File Upload Security Validator
const secureFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) return next();
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      securityLogger.warn('Invalid file type upload attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        allowedTypes
      });
      return res.status(400).json({
        error: 'Loại file không được phép'
      });
    }
    
    // Check file size
    if (req.file.size > maxSize) {
      securityLogger.warn('Large file upload attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        filename: req.file.originalname,
        size: req.file.size,
        maxSize
      });
      return res.status(400).json({
        error: `File quá lớn. Kích thước tối đa: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    
    // Sanitize filename
    req.file.originalname = sanitizeInput(req.file.originalname);
    
    next();
  };
};

module.exports = {
  secureEmail,
  securePassword,
  secureText,
  securePhone,
  secureObjectId,
  secureQuery,
  secureBookingReference,
  secureDate,
  secureNumber,
  handleValidationErrors,
  sanitizeRequestBody,
  secureFileUpload,
  noXSS,
  noSqlInjection,
  sanitizeInput
};