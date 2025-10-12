const User = require('../models/User');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Payment = require('../models/Payment');
const PaymentCode = require('../models/PaymentCode');
const { Notification } = require('../models/Additional');
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

    // Tính toán "hôm nay" (từ 00:00:00 đến 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Thống kê tổng quan
    const [
      totalUsers,
      newUsersCount,
      newUsersToday,
      totalBookings,
      newBookingsCount,
      newBookingsToday,
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
      User.countDocuments({ 
        status: 'active',
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      Booking.countDocuments(),
      Booking.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Booking.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }),
      Payment.aggregate([
        { $match: { 'status.overall': { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
      ]).then(result => result[0]?.total || 0),
      Payment.aggregate([
        { 
          $match: { 
            'status.overall': { $in: ['paid', 'completed'] },
            'status.timeline.completed': { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount.total' } } }
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
          today: newUsersToday,
          growth: totalUsers > 0 ? ((newUsersCount / totalUsers) * 100).toFixed(1) : 0
        },
        bookings: {
          total: totalBookings,
          new: newBookingsCount,
          today: newBookingsToday,
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
      role,
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

    if (role) {
      query.role = role;
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

  // Update user role
  static updateUserRole = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return next(new AppError('Vai trò không hợp lệ', 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role,
        'metadata.lastUpdated': new Date()
      },
      { new: true }
    ).select('-account.password');

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    const response = ApiResponse.success(user, 'Cập nhật vai trò thành công');
    response.send(res);
  });

  // Delete user (soft delete)
  static deleteUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    // Không cho phép xóa chính mình
    if (userId === req.user.id) {
      return next(new AppError('Không thể xóa tài khoản của chính bạn', 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'deleted',
        'metadata.deletedAt': new Date(),
        'metadata.lastUpdated': new Date()
      },
      { new: true }
    ).select('-account.password');

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    const response = ApiResponse.success(user, 'Xóa người dùng thành công');
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
        .populate({
          path: 'flights.flight',
          select: 'flightNumber route status',
          populate: [
            {
              path: 'route.departure.airport',
              select: 'code.iata name.vi'
            },
            {
              path: 'route.arrival.airport',
              select: 'code.iata name.vi'
            }
          ]
        })
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
    const dateRange = this.getDateRange(period);
    const groupBy = this.getGroupByPeriod(period, '$status.timeline.initiated');
    
    const matchStage = {};
    
    // Filter theo timeline.initiated (khi payment được tạo)
    if (dateRange) {
      matchStage['status.timeline.initiated'] = dateRange;
    }
    
    return await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $in: ['$status.overall', ['paid', 'completed']] }, 
                '$amount.total', 
                0 
              ] 
            } 
          },
          pendingRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status.overall', 'pending'] }, 
                '$amount.total', 
                0 
              ] 
            } 
          },
          totalTransactions: { $sum: 1 },
          paidTransactions: {
            $sum: { 
              $cond: [
                { $in: ['$status.overall', ['paid', 'completed']] }, 
                1, 
                0 
              ] 
            }
          },
          pendingTransactions: {
            $sum: { 
              $cond: [
                { $eq: ['$status.overall', 'pending'] }, 
                1, 
                0 
              ] 
            }
          },
          avgTransactionValue: { $avg: '$amount.total' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 50 }
    ]);
  }

  static async getBookingReport(period) {
    const dateRange = this.getDateRange(period);
    const groupBy = this.getGroupByPeriod(period, '$createdAt');
    
    const matchStage = {};
    if (dateRange) {
      matchStage.createdAt = dateRange;
    }
    
    return await Booking.aggregate([
      { $match: matchStage },
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
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 50 }
    ]);
  }

  static async getUserReport(period) {
    const dateRange = this.getDateRange(period);
    const groupBy = this.getGroupByPeriod(period, '$createdAt');
    
    const matchStage = {};
    if (dateRange) {
      matchStage.createdAt = dateRange;
    }
    
    return await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          newUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 50 }
    ]);
  }

  static async getFlightReport(period) {
    const dateRange = this.getDateRange(period);
    const groupBy = this.getGroupByPeriod(period, '$route.departure.time');
    
    const matchStage = {};
    if (dateRange) {
      matchStage['route.departure.time'] = dateRange;
    }
    
    return await Flight.aggregate([
      { $match: matchStage },
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
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 50 }
    ]);
  }

  // Lấy date range dựa trên period
  static getDateRange(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        // 30 ngày gần nhất
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        // 12 tuần gần nhất
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        // 12 tháng gần nhất
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
        break;
      case 'yearly':
        // 5 năm gần nhất
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      default:
        // Mặc định 12 tháng
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
    }

    return { $gte: startDate, $lte: now };
  }

  static getGroupByPeriod(period, dateField = '$status.timeline.initiated') {
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

  // ==================== PAYMENT CODE MANAGEMENT ====================
  
  // Lấy danh sách payment codes
  static getPaymentCodes = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by code or name
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [paymentCodes, total] = await Promise.all([
      PaymentCode.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('metadata.createdBy', 'name email')
        .populate('metadata.updatedBy', 'name email')
        .lean(),
      PaymentCode.countDocuments(query)
    ]);

    const response = ApiResponse.success(
      {
        paymentCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Lấy danh sách mã thanh toán thành công'
    );
    response.send(res);
  });

  // Lấy chi tiết payment code
  static getPaymentCodeById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const paymentCode = await PaymentCode.findById(id)
      .populate('metadata.createdBy', 'name email')
      .populate('metadata.updatedBy', 'name email')
      .populate('usedBy.user', 'name email')
      .populate('usedBy.booking', 'reference');

    if (!paymentCode) {
      return next(new AppError('Không tìm thấy mã thanh toán', 404));
    }

    const response = ApiResponse.success(paymentCode, 'Lấy thông tin mã thanh toán thành công');
    response.send(res);
  });

  // Tạo payment code mới
  static createPaymentCode = asyncHandler(async (req, res, next) => {
    const {
      code,
      name,
      description,
      discountType,
      value,
      minAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      applicableFor
    } = req.body;

    // Validate required fields
    if (!code || !name || !discountType || value === undefined || !expiryDate) {
      return next(new AppError('Thiếu thông tin bắt buộc', 400));
    }

    // Validate expiry date
    if (new Date(expiryDate) <= new Date()) {
      return next(new AppError('Ngày hết hạn phải sau ngày hiện tại', 400));
    }

    // Check if code already exists
    const existingCode = await PaymentCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return next(new AppError('Mã thanh toán đã tồn tại', 400));
    }

    // Create payment code
    const paymentCode = await PaymentCode.create({
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      value,
      minAmount: minAmount || 0,
      maxDiscount,
      startDate: startDate || Date.now(),
      expiryDate,
      usageLimit: usageLimit || { total: null, perUser: 1 },
      applicableFor: applicableFor || {},
      metadata: {
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });

    const response = ApiResponse.success(paymentCode, 'Tạo mã thanh toán thành công', 201);
    response.send(res);
  });

  // Cập nhật payment code
  static updatePaymentCode = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const {
      name,
      description,
      discountType,
      value,
      minAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      applicableFor,
      status
    } = req.body;

    const paymentCode = await PaymentCode.findById(id);
    if (!paymentCode) {
      return next(new AppError('Không tìm thấy mã thanh toán', 404));
    }

    // Update fields
    if (name) paymentCode.name = name;
    if (description !== undefined) paymentCode.description = description;
    if (discountType) paymentCode.discountType = discountType;
    if (value !== undefined) paymentCode.value = value;
    if (minAmount !== undefined) paymentCode.minAmount = minAmount;
    if (maxDiscount !== undefined) paymentCode.maxDiscount = maxDiscount;
    if (startDate) paymentCode.startDate = startDate;
    if (expiryDate) {
      if (new Date(expiryDate) <= new Date() && status !== 'expired') {
        return next(new AppError('Ngày hết hạn phải sau ngày hiện tại', 400));
      }
      paymentCode.expiryDate = expiryDate;
    }
    if (usageLimit) paymentCode.usageLimit = usageLimit;
    if (applicableFor) paymentCode.applicableFor = applicableFor;
    if (status) paymentCode.status = status;

    paymentCode.metadata.updatedBy = req.user.id;
    await paymentCode.save();

    const response = ApiResponse.success(paymentCode, 'Cập nhật mã thanh toán thành công');
    response.send(res);
  });

  // Xóa payment code
  static deletePaymentCode = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const paymentCode = await PaymentCode.findById(id);
    if (!paymentCode) {
      return next(new AppError('Không tìm thấy mã thanh toán', 404));
    }

    // Chỉ cho phép xóa nếu chưa được sử dụng
    if (paymentCode.usedCount > 0) {
      return next(new AppError('Không thể xóa mã đã được sử dụng. Vui lòng vô hiệu hóa thay thế.', 400));
    }

    await paymentCode.deleteOne();

    const response = ApiResponse.success(null, 'Xóa mã thanh toán thành công');
    response.send(res);
  });

  // Toggle payment code status
  static togglePaymentCodeStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const paymentCode = await PaymentCode.findById(id);
    if (!paymentCode) {
      return next(new AppError('Không tìm thấy mã thanh toán', 404));
    }

    // Toggle between active and inactive
    if (paymentCode.status === 'expired') {
      return next(new AppError('Không thể kích hoạt mã đã hết hạn', 400));
    }

    paymentCode.status = paymentCode.status === 'active' ? 'inactive' : 'active';
    paymentCode.metadata.updatedBy = req.user.id;
    await paymentCode.save();

    const response = ApiResponse.success(
      paymentCode,
      `${paymentCode.status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} mã thanh toán thành công`
    );
    response.send(res);
  });

  // Lấy thống kê payment codes
  static getPaymentCodeStats = asyncHandler(async (req, res, next) => {
    const [total, active, expired, inactive] = await Promise.all([
      PaymentCode.countDocuments(),
      PaymentCode.countDocuments({ status: 'active' }),
      PaymentCode.countDocuments({ status: 'expired' }),
      PaymentCode.countDocuments({ status: 'inactive' })
    ]);

    // Top 10 mã được sử dụng nhiều nhất
    const topUsed = await PaymentCode.find()
      .sort({ usedCount: -1 })
      .limit(10)
      .select('code name usedCount value discountType')
      .lean();

    // Tổng giảm giá đã áp dụng
    const totalDiscountResult = await PaymentCode.aggregate([
      {
        $unwind: '$usedBy'
      },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$usedBy.discountAmount' }
        }
      }
    ]);

    const totalDiscount = totalDiscountResult[0]?.totalDiscount || 0;

    const response = ApiResponse.success(
      {
        counts: {
          total,
          active,
          expired,
          inactive
        },
        topUsed,
        totalDiscount
      },
      'Lấy thống kê mã thanh toán thành công'
    );
    response.send(res);
  });
}

module.exports = AdminController;