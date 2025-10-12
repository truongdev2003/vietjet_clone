const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const Payment = require('../models/Payment');
const PaymentCode = require('../models/PaymentCode');
const Inventory = require('../models/Inventory');
const Fare = require('../models/Fare');
const pdfService = require('../services/pdfService');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');

class BookingController {
  // Tạo booking mới (hỗ trợ cả guest và user đã đăng nhập)
  static createBooking = asyncHandler(async (req, res, next) => {
    const {
      flights,
      passengers,
      contactInfo,
      services = {},
      paymentMethod,
      promoCode,
      paymentCode
    } = req.body;

    // Validate required fields
    if (!flights || flights.length === 0) {
      return next(new AppError('Vui lòng chọn ít nhất một chuyến bay', 400));
    }

    if (!passengers || passengers.length === 0) {
      return next(new AppError('Vui lòng cung cấp thông tin hành khách', 400));
    }

    if (!contactInfo || !contactInfo.email || !contactInfo.phone) {
      return next(new AppError('Vui lòng cung cấp thông tin liên lạc', 400));
    }

    // Validate passenger information
    for (const passenger of passengers) {
      const requiredFields = ['title', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'document'];
      for (const field of requiredFields) {
        if (!passenger[field]) {
          return next(new AppError(`Thiếu thông tin hành khách: ${field}`, 400));
        }
      }

      // Validate document
      if (!passenger.document.type || !passenger.document.number || !passenger.document.expiryDate) {
        return next(new AppError('Thông tin giấy tờ tùy thân không đầy đủ', 400));
      }

      // Validate document expiry
      if (new Date(passenger.document.expiryDate) <= new Date()) {
        return next(new AppError(`Giấy tờ của ${passenger.firstName} ${passenger.lastName} đã hết hạn`, 400));
      }
    }

    // Determine user (guest or registered)
    let user = null;
    let isGuestBooking = false;

    if (req.user && req.currentUser) {
      // User đã đăng nhập
      user = req.currentUser;
    } else {
      // Guest booking - tìm hoặc tạo guest user
      isGuestBooking = true;
      
      // Kiểm tra xem đã có guest user với email này chưa
      user = await User.findOne({ 
        'contactInfo.email': contactInfo.email,
        isGuest: true 
      });

      if (!user) {
        // Tạo guest user mới
        user = await User.createGuestUser(contactInfo);
      } else {
        // Cập nhật thông tin liên lạc nếu cần
        user.contactInfo.phone = contactInfo.phone;
        if (contactInfo.address) {
          user.contactInfo.address = { ...user.contactInfo.address, ...contactInfo.address };
        }
        await user.save();
      }
    }

    // Validate flights and check availability
    const flightDetails = [];
    let totalAmount = 0;

    for (const flightBooking of flights) {
      const flight = await Flight.findById(flightBooking.flightId)
        .populate('route.departure.airport')
        .populate('route.arrival.airport');

      if (!flight) {
        return next(new AppError(`Không tìm thấy chuyến bay ${flightBooking.flightId}`, 404));
      }

      if (flight.status !== 'scheduled') {
        return next(new AppError(`Chuyến bay ${flight.flightNumber} hiện không khả dụng`, 400));
      }

      // Check seat availability
      const inventory = await Inventory.findOne({ flight: flightBooking.flightId });
      if (!inventory) {
        return next(new AppError(`Không có thông tin ghế cho chuyến bay ${flight.flightNumber}`, 400));
      }

      const seatClass = flightBooking.seatClass || 'economy';
      const availableSeats = inventory.bookingClasses
        .filter(bc => bc.category === seatClass)
        .reduce((total, bc) => total + (bc.authorized - bc.sold), 0);

      if (availableSeats < passengers.length) {
        return next(new AppError(`Chuyến bay ${flight.flightNumber} không đủ ghế trống`, 400));
      }

      // Find route by departure and arrival airports
      const Route = require('../models/Route');
      const route = await Route.findOne({
        'origin.airport': flight.route.departure.airport._id,
        'destination.airport': flight.route.arrival.airport._id
      });

      if (!route) {
        console.warn(`No route found for flight ${flight.flightNumber}. Using flight pricing instead.`);
        // Fallback: use pricing from flight object if available
        if (!flight.pricing || !flight.pricing[seatClass]) {
          return next(new AppError(`Không tìm thấy giá vé cho chuyến bay ${flight.flightNumber}`, 400));
        }
        
        const flightTotal = flight.pricing[seatClass].base * passengers.length;
        totalAmount += flightTotal;

        flightDetails.push({
          flight,
          fare: null, // No fare found, using flight pricing
          seatClass,
          passengerCount: passengers.length,
          amount: flightTotal
        });
        continue;
      }

      // Get fare for this flight using the route ObjectId
      const fare = await Fare.findOne({
        route: route._id,
        cabinClass: seatClass,
        'validity.startDate': { $lte: flight.route.departure.time },
        'validity.endDate': { $gte: flight.route.departure.time }
      });

      if (!fare) {
        console.warn(`No fare found for flight ${flight.flightNumber}. Using flight pricing instead.`);
        // Fallback: use pricing from flight object
        if (!flight.pricing || !flight.pricing[seatClass]) {
          return next(new AppError(`Không tìm thấy giá vé cho chuyến bay ${flight.flightNumber}`, 400));
        }
        
        const flightTotal = flight.pricing[seatClass].base * passengers.length;
        totalAmount += flightTotal;

        flightDetails.push({
          flight,
          fare: null,
          seatClass,
          passengerCount: passengers.length,
          amount: flightTotal
        });
        continue;
      }

      const flightTotal = (fare.pricing.base + fare.pricing.taxes + fare.pricing.fees) * passengers.length;
      totalAmount += flightTotal;

      flightDetails.push({
        flight,
        fare,
        seatClass,
        passengerCount: passengers.length,
        amount: flightTotal
      });
    }

    // Calculate service fees
    let serviceAmount = 0;
    if (services.baggage) {
      serviceAmount += services.baggage.additionalWeight * 50000; // 50k per kg
    }
    if (services.meal) {
      serviceAmount += passengers.length * 200000; // 200k per meal
    }
    if (services.seat) {
      serviceAmount += passengers.length * 100000; // 100k per seat selection
    }

    totalAmount += serviceAmount;

    // Apply promo code discount (if any)
    let discountAmount = 0;
    let promoCodeDiscount = 0;
    let paymentCodeDiscount = 0;
    let usedPaymentCode = null;
    
    if (promoCode) {
      // TODO: Implement promo code validation and discount calculation
      // For now, just a placeholder
    }

    // Apply payment code discount (if any)
    if (paymentCode) {
      try {
        const paymentCodeObj = await PaymentCode.findValidCode(paymentCode);
        
        // Kiểm tra user có thể sử dụng mã không
        if (user) {
          const canUse = paymentCodeObj.canUserUse(user._id);
          if (!canUse.valid) {
            return next(new AppError(canUse.message, 400));
          }
        }

        // Kiểm tra số tiền tối thiểu
        if (totalAmount < paymentCodeObj.minAmount) {
          return next(new AppError(
            `Số tiền thanh toán tối thiểu để áp dụng mã này là ${paymentCodeObj.minAmount.toLocaleString('vi-VN')} VND`,
            400
          ));
        }

        // Tính discount
        paymentCodeDiscount = paymentCodeObj.calculateDiscount(totalAmount);
        discountAmount += paymentCodeDiscount;
        usedPaymentCode = paymentCodeObj;

        console.log(`Payment code ${paymentCode} applied: -${paymentCodeDiscount} VND`);
      } catch (error) {
        return next(new AppError(error.message, 400));
      }
    }

    const finalAmount = totalAmount - discountAmount;

    // Generate booking reference
    const bookingReference = this.generateBookingReference();

    // Create booking
    const booking = await Booking.create({
      bookingReference,
      user: user._id, // Luôn có user (guest hoặc registered)
      
      // Contact information (đúng schema là contactInfo, không phải contact)
      contactInfo: {
        email: contactInfo.email,
        phone: contactInfo.phone,
        alternatePhone: contactInfo.alternatePhone,
        address: contactInfo.address
      },

      // Flight information
      flights: flights.map((flightBooking, index) => ({
        flight: flightBooking.flightId,
        type: index === 0 ? 'outbound' : 'return', // outbound cho chuyến đầu, return cho chuyến về
        passengers: passengers.map(passenger => ({
          ...passenger,
          ticket: {
            seatClass: flightBooking.seatClass || 'economy',
            ticketNumber: this.generateTicketNumber(),
            eTicketNumber: this.generateETicketNumber()
          }
        }))
      })),

      // Payment information
      payment: {
        totalAmount: finalAmount,
        currency: 'VND',
        breakdown: {
          baseFare: totalAmount - serviceAmount,
          taxes: 0,
          fees: 0,
          services: serviceAmount,
          discount: discountAmount
        },
        // Map paymentMethod to valid enum values
        method: paymentMethod === 'momo' ? 'e_wallet' : (paymentMethod || 'e_wallet'),
        status: 'pending'
      },

      // Status
      status: 'pending', // Chờ thanh toán
      
      // Metadata
      metadata: {
        bookingSource: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        isGuestBooking: isGuestBooking,
        // Lưu thông tin payment code nếu có
        paymentCode: usedPaymentCode ? {
          code: usedPaymentCode.code,
          name: usedPaymentCode.name,
          discountAmount: paymentCodeDiscount
        } : null
      }
    });

    // Cập nhật guest user với booking reference nếu là guest
    if (isGuestBooking) {
      user.guestInfo.createdBookings.push(booking._id);
      if (!user.guestInfo.bookingReference) {
        user.guestInfo.bookingReference = bookingReference;
      }
      await user.save();
    }

    // Update inventory (temporarily hold seats)
    for (let i = 0; i < flights.length; i++) {
      const flightBooking = flights[i];
      const seatClass = flightBooking.seatClass || 'economy';
      
      await Inventory.findOneAndUpdate(
        { 
          flight: flightBooking.flightId,
          'bookingClasses.category': seatClass
        },
        { 
          $inc: { 'bookingClasses.$.held': passengers.length }
        }
      );
    }

    // Gửi email xác nhận booking (cho cả guest và registered user)
    try {
      const emailService = require('../services/emailService');
      
      await emailService.sendBookingConfirmation(user, booking, flightDetails);
      
      // Cập nhật flag email đã gửi
      booking.notifications.bookingConfirmation.sent = true;
      booking.notifications.bookingConfirmation.sentAt = new Date();
      await booking.save();
      
      console.log(`✅ Đã gửi email booking confirmation cho ${booking.contactInfo.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send booking confirmation email:', emailError);
      // Không fail booking nếu email lỗi, nhưng log để retry sau
      booking.notifications.bookingConfirmation.sent = false;
      await booking.save();
    }

    // Tạo payment URL nếu có paymentMethod
    let paymentUrl = null;
    let paymentId = null;
    
    if (paymentMethod) {
      try {
        const PaymentGatewayService = require('../services/paymentGatewayService');
        const orderInfo = `VietJet - ${bookingReference} - ${passengers.length} hành khách`;
        
        let paymentResult;
        switch (paymentMethod) {
          case 'momo':
          case 'e_wallet':
            paymentResult = await PaymentGatewayService.createMoMoPayment(
              booking._id,
              finalAmount,
              orderInfo
            );
            break;
          case 'vnpay':
            paymentResult = await PaymentGatewayService.createVNPayPayment(
              booking._id,
              finalAmount,
              orderInfo,
              req.ip
            );
            break;
          case 'zalopay':
            paymentResult = await PaymentGatewayService.createZaloPayPayment(
              booking._id,
              finalAmount,
              orderInfo
            );
            break;
          default:
            console.warn(`Payment method ${paymentMethod} not supported for auto-payment`);
        }
        
        if (paymentResult) {
          paymentUrl = paymentResult.paymentUrl;
          paymentId = paymentResult.paymentId;
        }
      } catch (paymentError) {
        console.error('Failed to create payment:', paymentError);
        // Không fail booking nếu tạo payment lỗi
      }
    }

    const responseData = {
      booking,
      paymentInfo: {
        amount: finalAmount,
        currency: 'VND',
        reference: bookingReference,
        paymentUrl,
        paymentId
      }
    };

    // Thêm thông tin guest token nếu là guest booking
    if (isGuestBooking) {
      responseData.guestInfo = {
        token: user.guestInfo.temporaryToken,
        message: 'Vui lòng lưu mã tra cứu để kiểm tra booking sau này',
        lookupUrl: `/api/bookings/lookup/${bookingReference}`
      };
    }

    // Ghi nhận sử dụng payment code (sẽ được confirm khi payment thành công)
    // Lưu vào session để xử lý sau khi payment callback
    if (usedPaymentCode && user) {
      // Lưu thông tin để xử lý sau khi payment thành công
      booking.metadata.pendingPaymentCode = {
        paymentCodeId: usedPaymentCode._id,
        userId: user._id,
        discountAmount: paymentCodeDiscount
      };
      await booking.save();
    }

    const response = ApiResponse.created(responseData, 'Tạo booking thành công');
    response.send(res);
  });

  // Lấy thông tin booking
  static getBooking = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('flights.flight', 'flightNumber route airline status')
      .populate('flights.flight.route.departure.airport', 'code name')
      .populate('flights.flight.route.arrival.airport', 'code name')
      .populate('payment');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Check if user has permission to view this booking
    // Guest (req.user = null) can view any booking
    // Logged-in user can only view their own bookings
    if (req.user && booking.user) {
      // Both user and booking have user - check ownership
      if (booking.user.toString() !== req.user.id) {
        return next(new AppError('Bạn không có quyền xem booking này', 403));
      }
    }
    // Guest booking (booking.user = null) can be viewed by anyone with the ID
    // This allows payment callback to access guest bookings

    const response = ApiResponse.success(booking, 'Lấy thông tin booking thành công');
    response.send(res);
  });

  // Tìm booking bằng reference
  static findBookingByReference = asyncHandler(async (req, res, next) => {
    const { reference, email } = req.body;

    if (!reference || !email) {
      return next(new AppError('Vui lòng cung cấp mã đặt chỗ và email', 400));
    }

    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase(),
      'contactInfo.email': email.toLowerCase()
    })
      .populate('flights.flight', 'flightNumber route airline status')
      .populate('flights.flight.route.departure.airport', 'code name')
      .populate('flights.flight.route.arrival.airport', 'code name')
      .populate('payment');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking với thông tin đã cung cấp', 404));
    }

    const response = ApiResponse.success(booking, 'Tìm booking thành công');
    response.send(res);
  });

  // Thanh toán lại cho booking pending/failed
  static retryPayment = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;

    // Tìm booking
    const booking = await Booking.findById(bookingId)
      .populate('flights.flight');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Kiểm tra quyền truy cập
    if (req.user && booking.user) {
      if (booking.user.toString() !== req.user.id) {
        return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
      }
    }

    // Chỉ cho phép retry với status pending hoặc failed
    if (!['pending', 'failed'].includes(booking.status)) {
      return next(new AppError(`Không thể thanh toán lại booking với trạng thái ${booking.status}`, 400));
    }

    // Kiểm tra thời hạn - không cho retry quá 24h
    const hoursSinceCreated = (Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 24) {
      return next(new AppError('Booking đã quá hạn thanh toán (24 giờ). Vui lòng đặt chỗ mới', 400));
    }

    // Kiểm tra chuyến bay còn chỗ không
    for (const flightBooking of booking.flights) {
      const flight = flightBooking.flight;
      const inventory = await Inventory.findOne({ flight: flight._id });
      
      if (!inventory) {
        return next(new AppError('Không tìm thấy thông tin chỗ ngồi', 404));
      }

      const requestedSeats = flightBooking.passengers.length;
      if (inventory.available < requestedSeats) {
        return next(new AppError(`Chuyến bay ${flight.flightNumber} không còn đủ chỗ trống`, 400));
      }
    }

    // Tạo payment mới
    try {
      const paymentGatewayService = require('../services/paymentGatewayService');
      const paymentResult = await paymentGatewayService.createPayment({
        amount: booking.payment.totalAmount,
        orderId: booking.bookingReference,
        orderInfo: `Thanh toán booking ${booking.bookingReference}`,
        returnUrl: process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/payment/callback',
        ipAddr: req.ip || '127.0.0.1',
        locale: 'vn'
      });

      // Cập nhật payment status về pending
      booking.payment.status = 'pending';
      booking.payment.retryCount = (booking.payment.retryCount || 0) + 1;
      booking.payment.lastRetryAt = new Date();
      booking.status = 'pending';
      await booking.save();

      const response = ApiResponse.success({
        paymentUrl: paymentResult.paymentUrl,
        paymentId: paymentResult.paymentId,
        booking: {
          id: booking._id,
          reference: booking.bookingReference,
          status: booking.status
        }
      }, 'Đã tạo yêu cầu thanh toán mới');
      response.send(res);
    } catch (error) {
      console.error('Error creating retry payment:', error);
      return next(new AppError('Không thể tạo yêu cầu thanh toán. Vui lòng thử lại sau', 500));
    }
  });

  // Cleanup bookings cũ (pending/failed quá 24h)
  static cleanupExpiredBookings = asyncHandler(async (req, res, next) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Tìm và xóa bookings pending/failed quá 24h
      const result = await Booking.deleteMany({
        status: { $in: ['pending', 'failed'] },
        createdAt: { $lt: twentyFourHoursAgo }
      });

      const response = ApiResponse.success({
        deletedCount: result.deletedCount,
        cleanupTime: new Date().toISOString()
      }, `Đã xóa ${result.deletedCount} booking hết hạn`);
      response.send(res);
    } catch (error) {
      console.error('Error cleaning up expired bookings:', error);
      return next(new AppError('Không thể thực hiện cleanup', 500));
    }
  });

  // Tra cứu booking cho guest bằng reference (GET endpoint)
  static guestBookingLookup = asyncHandler(async (req, res, next) => {
    // Support both :reference and :bookingCode params
    const reference = req.params.reference || req.params.bookingCode;
    const { documentNumber } = req.query;

    if (!reference) {
      return next(new AppError('Vui lòng cung cấp mã đặt chỗ', 400));
    }

    // Check-in chỉ cần mã booking + CCCD/Passport
    if (!documentNumber) {
      return next(new AppError('Vui lòng cung cấp số CCCD/Passport', 400));
    }

    // Tìm booking theo reference
    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase()
    })
      .populate('flights.flight', 'flightNumber route airline status aircraft')
      .populate('flights.flight.route.departure.airport', 'code name city country timezone')
      .populate('flights.flight.route.arrival.airport', 'code name city country timezone')
      .populate('flights.flight.airline', 'name code logo')
      .populate('payment')
      .populate({
        path: 'user',
        select: 'isGuest guestInfo contactInfo',
        match: { isGuest: true }
      });

    if (!booking) {
      return next(new AppError('Không tìm thấy booking với mã đặt chỗ này', 404));
    }

    // Verify documentNumber - check-in yêu cầu CCCD/Passport khớp
    const hasMatchingDocument = booking.flights.some(flight =>
      flight.passengers.some(p => 
        p.document && p.document.number && 
        p.document.number.toLowerCase() === documentNumber.toLowerCase()
      )
    );

    if (!hasMatchingDocument) {
      return next(new AppError('Số CCCD/Passport không khớp với thông tin đặt vé', 403));
    }

    // Tạo response data phù hợp cho guest
    const responseData = {
      booking: {
        ...booking.toObject(),
        // Ẩn một số thông tin nhạy cảm không cần thiết cho guest
        user: undefined,
        metadata: {
          bookingSource: booking.metadata?.bookingSource,
          isGuestBooking: booking.metadata?.isGuestBooking
        }
      },
      lookupInfo: {
        message: 'Booking được tìm thấy thành công',
        instructions: [
          'Lưu mã booking để tra cứu sau này',
          'Kiểm tra email để nhận thông tin cập nhật',
          'Liên hệ hotline nếu cần hỗ trợ'
        ]
      }
    };

    const response = ApiResponse.success(responseData, 'Tra cứu booking thành công');
    response.send(res);
  });

  // Lấy danh sách booking của user
  static getUserBookings = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      status,
      fromDate,
      toDate
    } = req.query;

    const query = { user: req.user.id };
    
    if (status) query.status = status;
    
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate({
          path: 'flights.flight',
          select: 'flightNumber status route',
          populate: {
            path: 'route',
            select: 'departure arrival',
            populate: [
              { path: 'departure.airport', select: 'code name city' },
              { path: 'arrival.airport', select: 'code name city' }
            ]
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = ApiResponse.success({
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }, 'Lấy danh sách booking thành công');
    response.send(res);
  });

  // Cập nhật thông tin booking
  static updateBooking = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const updateData = req.body;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Check if user has permission to update this booking
    if (req.user && booking.user && booking.user.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền cập nhật booking này', 403));
    }

    // Validate what can be updated based on booking status
    const allowedUpdates = ['contact', 'passengers.meal', 'passengers.seat'];
    
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      return next(new AppError('Không thể cập nhật booking đã xác nhận', 400));
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    const response = ApiResponse.success(updatedBooking, 'Cập nhật booking thành công');
    response.send(res);
  });

  // Hủy booking
  static cancelBooking = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('flights.flight');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Check if user has permission to cancel this booking
    if (req.user && booking.user && booking.user.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền hủy booking này', 403));
    }

    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return next(new AppError('Booking đã được hủy trước đó', 400));
    }

    // Check if cancellation is allowed (e.g., not too close to departure)
    const now = new Date();
    const departureTime = new Date(booking.flights[0].flight.route.departure.time);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 2) {
      return next(new AppError('Không thể hủy booking trong vòng 2 giờ trước giờ khởi hành', 400));
    }

    // Calculate cancellation fee
    let cancellationFee = 0;
    if (hoursUntilDeparture < 24) {
      cancellationFee = booking.pricing.total * 0.1; // 10% fee
    }

    const refundAmount = booking.pricing.total - cancellationFee;

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: now,
      reason: reason || 'Customer request',
      cancellationFee,
      refundAmount,
      refundStatus: 'pending'
    };

    await booking.save();

    // Release held seats back to inventory
    for (const flightBooking of booking.flights) {
      await Inventory.findOneAndUpdate(
        { 
          flight: flightBooking.flight._id,
          'bookingClasses.category': flightBooking.seatClass
        },
        { 
          $inc: { 
            'bookingClasses.$.held': -booking.passengers.length,
            'bookingClasses.$.available': booking.passengers.length
          }
        }
      );
    }

    const response = ApiResponse.success({
        booking,
        refundInfo: {
          originalAmount: booking.pricing.total,
          cancellationFee,
          refundAmount,
          refundStatus: 'pending'
        }
      }, 'Hủy booking thành công');
    response.send(res);
  });

  // Check-in trực tuyến
  static onlineCheckin = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const { passengers: passengerCheckIns } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('flights.flight');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Kiểm tra booking đã được xác nhận và thanh toán
    if (booking.status !== 'confirmed' && booking.payment?.status !== 'paid') {
      return next(new AppError('Booking chưa được xác nhận hoặc thanh toán. Vui lòng hoàn tất thanh toán trước khi check-in', 400));
    }

    // Check if check-in window is open (24h - 2h before departure)
    const now = new Date();
    const departureTime = new Date(booking.flights[0].flight.route.departure.time);
    const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntilDeparture > 24) {
      return next(new AppError('Check-in mở 24 giờ trước giờ khởi hành', 400));
    }

    if (hoursUntilDeparture < 2) {
      return next(new AppError('Check-in đóng 2 giờ trước giờ khởi hành', 400));
    }

    // Update passenger check-in status
    for (const passengerCheckIn of passengerCheckIns) {
      const passenger = booking.passengers.id(passengerCheckIn.passengerId);
      if (passenger) {
        passenger.checkIn = {
          status: 'checked_in',
          checkedInAt: now,
          seatNumber: passengerCheckIn.seatNumber,
          boardingPass: this.generateBoardingPassNumber()
        };
      }
    }

    booking.checkInStatus = 'checked_in';
    await booking.save();

    const response = ApiResponse.success(booking, 'Check-in thành công');
    response.send(res);
  });

  // Download booking ticket PDF
  static downloadBookingPDF = asyncHandler(async (req, res, next) => {
    const { reference } = req.params;
    const userId = req.user?._id;

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase()
    })
      .populate({
        path: 'flights.flight',
        populate: {
          path: 'route.departure.airport route.arrival.airport'
        }
      })
      .populate('user');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Kiểm tra quyền truy cập
    // Nếu booking có user và có userId trong request (user đã đăng nhập)
    if (booking.user && userId) {
      // Kiểm tra ownership - chỉ user sở hữu booking mới được download
      if (booking.user._id.toString() !== userId.toString()) {
        return next(new AppError('Bạn không có quyền truy cập booking này', 403));
      }
    }
    // Guest booking (booking.user === null) không cần kiểm tra quyền

    try {
      // Generate PDF
      const pdfBuffer = await pdfService.generateBookingPDF(booking);

      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="VietJet-${booking.bookingReference}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      return next(new AppError('Không thể tạo file PDF. Vui lòng thử lại sau', 500));
    }
  });

  // Download booking ticket PDF cho guest (cần email verification)
  static downloadGuestBookingPDF = asyncHandler(async (req, res, next) => {
    const { reference } = req.params;
    const { email } = req.query;

    if (!email) {
      return next(new AppError('Vui lòng cung cấp email', 400));
    }

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase(),
      'contactInfo.email': email.toLowerCase()
    })
      .populate({
        path: 'flights.flight',
        populate: {
          path: 'route.departure.airport route.arrival.airport'
        }
      })
      .populate('user');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking với thông tin này', 404));
    }

    try {
      // Generate PDF
      const pdfBuffer = await pdfService.generateBookingPDF(booking);

      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="VietJet-${booking.bookingReference}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      return next(new AppError('Không thể tạo file PDF. Vui lòng thử lại sau', 500));
    }
  });

  // Resend booking confirmation email
  static resendBookingConfirmation = asyncHandler(async (req, res, next) => {
    const { reference } = req.params;
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Vui lòng cung cấp email', 400));
    }

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase(),
      'contactInfo.email': email.toLowerCase()
    })
      .populate({
        path: 'flights.flight',
        populate: {
          path: 'route.departure.airport route.arrival.airport aircraft'
        }
      })
      .populate('user');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Kiểm tra xem đã gửi trong 5 phút gần đây chưa (tránh spam)
    if (booking.notifications.bookingConfirmation.sent && 
        booking.notifications.bookingConfirmation.sentAt) {
      const lastSent = new Date(booking.notifications.bookingConfirmation.sentAt);
      const now = new Date();
      const diffMinutes = (now - lastSent) / (1000 * 60);
      
      if (diffMinutes < 5) {
        return next(new AppError(`Vui lòng đợi ${Math.ceil(5 - diffMinutes)} phút trước khi gửi lại email`, 429));
      }
    }

    try {
      const emailService = require('../services/emailService');
      
      // Format flight details
      const flightDetails = booking.flights.map(f => ({
        flight: f.flight,
        passengers: f.passengers,
        fareClass: f.fareClass
      }));

      await emailService.sendBookingConfirmation(booking.user, booking, flightDetails);
      
      // Cập nhật flag
      booking.notifications.bookingConfirmation.sent = true;
      booking.notifications.bookingConfirmation.sentAt = new Date();
      await booking.save();

      const response = ApiResponse.success(null, 'Email xác nhận đã được gửi lại thành công');
      response.send(res);
    } catch (error) {
      console.error('Error resending booking confirmation:', error);
      return next(new AppError('Không thể gửi email. Vui lòng thử lại sau', 500));
    }
  });

  // Helper methods
  static generateBookingReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateTicketNumber() {
    return '157' + Date.now().toString().slice(-10); // VietJet prefix + timestamp
  }

  static generateETicketNumber() {
    return 'VJ' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  static generateBoardingPassNumber() {
    return 'BP' + Date.now().toString().slice(-8);
  }
}

module.exports = BookingController;