/**
 * Backend Optimization Module
 * Thêm các tối ưu hóa cho performance cao
 */

const cluster = require('cluster');
const os = require('os');

/**
 * Setup Cluster Mode
 * Chạy multiple instances trên multiple CPU cores
 */
function setupCluster(serverFile = './server.js') {
  if (cluster.isMaster || cluster.isPrimary) {
    const numWorkers = process.env.CLUSTER_WORKERS || os.cpus().length;
    
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`📦 Starting ${numWorkers} worker processes...`);
    
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = cluster.fork();
      console.log(`   ✓ Worker ${worker.process.pid} started`);
    }
    
    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died (${signal || code})`);
      console.log('🔄 Starting a new worker...');
      const newWorker = cluster.fork();
      console.log(`   ✓ Worker ${newWorker.process.pid} started`);
    });
    
    // Handle worker online
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      
      setTimeout(() => {
        console.log('🔴 Force shutdown');
        process.exit(0);
      }, 10000);
    });
    
  } else {
    // Worker process
    require(serverFile);
    console.log(`👷 Worker ${process.pid} started`);
  }
}

/**
 * Optimize MongoDB Connection
 */
function getOptimizedMongoOptions() {
  return {
    // Connection Pool
    maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE) || 50,
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE) || 10,
    
    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    
    // Performance
    family: 4, // Use IPv4
    
    // Compression
    compressors: ['zstd', 'snappy', 'zlib'],
    
    // Write Concern (adjust based on requirements)
    w: 'majority',
    retryWrites: true,
    
    // Read Preference
    readPreference: 'nearest',
  };
}

/**
 * Cache Middleware Factory
 * Simple in-memory caching
 */
function createCacheMiddleware(options = {}) {
  const {
    ttl = 300000, // 5 minutes default
    maxSize = 100,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
  } = options;
  
  const cache = new Map();
  
  // Cleanup old entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.expiresAt) {
        cache.delete(key);
      }
    }
  }, 60000); // Check every minute
  
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = keyGenerator(req);
    const cached = cache.get(key);
    
    // Return cached response
    if (cached && Date.now() < cached.expiresAt) {
      return res.json(cached.data);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method
    res.json = function(data) {
      // Limit cache size
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      // Cache the response
      cache.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });
      
      // Send response
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Rate Limiter Configuration
 */
function getRateLimiterConfig() {
  return {
    // General API
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    },
    
    // Search (more lenient)
    search: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 searches per minute
      message: 'Too many search requests',
    },
    
    // Booking (stricter)
    booking: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 bookings per 15 minutes
      message: 'Too many booking attempts, please try again later',
    },
    
    // Auth (very strict)
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5, // 5 login attempts per 15 minutes
      message: 'Too many authentication attempts',
      skipSuccessfulRequests: true,
    },
  };
}

/**
 * Compression Configuration
 */
function getCompressionConfig() {
  return {
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Use compression filter
      return require('compression').filter(req, res);
    },
  };
}

/**
 * Performance Monitoring Middleware
 */
function performanceMonitor() {
  const stats = {
    requests: 0,
    errors: 0,
    totalTime: 0,
    slowRequests: 0,
  };
  
  // Log stats every minute
  setInterval(() => {
    if (stats.requests > 0) {
      const avgTime = stats.totalTime / stats.requests;
      const errorRate = (stats.errors / stats.requests * 100).toFixed(2);
      
      console.log('\n📊 Performance Stats (last minute):');
      console.log(`   Requests: ${stats.requests}`);
      console.log(`   Errors: ${stats.errors} (${errorRate}%)`);
      console.log(`   Avg Response Time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Slow Requests (>1s): ${stats.slowRequests}`);
      
      // Reset stats
      stats.requests = 0;
      stats.errors = 0;
      stats.totalTime = 0;
      stats.slowRequests = 0;
    }
  }, 60000);
  
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Track response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      stats.requests++;
      stats.totalTime += duration;
      
      if (res.statusCode >= 400) {
        stats.errors++;
      }
      
      if (duration > 1000) {
        stats.slowRequests++;
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
    });
    
    next();
  };
}

/**
 * Database Query Optimizer
 */
class QueryOptimizer {
  // Optimize pagination
  static paginateQuery(query, page = 1, limit = 20, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit)));
    const skip = (parsedPage - 1) * parsedLimit;
    
    return {
      skip,
      limit: parsedLimit,
      page: parsedPage,
    };
  }
  
  // Optimize projections
  static selectFields(query, defaultFields = '') {
    return query.select(defaultFields);
  }
  
  // Use lean for read-only queries
  static leanQuery(query) {
    return query.lean();
  }
  
  // Add indexes check
  static async checkIndexes(model) {
    const indexes = await model.collection.getIndexes();
    console.log(`Indexes for ${model.collection.name}:`, Object.keys(indexes));
    return indexes;
  }
}

/**
 * Graceful Shutdown Handler
 */
function setupGracefulShutdown(server, options = {}) {
  const {
    timeout = 10000,
    onShutdown = () => {},
  } = options;
  
  let isShuttingDown = false;
  
  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }
    
    isShuttingDown = true;
    console.log(`\n🛑 ${signal} received, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Execute custom shutdown logic
    try {
      await onShutdown();
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
    }
    
    // Force shutdown after timeout
    setTimeout(() => {
      console.error('🔴 Forced shutdown after timeout');
      process.exit(1);
    }, timeout);
  };
  
  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Memory Usage Monitor
 */
function monitorMemory(intervalMs = 60000) {
  setInterval(() => {
    const used = process.memoryUsage();
    console.log('\n💾 Memory Usage:');
    for (let key in used) {
      console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
  }, intervalMs);
}

module.exports = {
  setupCluster,
  getOptimizedMongoOptions,
  createCacheMiddleware,
  getRateLimiterConfig,
  getCompressionConfig,
  performanceMonitor,
  QueryOptimizer,
  setupGracefulShutdown,
  monitorMemory,
};
