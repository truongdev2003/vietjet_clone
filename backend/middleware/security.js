const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const xss = require("xss");
const winston = require("winston");

const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "vietjet-security" },
  transports: [
    new winston.transports.File({
      filename: "logs/security-error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "logs/security-combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const xssProtection = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          obj[key] = xss(obj[key], {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ["script"],
          });
        } else if (typeof obj[key] === "object") {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    securityLogger.warn("Login brute force attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    });
    res.status(options.statusCode).json(options.message);
  },
});

const adminLoginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  message: {
    error: "Quá nhiều lần đăng nhập admin sai. Vui lòng thử lại sau 30 phút.",
    retryAfter: "30 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    securityLogger.error("Admin login brute force attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      body: req.body ? Object.keys(req.body) : [],
    });
    res.status(options.statusCode).json(options.message);
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Quá nhiều requests. Vui lòng thử lại sau.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    securityLogger.warn("API rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    });
    res.status(options.statusCode).json(options.message);
  },
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: "Quá nhiều lần đặt vé. Vui lòng thử lại sau 1 tiếng.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    securityLogger.warn("Booking rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      contactInfo: req.body?.contactInfo?.email || "unknown",
    });
    res.status(options.statusCode).json(options.message);
  },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 100,
  maxDelayMs: 2000,
  validate: {
    delayMs: false,
  },
});

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

const mongoSanitization = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    securityLogger.warn("MongoDB injection attempt detected", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      suspiciousKey: key,
    });
  },
});

const parameterPollutionProtection = hpp({
  whitelist: ["sort", "fields", "page", "limit", "filters"],
});

const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get("content-length"));
  const maxSize = 10 * 1024 * 1024;

  if (contentLength > maxSize) {
    securityLogger.warn("Large request detected", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
      contentLength,
    });
    return res.status(413).json({
      error: "Request quá lớn. Kích thước tối đa cho phép là 10MB.",
    });
  }
  next();
};

const adminIPWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ADMIN_WHITELIST_IPS
    ? process.env.ADMIN_WHITELIST_IPS.split(",")
    : [];

  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip)) {
    securityLogger.error("Unauthorized admin IP access attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    });
    return res.status(403).json({
      error: "Truy cập bị từ chối. IP không được phép.",
    });
  }
  next();
};

const logSecurityEvent = (eventType, details) => {
  securityLogger.info(`Security Event: ${eventType}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  securityHeaders,
  xssProtection,
  mongoSanitization,
  parameterPollutionProtection,
  requestSizeLimit,
  loginLimiter,
  adminLoginLimiter,
  apiLimiter,
  bookingLimiter,
  speedLimiter,
  adminIPWhitelist,
  logSecurityEvent,
  securityLogger,
};
