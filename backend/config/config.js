module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/vietjet_clone',
  
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE || 7, // days
  
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@vietjet.com',
  
  BCRYPT_SALT_ROUNDS: 12,
  PASSWORD_RESET_EXPIRE: 10 * 60 * 1000, // 10 minutes
  EMAIL_VERIFICATION_EXPIRE: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours
  
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // requests per window
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  API_VERSION: 'v1',
  API_PREFIX: '/api',
  
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  
  CACHE_TTL: 300, // 5 minutes
  
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  BOOKING_TIMEOUT: 15 * 60 * 1000, // 15 minutes to complete booking
  PAYMENT_TIMEOUT: 30 * 60 * 1000, // 30 minutes to complete payment
  
  PAYMENT_GATEWAY_URL: process.env.PAYMENT_GATEWAY_URL,
  PAYMENT_GATEWAY_KEY: process.env.PAYMENT_GATEWAY_KEY,
  
  // MoMo Payment Gateway
  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
  MOMO_ENDPOINT: process.env.MOMO_ENDPOINT,
  MOMO_RETURN_URL: process.env.MOMO_RETURN_URL,
  MOMO_NOTIFY_URL: process.env.MOMO_NOTIFY_URL,
  
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
};