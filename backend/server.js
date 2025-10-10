const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const config = require('./config/config');

// Import security middleware
const {
  securityHeaders,
  xssProtection,
  mongoSanitization,
  parameterPollutionProtection,
  requestSizeLimit,
  apiLimiter,
  speedLimiter,
  securityLogger
} = require('./middleware/security');

const {
  csrfProtection,
  generateCSRFToken,
  csrfErrorHandler,
  doubleSubmitCookie,
  configureSameSiteCookies,
  getCSRFToken,
  conditionalCSRF
} = require('./middleware/csrf');

// Import middleware
const { globalErrorHandler, notFound } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');
const airportRoutes = require('./routes/airports');
const paymentRoutes = require('./routes/payments');
const fareRoutes = require('./routes/fares');
const notificationRoutes = require('./routes/notifications');
const seatRoutes = require('./routes/seats');
const checkinRoutes = require('./routes/checkin');
const paymentGatewayRoutes = require('./routes/payment-gateway');
const adminRoutes = require('./routes/admin');
const twoFactorAuthRoutes = require('./routes/twoFactorAuth');
const bannerRoutes = require('./routes/banners');
const promoRoutes = require('./routes/promo');
 
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Security Headers
app.use(securityHeaders);

// Configure secure cookies
app.use(configureSameSiteCookies);

// Cookie parser
app.use(cookieParser());

// Request size limiting
app.use(requestSizeLimit);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Parse allowed origins from config (can be comma-separated)
    const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim());
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'CSRF-Token', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Rate Limiting - Apply to all requests
app.use(apiLimiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection protection (PHẢI SAU body parser)
app.use(mongoSanitization);

// XSS protection
app.use(xssProtection);

// HTTP Parameter Pollution protection
app.use(parameterPollutionProtection);

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CSRF Token endpoint - MUST be BEFORE CSRF middleware
app.get('/api/csrf-token', (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    
    // Set CSRF token in cookie
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
      maxAge: 3600000 // 1 hour
    });
    
    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token'
    });
  }
});

// Custom CSRF Protection using double-submit cookie pattern
const customCSRFProtection = (req, res, next) => {
  // Skip CSRF check for these routes
  const skipRoutes = [
    '/api/csrf-token',
    '/api/auth/login',
    '/api/auth/register',
    '/api/bookings/search',
    '/api/flights/search'
  ];
  
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Check if route should be skipped
  if (skipRoutes.some(route => req.path === route)) {
    return next();
  }
  
  // Apply double-submit cookie verification
  return doubleSubmitCookie.verify(req, res, next);
};

app.use(customCSRFProtection);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    security: {
      https: req.secure,
      csrf: !!req.csrfToken
    }
  });
});

// API Routes
app.use(`${config.API_PREFIX}/auth`, authRoutes);
app.use(`${config.API_PREFIX}/flights`, flightRoutes);
app.use(`${config.API_PREFIX}/bookings`, bookingRoutes);
app.use(`${config.API_PREFIX}/airports`, airportRoutes);
app.use(`${config.API_PREFIX}/payments`, paymentRoutes);
app.use(`${config.API_PREFIX}/fares`, fareRoutes);
app.use(`${config.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${config.API_PREFIX}/seats`, seatRoutes);
app.use(`${config.API_PREFIX}/checkin`, checkinRoutes);
app.use(`${config.API_PREFIX}/payment-gateway`, paymentGatewayRoutes);
app.use(`${config.API_PREFIX}/admin`, adminRoutes);
app.use(`${config.API_PREFIX}/2fa`, twoFactorAuthRoutes);
app.use(`${config.API_PREFIX}/banners`, bannerRoutes);
app.use(`${config.API_PREFIX}/promo`, promoRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to VietJet Clone API',
    version: '1.0.0',
    documentation: '/api/docs',
    security: {
      csrf: process.env.NODE_ENV === 'production' ? 'enabled' : 'development',
      rateLimit: 'enabled',
      xssProtection: 'enabled',
      helmet: 'enabled'
    },
    endpoints: {
      auth: `${config.API_PREFIX}/auth`,
      flights: `${config.API_PREFIX}/flights`,
      bookings: `${config.API_PREFIX}/bookings`,
      airports: `${config.API_PREFIX}/airports`,
      payments: `${config.API_PREFIX}/payments`,
      fares: `${config.API_PREFIX}/fares`,
      notifications: `${config.API_PREFIX}/notifications`,
      seats: `${config.API_PREFIX}/seats`,
      checkin: `${config.API_PREFIX}/checkin`,
      paymentGateway: `${config.API_PREFIX}/payment-gateway`,
      admin: `${config.API_PREFIX}/admin`,
      twoFactorAuth: `${config.API_PREFIX}/2fa`,
      promo: `${config.API_PREFIX}/promo`
    }
  });
});

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running in ${config.NODE_ENV} mode
🌐 URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
📖 API Documentation: http://localhost:${PORT}/api/docs
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception thrown:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received');
  console.log('💤 Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated');
  });
});

module.exports = app;