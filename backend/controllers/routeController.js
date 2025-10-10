const Route = require('../models/Route');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class RouteController {
  // Lấy danh sách tất cả tuyến bay
  static getAllRoutes = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 50,
      search,
      type,
      airline,
      status,
      sortBy = 'code',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (airline) {
      query.airline = airline;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [routes, total] = await Promise.all([
      Route.find(query)
        .populate('origin', 'code name location')
        .populate('destination', 'code name location')
        .populate('airline', 'code name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Route.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = ApiResponse.success({
      routes,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, 'Lấy danh sách tuyến bay thành công');
    response.send(res);
  });

  // Lấy thông tin chi tiết tuyến bay
  static getRouteById = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;

    const route = await Route.findById(routeId)
      .populate('origin', 'code name location timezone')
      .populate('destination', 'code name location timezone')
      .populate('airline', 'code name logo');

    if (!route) {
      return next(new AppError('Không tìm thấy tuyến bay', 404));
    }

    const response = ApiResponse.success(route, 'Lấy thông tin tuyến bay thành công');
    response.send(res);
  });

  // Tìm tuyến bay theo origin và destination
  static findRoute = asyncHandler(async (req, res, next) => {
    const { origin, destination, airline } = req.query;

    if (!origin || !destination) {
      return next(new AppError('Vui lòng cung cấp điểm đi và điểm đến', 400));
    }

    const query = {
      origin,
      destination,
      status: 'active'
    };

    if (airline) {
      query.airline = airline;
    }

    const routes = await Route.find(query)
      .populate('origin', 'code name location')
      .populate('destination', 'code name location')
      .populate('airline', 'code name logo');

    const response = ApiResponse.success(routes, 'Tìm tuyến bay thành công');
    response.send(res);
  });

  // Tạo tuyến bay mới (admin)
  static createRoute = asyncHandler(async (req, res, next) => {
    const routeData = req.body;

    // Validate required fields
    const requiredFields = ['code', 'origin', 'destination', 'airline', 'type'];
    for (const field of requiredFields) {
      if (!routeData[field]) {
        return next(new AppError(`Thiếu thông tin: ${field}`, 400));
      }
    }

    // Check if route code already exists
    const existingRoute = await Route.findOne({ 
      code: routeData.code.toUpperCase() 
    });
    
    if (existingRoute) {
      return next(new AppError('Mã tuyến bay đã tồn tại', 400));
    }

    // Check if route with same origin, destination, airline exists
    const duplicateRoute = await Route.findOne({
      origin: routeData.origin,
      destination: routeData.destination,
      airline: routeData.airline
    });

    if (duplicateRoute) {
      return next(new AppError('Tuyến bay này đã tồn tại với cùng hãng hàng không', 400));
    }

    // Ensure code is uppercase
    routeData.code = routeData.code.toUpperCase();

    const route = await Route.create(routeData);

    // Populate before sending response
    await route.populate([
      { path: 'origin', select: 'code name location' },
      { path: 'destination', select: 'code name location' },
      { path: 'airline', select: 'code name logo' }
    ]);

    const response = ApiResponse.created(route, 'Tạo tuyến bay thành công');
    response.send(res);
  });

  // Cập nhật thông tin tuyến bay (admin)
  static updateRoute = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;
    const updateData = req.body;

    // Ensure code is uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const route = await Route.findByIdAndUpdate(
      routeId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('origin', 'code name location')
      .populate('destination', 'code name location')
      .populate('airline', 'code name logo');

    if (!route) {
      return next(new AppError('Không tìm thấy tuyến bay', 404));
    }

    const response = ApiResponse.success(route, 'Cập nhật tuyến bay thành công');
    response.send(res);
  });

  // Cập nhật trạng thái tuyến bay (admin)
  static updateRouteStatus = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'discontinued'].includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }

    const route = await Route.findByIdAndUpdate(
      routeId,
      { status },
      { new: true }
    )
      .populate('origin', 'code name')
      .populate('destination', 'code name')
      .populate('airline', 'code name');

    if (!route) {
      return next(new AppError('Không tìm thấy tuyến bay', 404));
    }

    const response = ApiResponse.success(route, 'Cập nhật trạng thái tuyến bay thành công');
    response.send(res);
  });

  // Xóa tuyến bay (admin)
  static deleteRoute = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;

    const route = await Route.findById(routeId);
    if (!route) {
      return next(new AppError('Không tìm thấy tuyến bay', 404));
    }

    // Check if route is being used in flights
    const Flight = require('../models/Flight');
    const Fare = require('../models/Fare');

    const [flightCount, fareCount] = await Promise.all([
      Flight.countDocuments({
        $or: [
          { 'route.departure.airport': route.origin },
          { 'route.arrival.airport': route.destination }
        ]
      }),
      Fare.countDocuments({ route: routeId })
    ]);

    if (flightCount > 0 || fareCount > 0) {
      return next(new AppError(
        `Không thể xóa tuyến bay đang được sử dụng (${flightCount} chuyến bay, ${fareCount} giá vé)`, 
        400
      ));
    }

    await Route.findByIdAndDelete(routeId);

    const response = ApiResponse.success(null, 'Xóa tuyến bay thành công');
    response.send(res);
  });

  // Lấy thống kê tuyến bay (admin)
  static getRouteStats = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;

    const route = await Route.findById(routeId)
      .populate('origin', 'code name')
      .populate('destination', 'code name')
      .populate('airline', 'code name');

    if (!route) {
      return next(new AppError('Không tìm thấy tuyến bay', 404));
    }

    const Flight = require('../models/Flight');
    const Fare = require('../models/Fare');
    const Booking = require('../models/Booking');

    // Get statistics
    const [totalFlights, activeFares, totalBookings] = await Promise.all([
      Flight.countDocuments({
        'route.departure.airport': route.origin._id,
        'route.arrival.airport': route.destination._id
      }),
      Fare.countDocuments({ 
        route: routeId,
        status: 'active'
      }),
      Booking.countDocuments({
        'flights.flight': {
          $in: await Flight.find({
            'route.departure.airport': route.origin._id,
            'route.arrival.airport': route.destination._id
          }).distinct('_id')
        },
        status: { $in: ['confirmed', 'completed'] }
      })
    ]);

    const stats = {
      route: {
        code: route.code,
        origin: route.origin,
        destination: route.destination,
        airline: route.airline
      },
      flights: {
        total: totalFlights
      },
      fares: {
        active: activeFares
      },
      bookings: {
        total: totalBookings
      }
    };

    const response = ApiResponse.success(stats, 'Lấy thống kê tuyến bay thành công');
    response.send(res);
  });
}

module.exports = RouteController;
