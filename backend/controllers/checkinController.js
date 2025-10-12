const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const NotificationController = require('./notificationController');
const emailService = require('../services/emailService');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const QRCode = require('qrcode');
const crypto = require('crypto');

class CheckinController {
  // Kiểm tra điều kiện check-in
  static checkEligibility = asyncHandler(async (req, res, next) => {
    const { bookingReference, lastName } = req.body;

    if (!bookingReference || !lastName) {
      return next(new AppError('Vui lòng nhập mã đặt chỗ và họ tên', 400));
    }

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: bookingReference.toUpperCase()
    }).populate({
      path: 'flights.flight',
      populate: {
        path: 'route.departure.airport route.arrival.airport'
      }
    });

    if (!booking) {
      return next(new AppError('Không tìm thấy thông tin đặt chỗ', 404));
    }

    // Kiểm tra họ tên
    const passengerExists = booking.flights.some(flight =>
      flight.passengers.some(passenger =>
        passenger.lastName.toLowerCase() === lastName.toLowerCase()
      )
    );

    if (!passengerExists) {
      return next(new AppError('Họ tên không khớp với thông tin đặt chỗ', 400));
    }

    // Kiểm tra trạng thái booking
    if (booking.status !== 'confirmed') {
      return next(new AppError('Booking chưa được xác nhận hoặc đã bị hủy', 400));
    }

    if (booking.payment.status !== 'paid') {
      return next(new AppError('Vé chưa được thanh toán', 400));
    }

    // Kiểm tra thời gian check-in cho từng chuyến bay
    const eligibilityInfo = [];
    const now = new Date();

    for (const flightBooking of booking.flights) {
      const flight = flightBooking.flight;
      const departureTime = new Date(flight.route.departure.time);
      
      // Check-in mở từ 24h trước và đóng 1h trước giờ khởi hành
      const checkInOpenTime = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000);
      const checkInCloseTime = new Date(departureTime.getTime() - 60 * 60 * 1000);

      let status = 'not_available';
      let message = '';

      if (now < checkInOpenTime) {
        status = 'too_early';
        message = `Check-in mở vào ${checkInOpenTime.toLocaleString('vi-VN')}`;
      } else if (now > checkInCloseTime) {
        status = 'too_late';
        message = 'Đã quá thời gian check-in online. Vui lòng check-in tại sân bay';
      } else {
        status = 'available';
        message = 'Có thể check-in';
      }

      // Kiểm tra đã check-in chưa
      const checkedInPassengers = flightBooking.passengers.filter(p => p.checkIn.isCheckedIn);
      
