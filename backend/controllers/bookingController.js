const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const Fare = require('../models/Fare');
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
      promoCode
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

      // Get fare for this flight
      const fare = await Fare.findOne({
        route: flight.route,
        cabinClass: seatClass,
        'validity.startDate': { $lte: flight.route.departure.time },
        'validity.endDate': { $gte: flight.route.departure.time }
      });

      if (!fare) {
        return next(new AppError(`Không tìm thấy giá vé cho chuyến bay ${flight.flightNumber}`, 400));
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
    if (promoCode) {
      // TODO: Implement promo code validation and discount calculation
      // For now, just a placeholder
    }

    const finalAmount = totalAmount - discountAmount;

    // Generate booking reference
    const bookingReference = this.generateBookingReference();

    // Create booking
    const booking = await Booking.create({
      bookingReference,
      user: user._id, // Luôn có user (guest hoặc registered)
      
      // Contact information
      contact: {
        title: contactInfo.title,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: contactInfo.address
      },

      // Flight information
      flights: flights.map((flightBooking, index) => ({
        flight: flightBooking.flightId,
        seatClass: flightBooking.seatClass || 'economy',
        bookingClass: 'Y', // Default booking class
        status: 'confirmed'
      })),

      // Passengers
      passengers: passengers.map(passenger => ({
        ...passenger,
        ticket: {
          seatClass: flights[0].seatClass || 'economy',
          ticketNumber: this.generateTicketNumber(),
          eTicketNumber: this.generateETicketNumber()
        }
      })),

      // Services
      services,

      // Pricing
      pricing: {
        subtotal: totalAmount - serviceAmount,
        serviceCharges: serviceAmount,
        discount: discountAmount,
        total: finalAmount,
        currency: 'VND'
      },

      // Status
      status: 'pending_payment',
      
      // Metadata
      metadata: {
        bookingSource: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        isGuestBooking: isGuestBooking
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
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      
      await emailService.sendBookingConfirmation(user, booking, flightDetails);
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Không fail booking nếu email lỗi
    }

    const responseData = {
      booking,
      paymentInfo: {
        amount: finalAmount,
        currency: 'VND',
        reference: bookingReference
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

    res.status(201).json(
      ApiResponse.success('Tạo booking thành công', responseData)
    );
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
    if (req.user && booking.user && booking.user.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền xem booking này', 403));
    }

    res.status(200).json(
      ApiResponse.success('Lấy thông tin booking thành công', booking)
    );
  });

  // Tìm booking bằng reference
  static findBookingByReference = asyncHandler(async (req, res, next) => {
    const { reference, email } = req.body;

    if (!reference || !email) {
      return next(new AppError('Vui lòng cung cấp mã đặt chỗ và email', 400));
    }

    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase(),
      'contact.email': email.toLowerCase()
    })
      .populate('flights.flight', 'flightNumber route airline status')
      .populate('flights.flight.route.departure.airport', 'code name')
      .populate('flights.flight.route.arrival.airport', 'code name')
      .populate('payment');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking với thông tin đã cung cấp', 404));
    }

    res.status(200).json(
      ApiResponse.success('Tìm booking thành công', booking)
    );
  });

  // Tra cứu booking cho guest bằng reference (GET endpoint)
  static guestBookingLookup = asyncHandler(async (req, res, next) => {
    const { reference } = req.params;
    const { email, phone } = req.query;

    if (!reference) {
      return next(new AppError('Vui lòng cung cấp mã đặt chỗ', 400));
    }

    if (!email && !phone) {
      return next(new AppError('Vui lòng cung cấp email hoặc số điện thoại', 400));
    }

    const query = {
      bookingReference: reference.toUpperCase()
    };

    // Tìm kiếm bằng email hoặc phone
    if (email && phone) {
      query.$or = [
        { 'contact.email': email.toLowerCase() },
        { 'contact.phone': phone }
      ];
    } else if (email) {
      query['contact.email'] = email.toLowerCase();
    } else if (phone) {
      query['contact.phone'] = phone;
    }

    const booking = await Booking.findOne(query)
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
      return next(new AppError('Không tìm thấy booking với thông tin đã cung cấp', 404));
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

    res.status(200).json(
      ApiResponse.success('Tra cứu booking thành công', responseData)
    );
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
        .populate('flights.flight', 'flightNumber route status')
        .populate('flights.flight.route.departure.airport', 'code name')
        .populate('flights.flight.route.arrival.airport', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      ApiResponse.success('Lấy danh sách booking thành công', {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      })
    );
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

    res.status(200).json(
      ApiResponse.success('Cập nhật booking thành công', updatedBooking)
    );
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

    res.status(200).json(
      ApiResponse.success('Hủy booking thành công', {
        booking,
        refundInfo: {
          originalAmount: booking.pricing.total,
          cancellationFee,
          refundAmount,
          refundStatus: 'pending'
        }
      })
    );
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

    if (booking.status !== 'confirmed') {
      return next(new AppError('Booking chưa được xác nhận', 400));
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

    res.status(200).json(
      ApiResponse.success('Check-in thành công', booking)
    );
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