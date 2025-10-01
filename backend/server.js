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
  configureSameSiteCookies,
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

// MongoDB injection protection
app.use(mongoSanitization);

// XSS protection
app.use(xssProtection);

// HTTP Parameter Pollution protection
app.use(parameterPollutionProtection);

// CORS Configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'CSRF-Token', 'X-CSRF-Token']
}));

// Rate Limiting - Apply to all requests
app.use(apiLimiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CSRF Protection (conditional - skip for certain routes)
const skipCSRFRoutes = [
  '/api/csrf-token',
  '/api/auth/login',
  '/api/auth/register',
  '/api/bookings/search',
  '/api/flights/search'
];
app.use(conditionalCSRF(skipCSRFRoutes));

// CSRF Error Handler
app.use(csrfErrorHandler);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CSRF Token endpoint
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({
    success: true,
    csrfToken: res.locals.csrfToken,
    message: 'CSRF token generated'
  });
});

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
      twoFactorAuth: `${config.API_PREFIX}/2fa`
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