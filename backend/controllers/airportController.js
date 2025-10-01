const Airport = require('../models/Airport');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class AirportController {
  // Lấy danh sách tất cả sân bay
  static getAllAirports = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 50,
      search,
      country,
      type,
      sortBy = 'name.en',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.vi': { $regex: search, $options: 'i' } },
        { 'code.iata': { $regex: search, $options: 'i' } },
        { 'code.icao': { $regex: search, $options: 'i' } },
        { 'location.city.en': { $regex: search, $options: 'i' } },
        { 'location.city.vi': { $regex: search, $options: 'i' } }
      ];
    }

    if (country) {
      query['location.country.code'] = country.toUpperCase();
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [airports, total] = await Promise.all([
      Airport.find(query)
        .select('code name location type status')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Airport.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      ApiResponse.success('Lấy danh sách sân bay thành công', {
        airports,
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

  // Tìm kiếm sân bay
  static searchAirports = asyncHandler(async (req, res, next) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return next(new AppError('Từ khóa tìm kiếm phải có ít nhất 2 ký tự', 400));
    }

    const searchRegex = new RegExp(q, 'i');
    
    const airports = await Airport.find({
      $or: [
        { 'name.en': searchRegex },
        { 'name.vi': searchRegex },
        { 'code.iata': searchRegex },
        { 'code.icao': searchRegex },
        { 'location.city.en': searchRegex },
        { 'location.city.vi': searchRegex },
        { 'location.province.en': searchRegex },
        { 'location.province.vi': searchRegex }
      ],
      status: 'active'
    })
      .select('code name location')
      .limit(parseInt(limit))
      .sort({ 
        'stats.flightFrequency.daily': -1, // Sort by popularity
        'name.en': 1 
      });

    res.status(200).json(
      ApiResponse.success('Tìm kiếm sân bay thành công', airports)
    );
  });

  // Lấy thông tin chi tiết sân bay
  static getAirportDetails = asyncHandler(async (req, res, next) => {
    const { airportId } = req.params;

    // Try to find by ID first, then by IATA code
    let airport = await Airport.findById(airportId);
    
    if (!airport) {
      airport = await Airport.findOne({ 'code.iata': airportId.toUpperCase() });
    }

    if (!airport) {
      return next(new AppError('Không tìm thấy sân bay', 404));
    }

    res.status(200).json(
      ApiResponse.success('Lấy thông tin sân bay thành công', airport)
    );
  });

  // Lấy danh sách sân bay phổ biến
  static getPopularAirports = asyncHandler(async (req, res, next) => {
    const { country = 'VN', limit = 10, type = 'departure' } = req.query;

    let sortField = 'stats.flightFrequency.daily';
    if (type === 'arrival') {
      sortField = 'stats.passengerTraffic.arrivals';
    }

    const airports = await Airport.find({
      'location.country.code': country.toUpperCase(),
      status: 'active',
      type: { $in: ['international', 'domestic'] }
    })
      .select('code name location stats')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.status(200).json(
      ApiResponse.success('Lấy danh sách sân bay phổ biến thành công', airports)
    );
  });

  // Lấy danh sách sân bay theo quốc gia
  static getAirportsByCountry = asyncHandler(async (req, res, next) => {
    const { countryCode } = req.params;
    const { type, limit = 50 } = req.query;

    const query = {
      'location.country.code': countryCode.toUpperCase(),
      status: 'active'
    };

    if (type) {
      query.type = type;
    }

    const airports = await Airport.find(query)
      .select('code name location type')
      .sort({ 'name.en': 1 })
      .limit(parseInt(limit));

    res.status(200).json(
      ApiResponse.success(`Lấy danh sách sân bay ${countryCode.toUpperCase()} thành công`, airports)
    );
  });

  // Lấy danh sách sân bay gần nhất
  static getNearbyAirports = asyncHandler(async (req, res, next) => {
    const { lat, lng, maxDistance = 100000, limit = 10 } = req.query; // maxDistance in meters

    if (!lat || !lng) {
      return next(new AppError('Vui lòng cung cấp tọa độ (lat, lng)', 400));
    }

    const airports = await Airport.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'active'
    })
      .select('code name location')
      .limit(parseInt(limit));

    res.status(200).json(
      ApiResponse.success('Lấy danh sách sân bay gần nhất thành công', airports)
    );
  });

  // Tạo sân bay mới (admin)
  static createAirport = asyncHandler(async (req, res, next) => {
    const airportData = req.body;

    // Validate required fields
    const requiredFields = ['code.iata', 'name.en', 'name.vi', 'location'];
    for (const field of requiredFields) {
      const keys = field.split('.');
      let value = airportData;
      
      for (const key of keys) {
        value = value?.[key];
      }
      
      if (!value) {
        return next(new AppError(`Thiếu thông tin: ${field}`, 400));
      }
    }

    // Check if IATA code already exists
    const existingAirport = await Airport.findOne({ 
      'code.iata': airportData.code.iata.toUpperCase() 
    });
    
    if (existingAirport) {
      return next(new AppError('Mã IATA đã tồn tại', 400));
    }

    // Ensure IATA code is uppercase
    airportData.code.iata = airportData.code.iata.toUpperCase();
    if (airportData.code.icao) {
      airportData.code.icao = airportData.code.icao.toUpperCase();
    }

    const airport = await Airport.create(airportData);

    res.status(201).json(
      ApiResponse.success('Tạo sân bay thành công', airport)
    );
  });

  // Cập nhật thông tin sân bay (admin)
  static updateAirport = asyncHandler(async (req, res, next) => {
    const { airportId } = req.params;
    const updateData = req.body;

    // Ensure codes are uppercase if provided
    if (updateData.code?.iata) {
      updateData.code.iata = updateData.code.iata.toUpperCase();
    }
    if (updateData.code?.icao) {
      updateData.code.icao = updateData.code.icao.toUpperCase();
    }

    const airport = await Airport.findByIdAndUpdate(
      airportId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!airport) {
      return next(new AppError('Không tìm thấy sân bay', 404));
    }

    res.status(200).json(
      ApiResponse.success('Cập nhật sân bay thành công', airport)
    );
  });

  // Xóa sân bay (admin)
  static deleteAirport = asyncHandler(async (req, res, next) => {
    const { airportId } = req.params;

    const airport = await Airport.findById(airportId);
    if (!airport) {
      return next(new AppError('Không tìm thấy sân bay', 404));
    }

    // Check if airport is being used in flights
    const Flight = require('../models/Flight');
    const flightCount = await Flight.countDocuments({
      $or: [
        { 'route.departure.airport': airportId },
        { 'route.arrival.airport': airportId }
      ]
    });

    if (flightCount > 0) {
      return next(new AppError('Không thể xóa sân bay đang được sử dụng trong chuyến bay', 400));
    }

    await Airport.findByIdAndDelete(airportId);

    res.status(200).json(
      ApiResponse.success('Xóa sân bay thành công')
    );
  });

  // Lấy thống kê sân bay (admin)
  static getAirportStats = asyncHandler(async (req, res, next) => {
    const { airportId } = req.params;
    const { fromDate, toDate } = req.query;

    const airport = await Airport.findById(airportId);
    if (!airport) {
      return next(new AppError('Không tìm thấy sân bay', 404));
    }

    // Build date filter
    const dateFilter = {};
    if (fromDate && toDate) {
      dateFilter['route.departure.time'] = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const Flight = require('../models/Flight');
    const Booking = require('../models/Booking');

    // Get flight statistics
    const [departureFlights, arrivalFlights] = await Promise.all([
      Flight.countDocuments({
        'route.departure.airport': airportId,
        ...dateFilter
      }),
      Flight.countDocuments({
        'route.arrival.airport': airportId,
        ...dateFilter
      })
    ]);

    // Get passenger statistics (approximate based on bookings)
    const bookingStats = await Booking.aggregate([
      {
        $lookup: {
          from: 'flights',
          localField: 'flights.flight',
          foreignField: '_id',
          as: 'flightDetails'
        }
      },
      {
        $match: {
          $or: [
            { 'flightDetails.route.departure.airport': airport._id },
            { 'flightDetails.route.arrival.airport': airport._id }
          ],
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPassengers: { $sum: { $size: '$passengers' } },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      airport: {
        code: airport.code,
        name: airport.name
      },
      flights: {
        departures: departureFlights,
        arrivals: arrivalFlights,
        total: departureFlights + arrivalFlights
      },
      passengers: bookingStats[0] ? {
        total: bookingStats[0].totalPassengers,
        bookings: bookingStats[0].totalBookings
      } : {
        total: 0,
        bookings: 0
      },
      period: {
        from: fromDate,
        to: toDate
      }
    };

    res.status(200).json(
      ApiResponse.success('Lấy thống kê sân bay thành công', stats)
    );
  });
}

module.exports = AirportController;