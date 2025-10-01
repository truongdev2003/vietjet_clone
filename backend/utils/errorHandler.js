const ApiResponse = require('./apiResponse');
const winston = require('winston');

// Security Logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vietjet-security' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});

// Async handler to catch errors in async functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Sanitize error message for production
const sanitizeErrorMessage = (message, statusCode) => {
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal errors in production
    if (statusCode >= 500) {
      return 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';
    }
    
    // Sanitize sensitive information
    const sensitivePatterns = [
      /password/gi,
      /secret/gi,
      /token/gi,
      /key/gi,
      /auth/gi,
      /mongodb/gi,
      /database/gi,
      /connection/gi,
      /server/gi,
      /internal/gi
    ];
    
    let sanitized = message;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }
  
  return message;
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error with security context
  const errorLog = {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    isOperational: err.isOperational,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || req.userId || 'anonymous',
    timestamp: new Date().toISOString()
  };

  if (err.statusCode >= 500 || !err.isOperational) {
    securityLogger.error('Application Error', errorLog);
  } else {
    securityLogger.warn('Client Error', errorLog);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Dữ liệu không hợp lệ';
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    let message = 'Dữ liệu đã tồn tại';
    
    // Friendly messages for common fields
    const fieldMessages = {
      email: 'Email đã được sử dụng',
      phone: 'Số điện thoại đã được sử dụng',
      username: 'Tên đăng nhập đã được sử dụng',
      bookingReference: 'Mã booking đã tồn tại'
    };
    
    if (fieldMessages[field]) {
      message = fieldMessages[field];
    }
    
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => {
      // Sanitize validation messages
      let message = val.message;
      if (message.includes('Path')) {
        message = 'Dữ liệu không hợp lệ';
      }
      return message;
    });
    error = new AppError(messages.join(', '), 400);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token không hợp lệ';
    error = new AppError(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token đã hết hạn';
    error = new AppError(message, 401);
  }

  // MongoDB connection error
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Lỗi kết nối cơ sở dữ liệu';
    error = new AppError(message, 500, false);
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = 'Quá nhiều requests. Vui lòng thử lại sau.';
    error = new AppError(message, 429);
  }

  // File upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File quá lớn';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Loại file không được phép';
    error = new AppError(message, 400);
  }

  // CSRF error
  if (err.code === 'EBADCSRFTOKEN') {
    const message = 'Token bảo mật không hợp lệ';
    error = new AppError(message, 403);
  }

  // Handle operational errors
  if (error.isOperational) {
    const sanitizedMessage = sanitizeErrorMessage(error.message, error.statusCode);
    return res.status(error.statusCode).json(
      ApiResponse.error(sanitizedMessage, error.statusCode, {
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err.stack,
          details: err
        })
      })
    );
  }

  // Programming or unknown errors - don't leak error details
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
    : error.message;

  res.status(statusCode).json(
    ApiResponse.error(message, statusCode, {
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err
      })
    })
  );
};

// 404 handler
const notFound = (req, res, next) => {
  securityLogger.warn('404 Not Found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  const response = ApiResponse.notFound(`Route ${req.originalUrl} not found`);
  response.send(res);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  securityLogger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
    promise: promise
  });
  
  // Close server gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  securityLogger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server gracefully
  process.exit(1);
});

module.exports = {
  asyncHandler,
  AppError,
  globalErrorHandler,
  notFound,
  sanitizeErrorMessage,
  securityLogger
};