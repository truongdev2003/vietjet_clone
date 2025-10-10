const { Notification } = require('../models/Additional'); // Notification model trong Additional.js
const User = require('../models/User');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const EmailService = require('../services/emailService');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  // Tạo thông báo mới
  static createNotification = asyncHandler(async (req, res, next) => {
    const {
      userId,
      type,
      title,
      message,
      relatedData,
      priority = 'normal',
      scheduledFor
    } = req.body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return next(new AppError('Thiếu thông tin bắt buộc', 400));
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Người dùng không tồn tại', 404));
    }

    // Create notification
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedData,
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
    });

    // Nếu không có lịch trình, gửi ngay
    if (!scheduledFor) {
      await this.sendNotification(notification, user);
    }

    const response = ApiResponse.created(notification, 'Tạo thông báo thành công');
    response.send(res);
  });

  // Lấy danh sách thông báo của user
  static getUserNotifications = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      type,
      unreadOnly = false
    } = req.query;

    // Build query
    const query = { user: userId };
    if (type) {
      query.type = type;
    }
    if (unreadOnly === 'true') {
      query['channels.inApp.read'] = false;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedData.booking', 'bookingReference')
      .populate('relatedData.flight', 'flightNumber route.departure.time')
      .lean();

    // Get total count
    const total = await Notification.countDocuments(query);

    const response = ApiResponse.success({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy thông báo thành công');

    response.send(res);
  });

  // Đánh dấu thông báo đã đọc
  static markAsRead = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      {
        $set: {
          'channels.inApp.read': true,
          'channels.inApp.readAt': new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Không tìm thấy thông báo', 404));
    }

    const response = ApiResponse.success(notification, 'Đã đánh dấu đọc');
    response.send(res);
  });

  // Đánh dấu tất cả thông báo đã đọc
  static markAllAsRead = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;

    await Notification.updateMany(
      { user: userId, 'channels.inApp.read': false },
      {
        $set: {
          'channels.inApp.read': true,
          'channels.inApp.readAt': new Date()
        }
      }
    );

    const response = ApiResponse.success(null, 'Đã đánh dấu tất cả đã đọc');
    response.send(res);
  });

  // Xóa thông báo
  static deleteNotification = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return next(new AppError('Không tìm thấy thông báo', 404));
    }

    const response = ApiResponse.success(null, 'Xóa thông báo thành công');
    response.send(res);
  });

  // Gửi thông báo booking confirmation
  static sendBookingConfirmation = asyncHandler(async (bookingId) => {
    const booking = await Booking.findById(bookingId)
      .populate('flights.flight')
      .populate('flights.flight.route.departure.airport')
      .populate('flights.flight.route.arrival.airport');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Tạo thông báo in-app
    const notification = await Notification.create({
      user: booking.user,
      type: 'booking_confirmation',
      title: 'Đặt vé thành công!',
      message: `Vé máy bay ${booking.bookingReference} đã được đặt thành công. Cảm ơn bạn đã chọn VietJet Air!`,
      relatedData: {
        booking: booking._id
      },
      priority: 'high'
    });

    // Gửi email xác nhận
    if (booking.contactInfo.email) {
      await EmailService.sendBookingConfirmation(booking, booking.flights.map(f => f.flight));
    }

    // Cập nhật trạng thái đã gửi trong booking
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        'notifications.bookingConfirmation.sent': true,
        'notifications.bookingConfirmation.sentAt': new Date()
      }
    });

    return notification;
  });

  // Gửi nhắc nhở check-in
  static sendCheckInReminder = asyncHandler(async (bookingId) => {
    const booking = await Booking.findById(bookingId)
      .populate('flights.flight')
      .populate('flights.flight.route.departure.airport')
      .populate('flights.flight.route.arrival.airport');

    if (!booking || booking.status !== 'confirmed') {
      return;
    }

    const flight = booking.flights[0]?.flight;
    if (!flight) {
      return;
    }

    // Tạo thông báo
    const notification = await Notification.create({
      user: booking.user,
      type: 'check_in_reminder',
      title: 'Đã đến giờ check-in!',
      message: `Chuyến bay ${flight.flightNumber} của bạn sẽ khởi hành trong 24 giờ. Hãy check-in online để tiết kiệm thời gian!`,
      relatedData: {
        booking: booking._id,
        flight: flight._id
      },
      priority: 'high'
    });

    // Gửi email nhắc nhở
    if (booking.contactInfo.email) {
      await EmailService.sendCheckInReminder(booking, flight);
    }

    // Cập nhật trạng thái
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        'notifications.checkInReminder.sent': true,
        'notifications.checkInReminder.sentAt': new Date()
      }
    });

    return notification;
  });

  // Gửi thông báo thay đổi chuyến bay
  static sendFlightUpdate = asyncHandler(async (flightId, updateType, details) => {
    const flight = await Flight.findById(flightId)
      .populate('route.departure.airport')
      .populate('route.arrival.airport');

    if (!flight) {
      throw new Error('Flight not found');
    }

    // Tìm tất cả booking của chuyến bay này
    const bookings = await Booking.find({
      'flights.flight': flightId,
      status: 'confirmed'
    }).populate('user');

    const updateMessages = {
      delay: 'Chuyến bay bị hoãn',
      gate_change: 'Thay đổi cổng khởi hành',
      cancellation: 'Chuyến bay bị hủy',
      schedule_change: 'Thay đổi lịch trình'
    };

    // Gửi thông báo cho từng hành khách
    for (const booking of bookings) {
      // Tạo thông báo in-app
      await Notification.create({
        user: booking.user._id,
        type: 'flight_update',
        title: updateMessages[updateType],
        message: `${updateMessages[updateType]} ${flight.flightNumber}. ${details.reason || 'Vui lòng kiểm tra thông tin mới nhất.'}`,
        relatedData: {
          booking: booking._id,
          flight: flight._id
        },
        priority: 'urgent'
      });

      // Gửi email thông báo
      if (booking.contactInfo.email) {
        await EmailService.sendFlightUpdate(booking, flight, updateType, details);
      }
    }

    console.log(`Sent ${updateType} notifications for flight ${flight.flightNumber} to ${bookings.length} passengers`);
  });

  // Gửi thông báo khuyến mãi
  static sendPromotionalNotification = asyncHandler(async (req, res, next) => {
    const {
      title,
      message,
      targetAudience = 'all',
      promotionCode,
      scheduledFor
    } = req.body;

    // Validate admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'marketing') {
      return next(new AppError('Không có quyền gửi thông báo khuyến mãi', 403));
    }

    // Build user query based on target audience
    let userQuery = { status: 'active' };
    
    if (targetAudience === 'frequent_flyers') {
      userQuery['frequentFlyerInfo.membershipLevel'] = { $in: ['silver', 'gold', 'platinum'] };
    } else if (targetAudience === 'new_users') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      userQuery.createdAt = { $gte: thirtyDaysAgo };
    }

    // Get target users
    const users = await User.find(userQuery).select('_id contactInfo personalInfo');

    // Create notifications
    const notifications = [];
    for (const user of users) {
      const notification = await Notification.create({
        user: user._id,
        type: 'promotion',
        title,
        message,
        priority: 'normal',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
      });

      notifications.push(notification);
    }

    const response = ApiResponse.success({
      sent: notifications.length,
      targetAudience,
      scheduledFor
    }, 'Gửi thông báo khuyến mãi thành công');

    response.send(res);
  });

  // Lấy thống kê thông báo
  static getNotificationStats = asyncHandler(async (req, res, next) => {
    const userId = req.user.userId;

    const stats = await Notification.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$channels.inApp.read', false] }, 1, 0]
            }
          },
          byType: {
            $push: {
              type: '$type',
              read: '$channels.inApp.read'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byType: [] };

    // Group by type
    const typeStats = {};
    result.byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (!item.read) {
        typeStats[item.type].unread++;
      }
    });

    const response = ApiResponse.success({
      total: result.total,
      unread: result.unread,
      typeBreakdown: typeStats
    }, 'Lấy thống kê thành công');

    response.send(res);
  });

  // Admin: Get all notifications
  static getAllNotifications = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      status,
      search
    } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) {
      if (status === 'read') {
        query['channels.inApp.read'] = true;
      } else if (status === 'unread') {
        query['channels.inApp.read'] = false;
      }
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'personalInfo.firstName personalInfo.lastName contactInfo.email')
      .populate('relatedData.booking', 'bookingReference')
      .populate('relatedData.flight', 'flightNumber')
      .lean();

    // Get total count
    const total = await Notification.countDocuments(query);

    const response = ApiResponse.success({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách thông báo thành công');

    response.send(res);
  });

  // Helper method để gửi thông báo
  static async sendNotification(notification, user) {
    try {
      // Update notification status
      await Notification.findByIdAndUpdate(notification._id, {
        $set: {
          'channels.inApp.sent': true,
          'channels.inApp.sentAt': new Date(),
          status: 'sent'
        }
      });

      // Gửi email nếu có consent
      if (user.preferences.marketingConsent.email && user.contactInfo.email) {
        // Có thể gửi email tùy thuộc vào loại thông báo
        console.log('Email notification sent to:', user.contactInfo.email);
      }

      // Gửi push notification (sẽ implement sau)
      console.log('Push notification sent to user:', user._id);

    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Update status to failed
      await Notification.findByIdAndUpdate(notification._id, {
        $set: { status: 'failed' }
      });
    }
  }
}

module.exports = NotificationController;