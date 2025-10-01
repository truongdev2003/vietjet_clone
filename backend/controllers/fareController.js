const Fare = require('../models/Fare');
const Route = require('../models/Route');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class FareController {
  // Lấy danh sách giá vé theo tuyến bay
  static getFaresByRoute = asyncHandler(async (req, res, next) => {
    const { routeId } = req.params;
    const { 
      cabinClass, 
      tripType = 'one_way',
      departureDate,
      returnDate 
    } = req.query;

    // Build query
    const query = { route: routeId };
    
    if (cabinClass) {
      query.cabinClass = cabinClass;
    }
    
    if (tripType) {
      query.tripType = tripType;
    }

    // Date filter for fare validity
    if (departureDate) {
      const depDate = new Date(departureDate);
      query['validity.startDate'] = { $lte: depDate };
      query['validity.endDate'] = { $gte: depDate };
    }

    const fares = await Fare.find(query)
      .populate('route', 'code origin destination')
      .populate('airline', 'code name')
      .sort({ 'pricing.base': 1 }); // Sort by base price ascending

    res.status(200).json(
      ApiResponse.success('Lấy danh sách giá vé thành công', fares)
    );
  });

  // Tính giá vé cho booking
  static calculateFare = asyncHandler(async (req, res, next) => {
    const {
      routeId,
      cabinClass = 'economy',
      passengers = { adults: 1, children: 0, infants: 0 },
      departureDate,
      returnDate,
      tripType = 'one_way',
      promoCode
    } = req.body;

    if (!routeId || !departureDate) {
      return next(new AppError('Thiếu thông tin tuyến bay hoặc ngày khởi hành', 400));
    }

    // Find applicable fare
    const depDate = new Date(departureDate);
    const fare = await Fare.findOne({
      route: routeId,
      cabinClass,
      tripType,
      'validity.startDate': { $lte: depDate },
      'validity.endDate': { $gte: depDate }
    }).populate('route airline');

    if (!fare) {
      return next(new AppError('Không tìm thấy giá vé phù hợp', 404));
    }

    // Calculate base fare
    let totalAdults = passengers.adults * fare.pricing.base;
    let totalChildren = passengers.children * (fare.pricing.base * 0.75); // 25% discount for children
    let totalInfants = passengers.infants * (fare.pricing.base * 0.1); // 90% discount for infants
    
    let subtotal = totalAdults + totalChildren + totalInfants;
    
    // Add taxes and fees
    let taxes = subtotal * (fare.pricing.taxRate || 0.1);
    let fees = fare.pricing.fees || 0;
    
    // Calculate return fare if round trip
    let returnFare = 0;
    if (tripType === 'round_trip' && returnDate) {
      const retDate = new Date(returnDate);
      const returnFareData = await Fare.findOne({
        route: routeId,
        cabinClass,
        tripType: 'one_way', // Use one-way fare for return
        'validity.startDate': { $lte: retDate },
        'validity.endDate': { $gte: retDate }
      });
      
      if (returnFareData) {
        let returnAdults = passengers.adults * returnFareData.pricing.base;
        let returnChildren = passengers.children * (returnFareData.pricing.base * 0.75);
        let returnInfants = passengers.infants * (returnFareData.pricing.base * 0.1);
        
        returnFare = returnAdults + returnChildren + returnInfants;
        taxes += returnFare * (returnFareData.pricing.taxRate || 0.1);
        fees += returnFareData.pricing.fees || 0;
      }
    }
    
    let total = subtotal + returnFare + taxes + fees;
    
    // Apply promo code discount
    let discountAmount = 0;
    if (promoCode) {
      // TODO: Implement promo code logic
      // For now, just placeholder
    }
    
    const finalTotal = total - discountAmount;

    const fareCalculation = {
      fare: {
        code: fare.code,
        name: fare.name,
        cabinClass: fare.cabinClass,
        tripType: fare.tripType
      },
      route: fare.route,
      airline: fare.airline,
      passengers,
      pricing: {
        outbound: {
          adults: totalAdults,
          children: totalChildren,
          infants: totalInfants,
          subtotal: subtotal
        },
        inbound: tripType === 'round_trip' ? {
          total: returnFare
        } : null,
        taxes: taxes,
        fees: fees,
        subtotal: subtotal + returnFare,
        discount: discountAmount,
        total: finalTotal,
        currency: fare.pricing.currency || 'VND'
      },
      validity: fare.validity,
      restrictions: fare.restrictions
    };

    res.status(200).json(
      ApiResponse.success('Tính giá vé thành công', fareCalculation)
    );
  });

  // Lấy danh sách tất cả giá vé (admin)
  static getAllFares = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      route,
      airline,
      cabinClass,
      tripType,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (route) query.route = route;
    if (airline) query.airline = airline;
    if (cabinClass) query.cabinClass = cabinClass;
    if (tripType) query.tripType = tripType;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [fares, total] = await Promise.all([
      Fare.find(query)
        .populate('route', 'code origin destination')
        .populate('airline', 'code name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Fare.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      ApiResponse.success('Lấy danh sách giá vé thành công', {
        fares,
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

  // Tạo giá vé mới (admin)
  static createFare = asyncHandler(async (req, res, next) => {
    const fareData = req.body;

    // Validate required fields
    const requiredFields = ['code', 'route', 'airline', 'cabinClass', 'tripType', 'pricing'];
    for (const field of requiredFields) {
      if (!fareData[field]) {
        return next(new AppError(`Thiếu thông tin: ${field}`, 400));
      }
    }

    // Check if fare code already exists
    const existingFare = await Fare.findOne({ code: fareData.code.toUpperCase() });
    if (existingFare) {
      return next(new AppError('Mã giá vé đã tồn tại', 400));
    }

    // Validate route exists
    const route = await Route.findById(fareData.route);
    if (!route) {
      return next(new AppError('Tuyến bay không tồn tại', 400));
    }

    fareData.code = fareData.code.toUpperCase();
    const fare = await Fare.create(fareData);

    res.status(201).json(
      ApiResponse.success('Tạo giá vé thành công', fare)
    );
  });

  // Cập nhật giá vé (admin)
  static updateFare = asyncHandler(async (req, res, next) => {
    const { fareId } = req.params;
    const updateData = req.body;

    const fare = await Fare.findByIdAndUpdate(
      fareId,
      updateData,
      { new: true, runValidators: true }
    ).populate('route airline');

    if (!fare) {
      return next(new AppError('Không tìm thấy giá vé', 404));
    }

    res.status(200).json(
      ApiResponse.success('Cập nhật giá vé thành công', fare)
    );
  });

  // Xóa giá vé (admin)
  static deleteFare = asyncHandler(async (req, res, next) => {
    const { fareId } = req.params;

    const fare = await Fare.findById(fareId);
    if (!fare) {
      return next(new AppError('Không tìm thấy giá vé', 404));
    }

    // Check if fare is being used in any bookings
    const Booking = require('../models/Booking');
    const bookingCount = await Booking.countDocuments({
      'pricing.fareCode': fare.code,
      status: { $nin: ['cancelled', 'refunded'] }
    });

    if (bookingCount > 0) {
      return next(new AppError('Không thể xóa giá vé đang được sử dụng', 400));
    }

    await Fare.findByIdAndDelete(fareId);

    res.status(200).json(
      ApiResponse.success('Xóa giá vé thành công')
    );
  });

  // Lấy thông tin chi tiết giá vé
  static getFareDetails = asyncHandler(async (req, res, next) => {
    const { fareId } = req.params;

    const fare = await Fare.findById(fareId)
      .populate('route')
      .populate('airline')
      .populate('route.origin', 'code name location')
      .populate('route.destination', 'code name location');

    if (!fare) {
      return next(new AppError('Không tìm thấy giá vé', 404));
    }

    res.status(200).json(
      ApiResponse.success('Lấy thông tin giá vé thành công', fare)
    );
  });
}

module.exports = FareController;