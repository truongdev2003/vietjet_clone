const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class SeatController {
  // Lấy sơ đồ ghế của chuyến bay
  static getSeatMap = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;

    const flight = await Flight.findById(flightId)
      .populate('route.departure.airport', 'code name')
      .populate('route.arrival.airport', 'code name')
      .lean();

    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Lấy thông tin ghế đã được đặt
    const bookings = await Booking.find({
      'flights.flight': flightId,
      status: { $in: ['confirmed', 'checked_in'] }
    }).select('flights.passengers.ticket.seatNumber').lean();

    // Tạo danh sách ghế đã được đặt
    const occupiedSeats = new Set();
    bookings.forEach(booking => {
      booking.flights.forEach(flightBooking => {
        if (flightBooking.flight.toString() === flightId) {
          flightBooking.passengers.forEach(passenger => {
            if (passenger.ticket.seatNumber) {
              occupiedSeats.add(passenger.ticket.seatNumber);
            }
          });
        }
      });
    });

    // Cập nhật trạng thái ghế trong seatMap
    const seatMap = flight.seatMap.map(row => ({
      ...row,
      seats: row.seats.map(seat => ({
        ...seat,
        status: occupiedSeats.has(seat.seatNumber) ? 'occupied' : seat.status,
        available: !occupiedSeats.has(seat.seatNumber) && seat.status === 'available'
      }))
    }));

    const response = ApiResponse.success({
      flight: {
        flightNumber: flight.flightNumber,
        route: flight.route,
        aircraft: flight.aircraft,
        departure: flight.route.departure.time
      },
      seatMap,
      occupiedCount: occupiedSeats.size,
      availableCount: flight.totalAvailable - occupiedSeats.size
    }, 'Lấy sơ đồ ghế thành công');

    response.send(res);
  });

  // Chọn ghế cho hành khách
  static selectSeat = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const { flightId, passengerId, seatNumber } = req.body;
    const userId = req.user.userId;

    // Validate booking ownership
    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [
        { user: userId },
        { 'contactInfo.email': req.user.email }
      ]
    });

    if (!booking) {
      return next(new AppError('Không tìm thấy booking hoặc không có quyền truy cập', 404));
    }

    // Tìm chuyến bay và hành khách
    const flightBooking = booking.flights.find(f => f.flight.toString() === flightId);
    if (!flightBooking) {
      return next(new AppError('Không tìm thấy chuyến bay trong booking', 404));
    }

    const passengerIndex = flightBooking.passengers.findIndex(p => p._id.toString() === passengerId);
    if (passengerIndex === -1) {
      return next(new AppError('Không tìm thấy hành khách', 404));
    }

    // Lấy thông tin chuyến bay
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Kiểm tra ghế có tồn tại trong seatMap
    let seatInfo = null;
    for (const row of flight.seatMap) {
      const seat = row.seats.find(s => s.seatNumber === seatNumber);
      if (seat) {
        seatInfo = seat;
        break;
      }
    }

    if (!seatInfo) {
      return next(new AppError('Ghế không tồn tại', 400));
    }

    if (seatInfo.status !== 'available') {
      return next(new AppError('Ghế không khả dụng', 400));
    }

    // Kiểm tra ghế đã được đặt bởi ai khác chưa
    const existingBooking = await Booking.findOne({
      'flights.flight': flightId,
      'flights.passengers.ticket.seatNumber': seatNumber,
      _id: { $ne: bookingId },
      status: { $in: ['confirmed', 'checked_in'] }
    });

    if (existingBooking) {
      return next(new AppError('Ghế đã được đặt bởi hành khách khác', 400));
    }

    // Kiểm tra hạng ghế có phù hợp với vé không
    const passenger = flightBooking.passengers[passengerIndex];
    const ticketClass = passenger.ticket.seatClass;
    
    if (seatInfo.class !== ticketClass) {
      // Cho phép upgrade với phí
      if (this.isUpgrade(ticketClass, seatInfo.class)) {
        const upgradeFee = this.calculateUpgradeFee(ticketClass, seatInfo.class);
        // Có thể thêm logic xử lý phí upgrade
      } else {
        return next(new AppError('Hạng ghế không phù hợp với vé', 400));
      }
    }

    // Tính phí chọn ghế (nếu có)
    const seatFee = seatInfo.price || 0;

    // Cập nhật ghế cho hành khách
    const updatePath = `flights.${booking.flights.findIndex(f => f.flight.toString() === flightId)}.passengers.${passengerIndex}.ticket.seatNumber`;
    
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        [updatePath]: seatNumber
      },
      $inc: {
        'payment.totalAmount': seatFee
      }
    });

    // Log seat selection
    console.log(`Seat ${seatNumber} selected for passenger ${passenger.firstName} ${passenger.lastName} on flight ${flight.flightNumber}`);

    const response = ApiResponse.success({
      seatNumber,
      seatClass: seatInfo.class,
      seatType: seatInfo.type,
      seatFee,
      passengerName: `${passenger.firstName} ${passenger.lastName}`
    }, 'Chọn ghế thành công');

    response.send(res);
  });

  // Hủy chọn ghế
  static unselectSeat = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const { flightId, passengerId } = req.body;
    const userId = req.user.userId;

    // Validate booking ownership
    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [
        { user: userId },
        { 'contactInfo.email': req.user.email }
      ]
    });

    if (!booking) {
      return next(new AppError('Không tìm thấy booking hoặc không có quyền truy cập', 404));
    }

    // Tìm chuyến bay và hành khách
    const flightIndex = booking.flights.findIndex(f => f.flight.toString() === flightId);
    if (flightIndex === -1) {
      return next(new AppError('Không tìm thấy chuyến bay trong booking', 404));
    }

    const passengerIndex = booking.flights[flightIndex].passengers.findIndex(p => p._id.toString() === passengerId);
    if (passengerIndex === -1) {
      return next(new AppError('Không tìm thấy hành khách', 404));
    }

    const passenger = booking.flights[flightIndex].passengers[passengerIndex];
    const currentSeat = passenger.ticket.seatNumber;

    if (!currentSeat) {
      return next(new AppError('Hành khách chưa chọn ghế', 400));
    }

    // Kiểm tra đã check-in chưa (không thể thay đổi ghế sau check-in)
    if (passenger.checkIn.isCheckedIn) {
      return next(new AppError('Không thể thay đổi ghế sau khi đã check-in', 400));
    }

    // Lấy thông tin ghế để tính phí hoàn trả
    const flight = await Flight.findById(flightId);
    let seatFee = 0;
    for (const row of flight.seatMap) {
      const seat = row.seats.find(s => s.seatNumber === currentSeat);
      if (seat) {
        seatFee = seat.price || 0;
        break;
      }
    }

    // Cập nhật booking
    const updatePath = `flights.${flightIndex}.passengers.${passengerIndex}.ticket.seatNumber`;
    
    await Booking.findByIdAndUpdate(bookingId, {
      $unset: {
        [updatePath]: ""
      },
      $inc: {
        'payment.totalAmount': -seatFee
      }
    });

    const response = ApiResponse.success({
      unselectedSeat: currentSeat,
      refundAmount: seatFee
    }, 'Hủy chọn ghế thành công');

    response.send(res);
  });

  // Lấy ghế khuyến nghị
  static getRecommendedSeats = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;
    const { seatClass = 'economy', preference = 'window', passengerCount = 1 } = req.query;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Lấy ghế đã được đặt
    const bookings = await Booking.find({
      'flights.flight': flightId,
      status: { $in: ['confirmed', 'checked_in'] }
    }).select('flights.passengers.ticket.seatNumber').lean();

    const occupiedSeats = new Set();
    bookings.forEach(booking => {
      booking.flights.forEach(flightBooking => {
        if (flightBooking.flight.toString() === flightId) {
          flightBooking.passengers.forEach(passenger => {
            if (passenger.ticket.seatNumber) {
              occupiedSeats.add(passenger.ticket.seatNumber);
            }
          });
        }
      });
    });

    // Tìm ghế phù hợp
    const recommendedSeats = [];
    const targetCount = parseInt(passengerCount);

    for (const row of flight.seatMap) {
      const availableSeatsInRow = row.seats.filter(seat => 
        seat.class === seatClass &&
        seat.status === 'available' &&
        !occupiedSeats.has(seat.seatNumber)
      );

      if (availableSeatsInRow.length === 0) continue;

      // Sắp xếp theo preference
      availableSeatsInRow.sort((a, b) => {
        const preferenceScore = (seat) => {
          let score = 0;
          if (preference === 'window' && seat.type === 'window') score += 10;
          if (preference === 'aisle' && seat.type === 'aisle') score += 10;
          if (seat.features && seat.features.includes('extra_legroom')) score += 5;
          return score;
        };

        return preferenceScore(b) - preferenceScore(a);
      });

      // Thêm ghế vào danh sách khuyến nghị
      for (const seat of availableSeatsInRow) {
        if (recommendedSeats.length < targetCount * 2) { // Gợi ý gấp đôi số lượng cần
          recommendedSeats.push({
            seatNumber: seat.seatNumber,
            type: seat.type,
            features: seat.features,
            price: seat.price,
            row: row.row,
            recommendationReason: this.getSeatRecommendationReason(seat, preference)
          });
        }
      }

      if (recommendedSeats.length >= targetCount * 2) break;
    }

    const response = ApiResponse.success({
      recommendedSeats: recommendedSeats.slice(0, 10), // Tối đa 10 gợi ý
      totalAvailable: recommendedSeats.length,
      criteria: {
        seatClass,
        preference,
        passengerCount: targetCount
      }
    }, 'Lấy ghế khuyến nghị thành công');

    response.send(res);
  });

  // Lấy thông tin ghế đã chọn của booking
  static getBookingSeats = asyncHandler(async (req, res, next) => {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [
        { user: userId },
        { 'contactInfo.email': req.user.email }
      ]
    }).populate('flights.flight', 'flightNumber seatMap');

    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    const seatInfo = [];
    
    for (const flightBooking of booking.flights) {
      const flightSeats = [];
      
      for (const passenger of flightBooking.passengers) {
        if (passenger.ticket.seatNumber) {
          // Tìm thông tin chi tiết của ghế
          let seatDetails = null;
          for (const row of flightBooking.flight.seatMap) {
            const seat = row.seats.find(s => s.seatNumber === passenger.ticket.seatNumber);
            if (seat) {
              seatDetails = seat;
              break;
            }
          }

          flightSeats.push({
            passengerId: passenger._id,
            passengerName: `${passenger.firstName} ${passenger.lastName}`,
            seatNumber: passenger.ticket.seatNumber,
            seatClass: passenger.ticket.seatClass,
            seatDetails: seatDetails
          });
        } else {
          flightSeats.push({
            passengerId: passenger._id,
            passengerName: `${passenger.firstName} ${passenger.lastName}`,
            seatNumber: null,
            seatClass: passenger.ticket.seatClass,
            seatDetails: null
          });
        }
      }

      seatInfo.push({
        flightId: flightBooking.flight._id,
        flightNumber: flightBooking.flight.flightNumber,
        passengers: flightSeats
      });
    }

    const response = ApiResponse.success(seatInfo, 'Lấy thông tin ghế thành công');
    response.send(res);
  });

  // Helper methods
  static isUpgrade(currentClass, newClass) {
    const classHierarchy = ['economy', 'premium_economy', 'business', 'first'];
    return classHierarchy.indexOf(newClass) > classHierarchy.indexOf(currentClass);
  }

  static calculateUpgradeFee(currentClass, newClass) {
    const upgradeFees = {
      'economy_to_premium': 500000,
      'economy_to_business': 2000000,
      'economy_to_first': 5000000,
      'premium_to_business': 1500000,
      'premium_to_first': 4500000,
      'business_to_first': 3000000
    };

    const upgradeKey = `${currentClass}_to_${newClass}`;
    return upgradeFees[upgradeKey] || 0;
  }

  static getSeatRecommendationReason(seat, preference) {
    const reasons = [];
    
    if (preference === 'window' && seat.type === 'window') {
      reasons.push('Ghế cửa sổ như bạn yêu cầu');
    }
    if (preference === 'aisle' && seat.type === 'aisle') {
      reasons.push('Ghế hành lang như bạn yêu cầu');
    }
    if (seat.features && seat.features.includes('extra_legroom')) {
      reasons.push('Có thêm không gian để chân');
    }
    if (seat.price === 0) {
      reasons.push('Miễn phí chọn ghế');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Ghế có sẵn';
  }
}

module.exports = SeatController;