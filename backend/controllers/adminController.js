const User = require('../models/User');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Payment = require('../models/Payment');
const Notification = require('../models/Additional');
const NotificationController = require('./notificationController');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class AdminController {
  // Dashboard overview
  static getDashboard = asyncHandler(async (req, res, next) => {
    const { timeRange = '30d' } = req.query;
    
    // Tính toán ngày bắt đầu dựa trên timeRange
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Thống kê tổng quan
    const [
      totalUsers,
      newUsersCount,
      totalBookings,
      newBookingsCount,
      totalRevenue,
      newRevenue,
      totalFlights,
      activeFlights
    ] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ 
        status: 'active',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Booking.countDocuments(),
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      Payment.aggregate([
        { 
          $match: { 
            status: 'completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      Flight.countDocuments(),
      Flight.countDocuments({
        status: { $in: ['scheduled', 'boarding', 'departed', 'in_flight'] }
      })
    ]);

    // Thống kê booking theo ngày
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$payment.totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Top tuyến bay phổ biến
    const topRoutes = await Booking.aggregate([
      {
        $unwind: '$flights'
      },
      {
        $lookup: {
          from: 'flights',
          localField: 'flights.flight',
          foreignField: '_id',
          as: 'flightDetails'
        }
      },
      {
        $unwind: '$flightDetails'
      },
      {
        $lookup: {
          from: 'airports',
          localField: 'flightDetails.route.departure.airport',
          foreignField: '_id',
          as: 'departureAirport'
        }
      },
      {
        $lookup: {
          from: 'airports',
          localField: 'flightDetails.route.arrival.airport',
          foreignField: '_id',
          as: 'arrivalAirport'
        }
      },
      {
        $group: {
          _id: {
            from: { $arrayElemAt: ['$departureAirport.code.iata', 0] },
            to: { $arrayElemAt: ['$arrivalAirport.code.iata', 0] },
            fromName: { $arrayElemAt: ['$departureAirport.name.vi', 0] },
            toName: { $arrayElemAt: ['$arrivalAirport.name.vi', 0] }
          },
          bookings: { $sum: 1 },
          passengers: { $sum: { $size: '$flights.passengers' } },
          revenue: { $sum: '$payment.totalAmount' }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const response = ApiResponse.success({
      overview: {
        users: {
          total: totalUsers,
          new: newUsersCount,
          growth: totalUsers > 0 ? ((newUsersCount / totalUsers) * 100).toFixed(1) : 0
        },
        bookings: {
          total: totalBookings,
          new: newBookingsCount,
          growth: totalBookings > 0 ? ((newBookingsCount / totalBookings) * 100).toFixed(1) : 0
        },
        revenue: {
          total: totalRevenue,
          new: newRevenue,
          growth: totalRevenue > 0 ? ((newRevenue / totalRevenue) * 100).toFixed(1) : 0
        },
        flights: {
          total: totalFlights,
          active: activeFlights,
          utilization: totalFlights > 0 ? ((activeFlights / totalFlights) * 100).toFixed(1) : 0
        }
      },
      trends: {
        bookings: bookingTrends,
        timeRange
      },
      topRoutes
    }, 'Lấy dashboard thành công');

    response.send(res);
  });

  // Quản lý người dùng
  static getUsers = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      membershipLevel,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (membershipLevel) {
      query['frequentFlyerInfo.membershipLevel'] = membershipLevel;
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-account.password -account.emailVerificationToken -account.passwordResetToken')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Thêm thống kê booking cho mỗi user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingStats = await Booking.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              totalSpent: { $sum: '$payment.totalAmount' },
              lastBooking: { $max: '$createdAt' }
            }
          }
        ]);

        return {
          ...user,
          stats: bookingStats[0] || {
            totalBookings: 0,
            totalSpent: 0,
            lastBooking: null
          }
        };
      })
    );

    const response = ApiResponse.success({
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách người dùng thành công');

    response.send(res);
  });

  // Chi tiết người dùng
  static getUserDetail = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-account.password -account.emailVerificationToken -account.passwordResetToken')
      .lean();

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Lấy booking history
    const bookings = await Booking.find({ user: userId })
      .populate('flights.flight', 'flightNumber route.departure.airport route.arrival.airport route.departure.time')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Thống kê chi tiết
    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$payment.totalAmount' },
          totalFlights: { $sum: { $size: '$flights' } },
          avgBookingValue: { $avg: '$payment.totalAmount' }
        }
      }
    ]);

    const response = ApiResponse.success({
      user,
      bookings,
      stats: stats[0] || {
        totalBookings: 0,
        totalSpent: 0,
        totalFlights: 0,
        avgBookingValue: 0
      }
    }, 'Lấy chi tiết người dùng thành công');

    response.send(res);
  });

  // Cập nhật trạng thái người dùng
  static updateUserStatus = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended', 'deleted'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status,
        'metadata.lastUpdated': new Date()
      },
      { new: true }
    ).select('-account.password');

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Gửi thông báo cho user nếu cần
    if (status === 'suspended') {
      await NotificationController.createNotification({
        body: {
          userId: userId,
          type: 'account_suspended',
          title: 'Tài khoản tạm khóa',
          message: `Tài khoản của bạn đã bị tạm khóa. Lý do: ${reason || 'Vi phạm điều khoản sử dụng'}`,
          priority: 'urgent'
        }
      });
    }

    const response = ApiResponse.success(user, 'Cập nhật trạng thái thành công');
    response.send(res);
  });

  // Quản lý booking
  static getBookings = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { pnr: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query['payment.status'] = paymentStatus;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'personalInfo.firstName personalInfo.lastName contactInfo.email')
        .populate('flights.flight', 'flightNumber route.departure.airport route.arrival.airport route.departure.time')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
    ]);

    const response = ApiResponse.success({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách booking thành công');

    response.send(res);
  });

  // Hủy booking
  static cancelBooking = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const { reason, refundAmount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    if (booking.status === 'cancelled') {
      return next(new AppError('Booking đã được hủy', 400));
    }

    // Cập nhật booking
    await Booking.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      'cancellation.isCancelled': true,
      'cancellation.cancelledAt': new Date(),
      'cancellation.cancelledBy': 'admin',
      'cancellation.reason': reason,
      'cancellation.refundEligible': refundAmount > 0,
      'payment.refundAmount': refundAmount || 0
    });

    // Gửi thông báo cho khách hàng
    if (booking.user) {
      await NotificationController.createNotification({
        body: {
          userId: booking.user,
          type: 'booking_cancelled',
          title: 'Booking đã bị hủy',
          message: `Booking ${booking.bookingReference} đã bị hủy. Lý do: ${reason}`,
          relatedData: { booking: bookingId },
          priority: 'high'
        }
      });
    }

    const response = ApiResponse.success(null, 'Hủy booking thành công');
    response.send(res);
  });

  // Thống kê báo cáo
  static getReports = asyncHandler(async (req, res, next) => {
    const { type = 'revenue', period = 'monthly' } = req.query;

    let result;

    switch (type) {
      case 'revenue':
        result = await this.getRevenueReport(period);
        break;
      case 'bookings':
        result = await this.getBookingReport(period);
        break;
      case 'users':
        result = await this.getUserReport(period);
        break;
      case 'flights':
        result = await this.getFlightReport(period);
        break;
      default:
        return next(new AppError('Loại báo cáo không hợp lệ', 400));
    }

    const response = ApiResponse.success(result, 'Lấy báo cáo thành công');
    response.send(res);
  });

  // Helper methods for reports
  static async getRevenueReport(period) {
    const groupBy = this.getGroupByPeriod(period);
    
    return await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  static async getBookingReport(period) {
    const groupBy = this.getGroupByPeriod(period);
    
    return await Booking.aggregate([
      {
        $group: {
          _id: groupBy,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$payment.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  static async getUserReport(period) {
    const groupBy = this.getGroupByPeriod(period);
    
    return await User.aggregate([
      {
        $group: {
          _id: groupBy,
          newUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  static async getFlightReport(period) {
    const groupBy = this.getGroupByPeriod(period, '$route.departure.time');
    
    return await Flight.aggregate([
      {
        $group: {
          _id: groupBy,
          totalFlights: { $sum: 1 },
          onTimeFlights: {
            $sum: { $cond: [{ $eq: ['$status', 'arrived'] }, 1, 0] }
          },
          delayedFlights: {
            $sum: { $cond: [{ $gt: ['$delay.departure.minutes', 0] }, 1, 0] }
          },
          cancelledFlights: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  static getGroupByPeriod(period, dateField = '$createdAt') {
    switch (period) {
      case 'daily':
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField }
        };
      case 'weekly':
        return {
          year: { $year: dateField },
          week: { $week: dateField }
        };
      case 'monthly':
        return {
          year: { $year: dateField },
          month: { $month: dateField }
        };
      case 'yearly':
        return {
          year: { $year: dateField }
        };
      default:
        return {
          year: { $year: dateField },
          month: { $month: dateField }
        };
    }
  }

  // Gửi thông báo flight update
  static sendFlightUpdate = asyncHandler(async (req, res, next) => {
    const { flightId, updateType, details } = req.body;

    if (!flightId || !updateType || !details) {
      return next(new AppError('Thiếu thông tin cập nhật', 400));
    }

    await NotificationController.sendFlightUpdate(flightId, updateType, details);

    const response = ApiResponse.success(null, 'Gửi thông báo cập nhật chuyến bay thành công');
    response.send(res);
  });
}

module.exports = AdminController;