      eligibilityInfo.push({
        flightId: flight._id,
        flightNumber: flight.flightNumber,
        route: {
          from: flight.route.departure.airport.code.iata,
          to: flight.route.arrival.airport.code.iata,
          fromName: flight.route.departure.airport.name.vi,
          toName: flight.route.arrival.airport.name.vi
        },
        departureTime: flight.route.departure.time,
        status,
        message,
        totalPassengers: flightBooking.passengers.length,
        checkedInPassengers: checkedInPassengers.length,
        canCheckIn: status === 'available' && checkedInPassengers.length < flightBooking.passengers.length
      });
    }

    const response = ApiResponse.success({
      booking: {
        bookingReference: booking.bookingReference,
        pnr: booking.pnr,
        contactInfo: booking.contactInfo
      },
      flights: eligibilityInfo
    }, 'Kiểm tra điều kiện check-in thành công');

    response.send(res);
  });

  // Check-in hành khách
  static performCheckin = asyncHandler(async (req, res, next) => {
    const { bookingReference, flightId, passengers } = req.body;

    if (!bookingReference || !flightId || !passengers || passengers.length === 0) {
      return next(new AppError('Thiếu thông tin check-in', 400));
    }

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: bookingReference.toUpperCase()
    }).populate('flights.flight');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Tìm chuyến bay
    const flightBookingIndex = booking.flights.findIndex(f => f.flight._id.toString() === flightId);
    if (flightBookingIndex === -1) {
      return next(new AppError('Không tìm thấy chuyến bay trong booking', 404));
    }

    const flightBooking = booking.flights[flightBookingIndex];
    const flight = flightBooking.flight;

    // Kiểm tra thời gian check-in
    const now = new Date();
    const departureTime = new Date(flight.route.departure.time);
    const checkInOpenTime = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000);
    const checkInCloseTime = new Date(departureTime.getTime() - 60 * 60 * 1000);

    if (now < checkInOpenTime) {
      return next(new AppError('Chưa đến thời gian check-in', 400));
    }

    if (now > checkInCloseTime) {
      return next(new AppError('Đã quá thời gian check-in online', 400));
    }

    // Thực hiện check-in cho từng hành khách
    const checkedInPassengers = [];
    const boardingPasses = [];

    for (const passengerCheckIn of passengers) {
      const passengerIndex = flightBooking.passengers.findIndex(p => 
        p._id.toString() === passengerCheckIn.passengerId
      );

      if (passengerIndex === -1) {
        continue; // Skip nếu không tìm thấy hành khách
      }

      const passenger = flightBooking.passengers[passengerIndex];

      // Kiểm tra đã check-in chưa
      if (passenger.checkIn.isCheckedIn) {
        continue; // Skip nếu đã check-in
      }

      // Tự động gán ghế nếu chưa chọn
      let seatNumber = passenger.ticket.seatNumber;
      if (!seatNumber && passengerCheckIn.autoAssignSeat !== false) {
        seatNumber = await this.autoAssignSeat(flight, passenger.ticket.seatClass, booking._id);
        if (seatNumber) {
          passenger.ticket.seatNumber = seatNumber;
        }
      }

      // Tạo boarding pass
      const boardingPass = await this.generateBoardingPass(booking, flight, passenger, seatNumber);

      // Cập nhật thông tin check-in
      passenger.checkIn = {
        isCheckedIn: true,
        checkedInAt: now,
        checkedInBy: 'online',
        boardingPass: boardingPass
      };

      checkedInPassengers.push({
        passengerId: passenger._id,
        name: `${passenger.firstName} ${passenger.lastName}`,
        seatNumber: seatNumber,
        boardingGroup: passenger.ticket.boardingGroup
      });

      boardingPasses.push(boardingPass);
    }

    if (checkedInPassengers.length === 0) {
      return next(new AppError('Không có hành khách nào được check-in', 400));
    }

    // Lưu booking
    await booking.save();

    // Gửi thông báo check-in thành công
    if (booking.user) {
      await NotificationController.createNotification({
        body: {
          userId: booking.user,
          type: 'check_in_success',
          title: 'Check-in thành công!',
          message: `Bạn đã check-in thành công cho chuyến bay ${flight.flightNumber}. Thẻ lên máy bay đã sẵn sàng!`,
          relatedData: {
            booking: booking._id,
            flight: flight._id
          },
          priority: 'high'
        }
      });
    }

    // Gửi email boarding pass cho từng hành khách đã check-in
    for (const checkedInPassenger of checkedInPassengers) {
      try {
        const passenger = flightBooking.passengers.find(
          p => p._id.toString() === checkedInPassenger.passengerId.toString()
        );
        
        if (passenger && booking.contactInfo && booking.contactInfo.email) {
          const checkinData = {
            seatNumber: checkedInPassenger.seatNumber,
            fareClass: passenger.fareClass || 'Economy',
            gate: flight.route.departure.gate,
            boardingGroup: passenger.ticket?.boardingGroup || 'A'
          };

          await emailService.sendBoardingPass(booking, flight, passenger, checkinData);
          console.log(`✅ Đã gửi boarding pass email cho ${passenger.firstName} ${passenger.lastName}`);
        }
      } catch (emailError) {
        console.error('❌ Lỗi gửi boarding pass email:', emailError);
        // Không throw error để không ảnh hưởng đến quá trình check-in
      }
    }

    const response = ApiResponse.success({
      bookingReference: booking.bookingReference,
      flightNumber: flight.flightNumber,
      checkedInPassengers,
      boardingPasses,
      checkInTime: now,
      departureTime: flight.route.departure.time,
      gate: flight.route.departure.gate,
      terminal: flight.route.departure.terminal
    }, 'Check-in thành công');

    response.send(res);
  });

  // Lấy thẻ lên máy bay
  static getBoardingPass = asyncHandler(async (req, res, next) => {
    const { bookingReference, passengerId } = req.params;

    // Tìm booking
    const booking = await Booking.findOne({
      bookingReference: bookingReference.toUpperCase()
    }).populate({
      path: 'flights.flight',
      populate: {
        path: 'route.departure.airport route.arrival.airport'
      }
    });

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    // Tìm hành khách đã check-in
    let boardingPass = null;
    let flightInfo = null;

    for (const flightBooking of booking.flights) {
      const passenger = flightBooking.passengers.find(p => 
        p._id.toString() === passengerId && p.checkIn.isCheckedIn
      );

      if (passenger) {
        boardingPass = passenger.checkIn.boardingPass;
        flightInfo = flightBooking.flight;
        break;
      }
    }

    if (!boardingPass) {
      return next(new AppError('Hành khách chưa check-in hoặc không tìm thấy', 404));
    }

    const response = ApiResponse.success({
      boardingPass,
      flight: {
        flightNumber: flightInfo.flightNumber,
        route: {
          departure: {
            airport: flightInfo.route.departure.airport.name.vi,
            code: flightInfo.route.departure.airport.code.iata,
            time: flightInfo.route.departure.time,
            terminal: flightInfo.route.departure.terminal,
            gate: flightInfo.route.departure.gate
          },
          arrival: {
            airport: flightInfo.route.arrival.airport.name.vi,
            code: flightInfo.route.arrival.airport.code.iata,
            time: flightInfo.route.arrival.time
          }
        }
      }
    }, 'Lấy thẻ lên máy bay thành công');

    response.send(res);
  });

  // Tạo QR code cho mobile boarding pass
  static generateMobileBoardingPass = asyncHandler(async (req, res, next) => {
    const { bookingReference, passengerId } = req.params;

    // Tìm boarding pass
    const booking = await Booking.findOne({
      bookingReference: bookingReference.toUpperCase()
    });

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    let boardingPass = null;
    for (const flightBooking of booking.flights) {
      const passenger = flightBooking.passengers.find(p => 
        p._id.toString() === passengerId && p.checkIn.isCheckedIn
      );

      if (passenger) {
        boardingPass = passenger.checkIn.boardingPass;
        break;
      }
    }

    if (!boardingPass) {
      return next(new AppError('Chưa check-in hoặc không tìm thấy thẻ lên máy bay', 404));
    }

    // Tạo QR code
    const qrCodeData = JSON.stringify({
      bookingReference: booking.bookingReference,
      passengerId: passengerId,
      barcodeData: boardingPass.barcodeData,
      timestamp: Date.now()
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const response = ApiResponse.success({
      qrCode: qrCodeImage,
      qrCodeData: boardingPass.qrCodeData,
      boardingPass
    }, 'Tạo mobile boarding pass thành công');

    response.send(res);
  });

  // Lấy trạng thái check-in của booking
  static getCheckinStatus = asyncHandler(async (req, res, next) => {
    const { bookingReference } = req.params;

    const booking = await Booking.findOne({
      bookingReference: bookingReference.toUpperCase()
    }).populate('flights.flight', 'flightNumber route.departure.time route.departure.gate');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    const checkinStatus = booking.flights.map(flightBooking => {
      const flight = flightBooking.flight;
      const passengers = flightBooking.passengers.map(passenger => ({
        passengerId: passenger._id,
        name: `${passenger.firstName} ${passenger.lastName}`,
        isCheckedIn: passenger.checkIn.isCheckedIn,
        checkedInAt: passenger.checkIn.checkedInAt,
        seatNumber: passenger.ticket.seatNumber,
        boardingGroup: passenger.ticket.boardingGroup,
        hasBoardingPass: !!passenger.checkIn.boardingPass
      }));

      const checkedInCount = passengers.filter(p => p.isCheckedIn).length;

      return {
        flightId: flight._id,
        flightNumber: flight.flightNumber,
        departureTime: flight.route.departure.time,
        gate: flight.route.departure.gate,
        totalPassengers: passengers.length,
        checkedInPassengers: checkedInCount,
        allCheckedIn: checkedInCount === passengers.length,
        passengers
      };
    });

    const response = ApiResponse.success({
      bookingReference: booking.bookingReference,
      flights: checkinStatus
    }, 'Lấy trạng thái check-in thành công');

    response.send(res);
  });

  // Helper methods

  // Tự động gán ghế
  static async autoAssignSeat(flight, seatClass, bookingId) {
    try {
      // Lấy ghế đã được đặt
      const bookings = await Booking.find({
        'flights.flight': flight._id,
        _id: { $ne: bookingId },
        status: { $in: ['confirmed', 'checked_in'] }
      }).select('flights.passengers.ticket.seatNumber').lean();

      const occupiedSeats = new Set();
      bookings.forEach(booking => {
        booking.flights.forEach(flightBooking => {
          flightBooking.passengers.forEach(passenger => {
            if (passenger.ticket.seatNumber) {
              occupiedSeats.add(passenger.ticket.seatNumber);
            }
          });
        });
      });

      // Tìm ghế trống phù hợp
      for (const row of flight.seatMap) {
        const availableSeats = row.seats.filter(seat => 
          seat.class === seatClass &&
          seat.status === 'available' &&
          !occupiedSeats.has(seat.seatNumber) &&
          seat.price === 0 // Chỉ gán ghế miễn phí
        );

        if (availableSeats.length > 0) {
          // Ưu tiên ghế giữa, sau đó ghế cửa sổ
          availableSeats.sort((a, b) => {
            const scoreA = a.type === 'middle' ? 2 : (a.type === 'window' ? 1 : 0);
            const scoreB = b.type === 'middle' ? 2 : (b.type === 'window' ? 1 : 0);
            return scoreB - scoreA;
          });

          return availableSeats[0].seatNumber;
        }
      }

      return null;
    } catch (error) {
      console.error('Error auto-assigning seat:', error);
      return null;
    }
  }

  // Tạo boarding pass
  static async generateBoardingPass(booking, flight, passenger, seatNumber) {
    const boardingTime = new Date(flight.route.departure.time);
    boardingTime.setMinutes(boardingTime.getMinutes() - 30); // 30 phút trước giờ bay

    // Tạo mã barcode
    const barcodeData = `M1${passenger.lastName.substring(0,2).toUpperCase()}${passenger.firstName.substring(0,1).toUpperCase()} ${booking.pnr}${flight.route.departure.airport.code.iata}${flight.route.arrival.airport.code.iata}${flight.flightNumber}${seatNumber || ''}`;

    // Tạo mã QR
    const qrCodeData = crypto.createHash('sha256')
      .update(`${booking.bookingReference}-${passenger._id}-${flight._id}-${Date.now()}`)
      .digest('hex');

    return {
      barcodeData,
      qrCodeData,
      gate: flight.route.departure.gate || 'TBA',
      boardingTime,
      priority: this.getBoardingPriority(passenger.ticket.seatClass, passenger.ticket.boardingGroup),
      sequenceNumber: Math.floor(Math.random() * 1000),
      issuedAt: new Date()
    };
  }

  // Xác định độ ưu tiên boarding
  static getBoardingPriority(seatClass, boardingGroup) {
    const classPriority = {
      'first': 1,
      'business': 2,
      'premium_economy': 3,
      'economy': 4
    };

    const groupPriority = {
      'A': 1,
      'B': 2,
      'C': 3,
      'D': 4
    };

    return Math.min(classPriority[seatClass] || 4, groupPriority[boardingGroup] || 4);
  }

  // Admin: Get all check-ins
  static getAllCheckins = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      flight,
      status,
      dateFrom,
      dateTo
    } = req.query;

    // Build query - tìm bookings có check-in
    const query = {};
    
    if (flight) {
      query['flights.flight'] = flight;
    }
    
    if (status) {
      if (status === 'checked_in') {
        query['flights.passengers.checkIn.isCheckedIn'] = true;
      } else if (status === 'pending') {
        query['flights.passengers.checkIn.isCheckedIn'] = false;
      }
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'flights.flight',
        select: 'flightNumber route.departure.time route.departure.airport route.arrival.airport',
        populate: {
          path: 'route.departure.airport route.arrival.airport',
          select: 'code.iata name.vi'
        }
      })
      .populate('user', 'personalInfo.firstName personalInfo.lastName contactInfo.email')
      .lean();

    // Transform data để có danh sách check-in
    const checkins = [];
    bookings.forEach(booking => {
      booking.flights.forEach(flightBooking => {
        flightBooking.passengers.forEach(passenger => {
          checkins.push({
            _id: `${booking._id}_${flightBooking.flight._id}_${passenger._id}`,
            bookingReference: booking.bookingReference,
            flight: flightBooking.flight,
            passenger: {
              firstName: passenger.firstName,
              lastName: passenger.lastName,
              type: passenger.type
            },
            seat: passenger.ticket?.seatNumber || 'N/A',
            checkIn: passenger.checkIn,
            status: passenger.checkIn.isCheckedIn ? 'checked_in' : 'pending',
            createdAt: booking.createdAt
          });
        });
      });
    });

    // Get total count
    const total = await Booking.countDocuments(query);

    const response = ApiResponse.success({
      checkins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách check-in thành công');

    response.send(res);
  });
}

module.exports = CheckinController;