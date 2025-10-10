const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

// Hàm tạo sơ đồ ghế mặc định dựa trên loại máy bay
const generateDefaultSeatMap = (aircraft) => {
  const seatMap = [];
  const config = aircraft?.configuration || {};
  
  // Cấu hình mặc định cho từng loại máy bay
  const defaultConfigs = {
    'Airbus A320': { economy: { rows: 25, seatsPerRow: 6 }, business: { rows: 3, seatsPerRow: 4 } },
    'Airbus A321': { economy: { rows: 30, seatsPerRow: 6 }, business: { rows: 4, seatsPerRow: 4 } },
    'Boeing 737': { economy: { rows: 25, seatsPerRow: 6 }, business: { rows: 3, seatsPerRow: 4 } },
    'Boeing 787': { economy: { rows: 30, seatsPerRow: 9 }, business: { rows: 5, seatsPerRow: 6 } },
    'ATR 72': { economy: { rows: 18, seatsPerRow: 4 }, business: { rows: 0, seatsPerRow: 0 } }
  };
  
  const aircraftType = aircraft?.type || 'Airbus A320';
  const aircraftConfig = defaultConfigs[aircraftType] || defaultConfigs['Airbus A320'];
  
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  let rowNumber = 1;
  
  // Tạo ghế hạng Business
  if (aircraftConfig.business.rows > 0) {
    for (let i = 0; i < aircraftConfig.business.rows; i++) {
      const seats = [];
      for (let j = 0; j < aircraftConfig.business.seatsPerRow; j++) {
        const seatNumber = `${rowNumber}${columns[j]}`;
        seats.push({
          seatNumber,
          class: 'business',
          type: j === 0 ? 'window' : j === aircraftConfig.business.seatsPerRow - 1 ? 'window' : 'aisle',
          status: 'available',
          price: 500000,
          features: ['extra_legroom', 'priority_boarding', 'premium_meal']
        });
      }
      seatMap.push({ row: rowNumber, seats });
      rowNumber++;
    }
  }
  
  // Tạo ghế hạng Economy
  for (let i = 0; i < aircraftConfig.economy.rows; i++) {
    const seats = [];
    const isExitRow = i === 5 || i === 15; // Hàng thoát hiểm
    
    for (let j = 0; j < aircraftConfig.economy.seatsPerRow; j++) {
      const seatNumber = `${rowNumber}${columns[j]}`;
      const isWindow = j === 0 || j === aircraftConfig.economy.seatsPerRow - 1;
      const isAisle = j === Math.floor(aircraftConfig.economy.seatsPerRow / 2) - 1 || 
                      j === Math.floor(aircraftConfig.economy.seatsPerRow / 2);
      
      seats.push({
        seatNumber,
        class: 'economy',
        type: isWindow ? 'window' : isAisle ? 'aisle' : isExitRow ? 'exit_row' : 'middle',
        status: 'available',
        price: isExitRow ? 200000 : 100000,
        features: isExitRow ? ['extra_legroom'] : []
      });
    }
    seatMap.push({ row: rowNumber, seats });
    rowNumber++;
  }
  
  return seatMap;
};

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
    }).select('flights').lean();

    // Tạo danh sách ghế đã được đặt
    const occupiedSeats = new Set();
    bookings.forEach(booking => {
      if (booking.flights && Array.isArray(booking.flights)) {
        booking.flights.forEach(flightBooking => {
          // Kiểm tra flightBooking.flight tồn tại trước khi gọi toString()
          if (flightBooking.flight && flightBooking.flight.toString() === flightId) {
            if (flightBooking.passengers && Array.isArray(flightBooking.passengers)) {
              flightBooking.passengers.forEach(passenger => {
                if (passenger.ticket && passenger.ticket.seatNumber) {
                  occupiedSeats.add(passenger.ticket.seatNumber);
                }
              });
            }
          }
        });
      }
    });

    // Tự động tạo seatMap nếu chưa có
    let seatMapData = flight.seatMap;
    if (!seatMapData || !Array.isArray(seatMapData) || seatMapData.length === 0) {
      // Tạo seatMap mặc định dựa trên cấu hình máy bay
      seatMapData = generateDefaultSeatMap(flight.aircraft);
      
      // Lưu lại seatMap vào database (không cần await vì không ảnh hưởng response)
      Flight.findByIdAndUpdate(flightId, { seatMap: seatMapData }).catch(err => {
        console.error('Error saving seatMap:', err);
      });
    }

    // Cập nhật trạng thái ghế trong seatMap
    const seatMap = seatMapData.map(row => ({
      ...row,
      seats: row.seats && Array.isArray(row.seats) ? row.seats.map(seat => ({
        ...seat,
        status: occupiedSeats.has(seat.seatNumber) ? 'occupied' : seat.status,
        available: !occupiedSeats.has(seat.seatNumber) && seat.status === 'available'
      })) : []
    }));

    // Tính tổng số ghế
    const totalSeats = seatMap.reduce((total, row) => total + (row.seats?.length || 0), 0);
    const availableCount = totalSeats - occupiedSeats.size;

    const response = ApiResponse.success({
      flight: {
        flightNumber: flight.flightNumber,
        route: flight.route,
        aircraft: flight.aircraft,
        departure: flight.route.departure.time
      },
      seatMap,
      occupiedCount: occupiedSeats.size,
      totalSeats,
      availableCount
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

  // ==================== ADMIN ENDPOINTS ====================
  
  // Admin: Cập nhật cấu hình ghế
  static updateSeatConfig = asyncHandler(async (req, res, next) => {
    const { flightId, seatNumber } = req.params;
    const { class: seatClass, type, price, features, status } = req.body;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Tìm ghế trong seatMap
    let seatFound = false;
    for (const row of flight.seatMap) {
      const seatIndex = row.seats.findIndex(s => s.seatNumber === seatNumber);
      if (seatIndex !== -1) {
        // Cập nhật thông tin ghế
        if (seatClass) row.seats[seatIndex].class = seatClass;
        if (type) row.seats[seatIndex].type = type;
        if (price !== undefined) row.seats[seatIndex].price = price;
        if (features) row.seats[seatIndex].features = features;
        if (status) row.seats[seatIndex].status = status;
        
        seatFound = true;
        break;
      }
    }

    if (!seatFound) {
      return next(new AppError('Không tìm thấy ghế', 404));
    }

    await flight.save();

    const response = ApiResponse.success({
      flightId: flight._id,
      flightNumber: flight.flightNumber,
      seatNumber,
      updatedConfig: { class: seatClass, type, price, features, status }
    }, 'Cập nhật cấu hình ghế thành công');

    response.send(res);
  });

  // Admin: Block/Unblock ghế
  static toggleSeatBlock = asyncHandler(async (req, res, next) => {
    const { flightId, seatNumber } = req.params;
    const { isBlocked } = req.body;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Tìm ghế trong seatMap
    let seatFound = false;
    for (const row of flight.seatMap) {
      const seatIndex = row.seats.findIndex(s => s.seatNumber === seatNumber);
      if (seatIndex !== -1) {
        // Cập nhật trạng thái block
        row.seats[seatIndex].status = isBlocked ? 'blocked' : 'available';
        seatFound = true;
        break;
      }
    }

    if (!seatFound) {
      return next(new AppError('Không tìm thấy ghế', 404));
    }

    await flight.save();

    const response = ApiResponse.success({
      flightId: flight._id,
      flightNumber: flight.flightNumber,
      seatNumber,
      isBlocked,
      newStatus: isBlocked ? 'blocked' : 'available'
    }, `${isBlocked ? 'Block' : 'Unblock'} ghế thành công`);

    response.send(res);
  });
}

module.exports = SeatController;