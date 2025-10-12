// Cron Job Scheduler để cleanup bookings hết hạn
// Thêm vào backend/server.js hoặc tạo file riêng backend/services/scheduler.js

const cron = require('node-cron');
const BookingController = require('../controllers/bookingController');

/**
 * Setup cron jobs cho hệ thống
 */
const setupCronJobs = () => {
  console.log('🕐 Setting up cron jobs...');

  // 1. Cleanup expired bookings - Chạy mỗi ngày lúc 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running expired bookings cleanup...');
    try {
      // Simulate request/response objects
      const mockReq = {};
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`✅ Cleanup completed - Status: ${code}`, data);
            return data;
          }
        })
      };
      const mockNext = (error) => {
        if (error) {
          console.error('❌ Cleanup failed:', error.message);
        }
      };

      await BookingController.cleanupExpiredBookings(mockReq, mockRes, mockNext);
    } catch (error) {
      console.error('❌ Cron job error:', error);
    }
  });

  console.log('✅ Cron jobs setup completed');
  console.log('📅 Scheduled jobs:');
  console.log('   - Cleanup expired bookings: Daily at 2:00 AM');
};

module.exports = setupCronJobs;

// ===== USAGE IN server.js =====
// const setupCronJobs = require('./services/scheduler');
// setupCronJobs();
