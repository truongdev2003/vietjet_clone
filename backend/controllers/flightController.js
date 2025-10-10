const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const Fare = require('../models/Fare');
const Route = require('../models/Route');
const Inventory = require('../models/Inventory');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const mongoose = require('mongoose');

class FlightController {
  // Tìm kiếm chuyến bay
  static searchFlights = asyncHandler(async (req, res, next) => {
    // Support both GET (query params) and POST (body params)
    const searchParams = req.method === 'GET' ? req.query : req.body;
    
    const {
      from,
      to,
      departureDate,
      returnDate,
      passengers: passengersParam,
      seatClass = 'economy',
      tripType = 'one_way',
      sortBy = 'price',
      sortOrder = 'asc',
      maxResults = 50
    } = searchParams;

    // Handle passengers - can be a number string or object
    let passengers = { adults: 1, children: 0, infants: 0 };
    if (passengersParam) {
      if (typeof passengersParam === 'object') {
        passengers = passengersParam;
      } else {
        // If passengers is a number/string (from GET request), treat as adults count
        passengers.adults = parseInt(passengersParam) || 1;
      }
    }

    // Validate required fields
    if (!from || !to || !departureDate) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin: điểm đi, điểm đến và ngày khởi hành', 400));
    }

    // Validate trip type and return date
    if ((tripType === 'round_trip' || tripType === 'round-trip') && !returnDate) {
      return next(new AppError('Vui lòng chọn ngày khứ hồi cho hành trình khứ hồi', 400));
    }

    // Validate passenger count
    const totalPassengers = (passengers.adults || 0) + (passengers.children || 0) + (passengers.infants || 0);
    if (totalPassengers < 1 || totalPassengers > 9) {
      return next(new AppError('Số lượng hành khách phải từ 1 đến 9 người', 400));
    }

    // Validate dates
    const depDate = new Date(departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (depDate < today) {
      return next(new AppError('Ngày khởi hành không thể là ngày trong quá khứ', 400));
    }

    if (returnDate) {
      const retDate = new Date(returnDate);
      if (retDate <= depDate) {
        return next(new AppError('Ngày khứ hồi phải sau ngày khởi hành', 400));
      }
    }

    // Find airports - build query conditionally based on input format
    const buildAirportQuery = (code) => {
      const conditions = [{ 'code.iata': code.toUpperCase() }];
      
      // Only add _id condition if the value is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(code) && code.length === 24) {
        conditions.push({ _id: code });
      }
      
      return { $or: conditions };
    };

    const [departureAirport, arrivalAirport] = await Promise.all([
      Airport.findOne(buildAirportQuery(from)),
      Airport.findOne(buildAirportQuery(to))
    ]);

    if (!departureAirport) {
      return next(new AppError('Không tìm thấy sân bay khởi hành', 400));
    }

    if (!arrivalAirport) {
      return next(new AppError('Không tìm thấy sân bay đến', 400));
    }

    // Build search query for outbound flights
    // Use UTC dates to ensure consistency
    const depDateStart = new Date(depDate);
    depDateStart.setUTCHours(0, 0, 0, 0);
    const depDateEnd = new Date(depDate);
    depDateEnd.setUTCHours(23, 59, 59, 999);
    
    const outboundQuery = {
      'route.departure.airport': departureAirport._id,
      'route.arrival.airport': arrivalAirport._id,
      'route.departure.time': {
        $gte: depDateStart,
        $lte: depDateEnd
      },
      status: 'scheduled'
    };

    console.log('Search params:', {
      from: from,
      to: to,
      departureDate: departureDate,
      depDate: depDate,
      depDateStart: depDateStart,
      depDateEnd: depDateEnd,
      departureAirportId: departureAirport._id,
      arrivalAirportId: arrivalAirport._id
    });
    console.log('Outbound query:', JSON.stringify(outboundQuery, null, 2));

    // Find outbound flights
    let outboundFlights = await Flight.find(outboundQuery)
      .populate('route.departure.airport', 'code name location')
      .populate('route.arrival.airport', 'code name location')
      .populate('aircraft.type', 'manufacturer model configuration')
      .lean();

    console.log(`Found ${outboundFlights.length} outbound flights`);
    if (outboundFlights.length > 0) {
      console.log('First flight sample:', JSON.stringify(outboundFlights[0], null, 2));
    }

    // Add fare and inventory information
    outboundFlights = await Promise.all(
      outboundFlights.map(async (flight) => {
        const inventory = await Inventory.findOne({ flight: flight._id });
        
        let availableSeats = 0;
        if (inventory) {
          availableSeats = inventory.bookingClasses
            .filter(bc => bc.category === seatClass)
            .reduce((total, bc) => total + (bc.authorized - bc.sold), 0);
        } else {
          // If no inventory, use seats from flight data
          availableSeats = flight.seats?.[seatClass]?.available || 0;
        }

        // Skip flight if not enough seats
        if (availableSeats < totalPassengers) return null;

        // Get fare information - find Route first, then Fare
        let fare = null;
        const route = await Route.findOne({
          origin: flight.route?.departure?.airport?._id || departureAirport._id,
          destination: flight.route?.arrival?.airport?._id || arrivalAirport._id
        });
        
        if (route) {
          fare = await Fare.findOne({
            route: route._id,
            cabinClass: seatClass,
            'validity.startDate': { $lte: depDate },
            'validity.endDate': { $gte: depDate }
          });
        }

        return {
          ...flight,
          availableSeats,
          fare: fare ? {
            basePrice: fare.pricing.base,
            totalPrice: fare.pricing.base + fare.pricing.taxes + fare.pricing.fees,
            currency: fare.pricing.currency,
            fareCode: fare.code
          } : {
            // Use pricing from flight if no fare found
            basePrice: flight.pricing?.[seatClass]?.base || 0,
            totalPrice: flight.pricing?.[seatClass]?.base || 0,
            currency: 'VND',
            fareCode: null
          }
        };
      })
    );

    // Remove null results (flights without enough seats)
    outboundFlights = outboundFlights.filter(flight => flight !== null);

    let inboundFlights = [];
    if (tripType === 'round-trip' && returnDate) {
      const retDate = new Date(returnDate);
      const retDateStart = new Date(retDate);
      retDateStart.setUTCHours(0, 0, 0, 0);
      const retDateEnd = new Date(retDate);
      retDateEnd.setUTCHours(23, 59, 59, 999);
      
      const inboundQuery = {
        'route.departure.airport': arrivalAirport._id,
        'route.arrival.airport': departureAirport._id,
        'route.departure.time': {
          $gte: retDateStart,
          $lte: retDateEnd
        },
        status: 'scheduled'
      };

      inboundFlights = await Flight.find(inboundQuery)
        .populate('route.departure.airport', 'code name location')
        .populate('route.arrival.airport', 'code name location')
        .populate('aircraft.type', 'manufacturer model configuration')
        .lean();

      // Filter inbound flights by availability and add fare
      // Add fare and inventory information for return flights
      inboundFlights = await Promise.all(
        inboundFlights.map(async (flight) => {
          const inventory = await Inventory.findOne({ flight: flight._id });
          
          let availableSeats = 0;
          if (inventory) {
            availableSeats = inventory.bookingClasses
              .filter(bc => bc.category === seatClass)
              .reduce((total, bc) => total + (bc.authorized - bc.sold), 0);
          } else {
            // If no inventory, use seats from flight data
            availableSeats = flight.seats?.[seatClass]?.available || 0;
          }

          // Skip flight if not enough seats
          if (availableSeats < totalPassengers) return null;

          // Get fare information - find Route first, then Fare
          let fare = null;
          const route = await Route.findOne({
            origin: flight.route?.departure?.airport?._id || departureAirport._id,
            destination: flight.route?.arrival?.airport?._id || arrivalAirport._id
          });
          
          if (route) {
            fare = await Fare.findOne({
              route: route._id,
              cabinClass: seatClass,
              'validity.startDate': { $lte: retDate },
              'validity.endDate': { $gte: retDate }
            });
          }

          return {
            ...flight,
            availableSeats,
            fare: fare ? {
              basePrice: fare.pricing.base,
              totalPrice: fare.pricing.base + fare.pricing.taxes + fare.pricing.fees,
              currency: fare.pricing.currency,
              fareCode: fare.code
            } : {
              // Use pricing from flight if no fare found
              basePrice: flight.pricing?.[seatClass]?.base || 0,
              totalPrice: flight.pricing?.[seatClass]?.base || 0,
              currency: 'VND',
              fareCode: null
            }
          };
        })
      );

      inboundFlights = inboundFlights.filter(flight => flight !== null);
    }

    // Sort flights
    const sortFlights = (flights) => {
      return flights.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'price':
            comparison = (a.fare?.totalPrice || 0) - (b.fare?.totalPrice || 0);
            break;
          case 'departure':
            comparison = new Date(a.route.departure.time) - new Date(b.route.departure.time);
            break;
          case 'arrival':
            comparison = new Date(a.route.arrival.time) - new Date(b.route.arrival.time);
            break;
          case 'duration':
            comparison = a.route.duration.scheduled - b.route.duration.scheduled;
            break;
          default:
            comparison = new Date(a.route.departure.time) - new Date(b.route.departure.time);
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    };

    outboundFlights = sortFlights(outboundFlights).slice(0, maxResults);
    if (inboundFlights.length > 0) {
      inboundFlights = sortFlights(inboundFlights).slice(0, maxResults);
    }

    // Save search history (optional - implement if needed)
    // await this.saveSearchHistory(req, { from, to, departureDate, returnDate, passengers, seatClass, tripType });

    const response = ApiResponse.success({
      searchParams: {
        from: departureAirport,
        to: arrivalAirport,
        departureDate,
        returnDate,
        passengers,
        seatClass,
        tripType
      },
      outboundFlights,
      inboundFlights,
      totalResults: {
        outbound: outboundFlights.length,
        inbound: inboundFlights.length
      }
    }, 'Tìm kiếm chuyến bay thành công');
    
    response.send(res);
  });

  // Lấy thông tin chi tiết chuyến bay
  static getFlightDetails = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;

    const flight = await Flight.findById(flightId)
      .populate('route.departure.airport')
      .populate('route.arrival.airport')
      .populate('aircraft.type')
      .populate('crew.captain', 'personalInfo.firstName personalInfo.lastName')
      .populate('crew.firstOfficer', 'personalInfo.firstName personalInfo.lastName')
      .populate('crew.cabinCrew', 'personalInfo.firstName personalInfo.lastName');

    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Get inventory information
    const inventory = await Inventory.findOne({ flight: flightId });
    
    // Get fare information
    const fares = await Fare.find({
      route: flight.route,
      'validity.startDate': { $lte: flight.route.departure.time },
      'validity.endDate': { $gte: flight.route.departure.time }
    });

    const response = ApiResponse.success({
      flight,
      inventory,
      fares
    }, 'Lấy thông tin chuyến bay thành công');
    
    response.send(res);
  });

  // Lấy danh sách chuyến bay (admin)
  static getAllFlights = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      status,
      airline,
      route,
      fromDate,
      toDate,
      search,
      sortBy = 'route.departure.time',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (airline) query['airline.code'] = airline;
    if (route) {
      query.$or = [
        { 'route.departure.airport': route },
        { 'route.arrival.airport': route }
      ];
    }
    
    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { flightNumber: searchRegex },
        { 'aircraft.type': searchRegex },
        { 'aircraft.registration': searchRegex }
      ];
    }
    
    if (fromDate && toDate) {
      query['route.departure.time'] = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [flights, total] = await Promise.all([
      Flight.find(query)
        .populate('route.departure.airport', 'code name')
        .populate('route.arrival.airport', 'code name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Flight.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = ApiResponse.success({
      flights,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      total,
      pages: totalPages
    }, 'Lấy danh sách chuyến bay thành công');
    
    response.send(res);
  });

  // Tạo chuyến bay mới (admin)
  static createFlight = asyncHandler(async (req, res, next) => {
    const flightData = req.body;

    // Validate required fields
    const requiredFields = ['flightNumber', 'route', 'aircraft'];
    for (const field of requiredFields) {
      if (!flightData[field]) {
        return next(new AppError(`Thiếu thông tin: ${field}`, 400));
      }
    }

    // Check if flight number already exists
    const existingFlight = await Flight.findOne({ 
      flightNumber: flightData.flightNumber.toUpperCase() 
    });
    
    if (existingFlight) {
      return next(new AppError('Số hiệu chuyến bay đã tồn tại', 400));
    }

    // Validate airports exist
    const [departureAirport, arrivalAirport] = await Promise.all([
      Airport.findById(flightData.route.departure.airport),
      Airport.findById(flightData.route.arrival.airport)
    ]);

    if (!departureAirport || !arrivalAirport) {
      return next(new AppError('Sân bay không hợp lệ', 400));
    }

    const flight = await Flight.create(flightData);
    
    // Populate airports để trả về đầy đủ thông tin
    await flight.populate([
      { path: 'route.departure.airport', select: 'code name location' },
      { path: 'route.arrival.airport', select: 'code name location' }
    ]);

    const response = ApiResponse.created(flight, 'Tạo chuyến bay thành công');
    response.send(res);
  });

  // Cập nhật chuyến bay (admin)
  static updateFlight = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;
    const updateData = req.body;

    const flight = await Flight.findByIdAndUpdate(
      flightId,
      updateData,
      { new: true, runValidators: true }
    ).populate('route.departure.airport route.arrival.airport');

    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    const response = ApiResponse.success(flight, 'Cập nhật chuyến bay thành công');
    response.send(res);
  });

  // Xóa chuyến bay (admin)
  static deleteFlight = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // Check if there are any bookings for this flight
    const Booking = require('../models/Booking');
    const bookingCount = await Booking.countDocuments({ 
      'flights.flight': flightId,
      status: { $nin: ['cancelled', 'refunded'] }
    });

    if (bookingCount > 0) {
      return next(new AppError('Không thể xóa chuyến bay đã có booking', 400));
    }

    await Flight.findByIdAndDelete(flightId);

    const response = ApiResponse.success(null, 'Xóa chuyến bay thành công');
    response.send(res);
  });

  // Cập nhật trạng thái chuyến bay
  static updateFlightStatus = asyncHandler(async (req, res, next) => {
    const { flightId } = req.params;
    const { status, reason, estimatedTime, actualTime } = req.body;

    const validStatuses = ['scheduled', 'boarding', 'departed', 'in_flight', 'arrived', 'delayed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }

    const updateData = { status };
    
    if (reason) updateData.statusReason = reason;
    if (estimatedTime) {
      updateData['route.departure.estimatedTime'] = estimatedTime;
    }
    if (actualTime) {
      updateData['route.departure.actualTime'] = actualTime;
    }

    const flight = await Flight.findByIdAndUpdate(
      flightId,
      updateData,
      { new: true }
    );

    if (!flight) {
      return next(new AppError('Không tìm thấy chuyến bay', 404));
    }

    // TODO: Send notifications to passengers if status is delayed or cancelled

    const response = ApiResponse.success(flight, 'Cập nhật trạng thái chuyến bay thành công');
    response.send(res);
  });
}

module.exports = FlightController;