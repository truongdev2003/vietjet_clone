const express = require('express');
const NotificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// User routes
router.get('/', NotificationController.getUserNotifications);
router.get('/stats', NotificationController.getNotificationStats);
router.patch('/:notificationId/read', NotificationController.markAsRead);
router.patch('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

// Admin/Marketing routes
router.post('/', authorize(['admin', 'staff']), NotificationController.createNotification);
router.post('/promotional', authorize(['admin', 'marketing']), NotificationController.sendPromotionalNotification);

module.exports = router;