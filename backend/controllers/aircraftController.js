const Aircraft = require('../models/Aircraft');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

class AircraftController {
  // Lấy danh sách tất cả máy bay
  static getAllAircraft = asyncHandler(async (req, res, next) => {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      manufacturer, 
      model,
      search 
    } = req.query;

    const query = {};

    // Filter theo status
    if (status) {
      query['operational.status'] = status;
    }

    // Filter theo manufacturer
    if (manufacturer) {
      query['aircraft.manufacturer'] = new RegExp(manufacturer, 'i');
    }

    // Filter theo model
    if (model) {
      query['aircraft.model'] = new RegExp(model, 'i');
    }

    // Search
    if (search) {
      query.$or = [
        { registration: new RegExp(search, 'i') },
        { 'aircraft.manufacturer': new RegExp(search, 'i') },
        { 'aircraft.model': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [aircraft, total] = await Promise.all([
      Aircraft.find(query)
        .populate('ownership.airline', 'name code')
        .populate('operational.currentLocation.airport', 'code name')
        .populate('operational.baseAirport', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Aircraft.countDocuments(query)
    ]);

    const response = ApiResponse.success({
      aircraft,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }, 'Lấy danh sách máy bay thành công');
    
    response.send(res);
  });

  // Lấy chi tiết một máy bay
  static getAircraftById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const aircraft = await Aircraft.findById(id)
      .populate('ownership.airline', 'name code logo')
      .populate('operational.currentLocation.airport', 'code name')
      .populate('operational.baseAirport', 'code name');

    if (!aircraft) {
      return next(new AppError('Không tìm thấy máy bay', 404));
    }

    const response = ApiResponse.success(aircraft, 'Lấy thông tin máy bay thành công');
    response.send(res);
  });

  // Tạo máy bay mới
  static createAircraft = asyncHandler(async (req, res, next) => {
    const {
      registration,
      manufacturer,
      model,
      variant,
      msn,
      airline,
      status,
      currentLocation,
      baseAirport,
      configuration,
      specifications,
      ownership,
      aircraft // Accept nested aircraft object
    } = req.body;

    // Kiểm tra registration đã tồn tại chưa
    const existingAircraft = await Aircraft.findOne({ registration });
    if (existingAircraft) {
      return next(new AppError('Số đăng ký máy bay đã tồn tại', 400));
    }

    // Extract aircraft info from both flat and nested structure
    const aircraftManufacturer = aircraft?.manufacturer || manufacturer || 'Airbus';
    const aircraftModel = aircraft?.model || model || 'A320';
    const aircraftVariant = aircraft?.variant || variant || '';
    const aircraftMsn = aircraft?.msn || msn || `MSN-${Date.now()}`;

    // Extract operational info
    const operationalStatus = req.body.operational?.status || status || 'active';
    const operationalCurrentLocation = req.body.operational?.currentLocation || currentLocation;
    const operationalBaseAirport = req.body.operational?.baseAirport || baseAirport;

    // Extract ownership info
    const ownershipAirline = req.body.ownership?.airline || airline;

    // Tạo aircraft data với nested structure đúng schema
    const aircraftData = {
      registration,
      aircraft: {
        manufacturer: aircraftManufacturer,
        model: aircraftModel,
        variant: aircraftVariant,
        msn: aircraftMsn
      },
      operational: {
        status: operationalStatus,
        baseAirport: operationalBaseAirport || null,
        currentLocation: operationalCurrentLocation ? {
          airport: operationalCurrentLocation.airport || operationalCurrentLocation,
          updatedAt: new Date()
        } : null
      },
      configuration: configuration || {
        layout: '3-3',
        totalSeats: 180,
        classes: []
      },
      specifications: specifications || {
        engines: 'CFM56-5B4',
        engineCount: 2,
        maxSeats: 180,
        mtow: 78000,
        range: 3000,
        serviceSpeed: 450
      },
      ownership: {
        airline: ownershipAirline,
        owner: ownership?.owner || 'owned'
      }
    };

    console.log('🆕 Creating aircraft:', aircraftData);

    const newAircraft = await Aircraft.create(aircraftData);
    
    // Populate để trả về đầy đủ thông tin
    await newAircraft.populate([
      { path: 'ownership.airline', select: 'name code logo' },
      { path: 'operational.currentLocation.airport', select: 'code name' },
      { path: 'operational.baseAirport', select: 'code name' }
    ]);

    const response = ApiResponse.created(newAircraft, 'Tạo máy bay thành công');
    response.send(res);
  });

  // Cập nhật máy bay
  static updateAircraft = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const {
      registration,
      manufacturer,
      model,
      variant,
      msn,
      status,
      currentLocation,
      baseAirport,
      configuration,
      specifications,
      ownership,
      airline,
      aircraft // Accept nested aircraft object from frontend
    } = req.body;

    // Nếu cập nhật registration, kiểm tra trùng lặp
    if (registration) {
      const existingAircraft = await Aircraft.findOne({
        registration: registration,
        _id: { $ne: id }
      });

      if (existingAircraft) {
        return next(new AppError('Số đăng ký máy bay đã tồn tại', 400));
      }
    }

    // Build update data với nested structure đúng schema
    const updateData = {};
    
    if (registration) updateData.registration = registration;
    
    // Update aircraft info - handle both flat and nested structure
    const aircraftManufacturer = aircraft?.manufacturer || manufacturer;
    const aircraftModel = aircraft?.model || model;
    const aircraftVariant = aircraft?.variant || variant;
    const aircraftMsn = aircraft?.msn || msn;
    
    if (aircraftManufacturer) updateData['aircraft.manufacturer'] = aircraftManufacturer;
    if (aircraftModel) updateData['aircraft.model'] = aircraftModel;
    if (aircraftVariant !== undefined) updateData['aircraft.variant'] = aircraftVariant;
    if (aircraftMsn) updateData['aircraft.msn'] = aircraftMsn;
    
    // Update operational info - handle both flat and nested structure
    const operationalStatus = req.body.operational?.status || status;
    const operationalCurrentLocation = req.body.operational?.currentLocation || currentLocation;
    const operationalBaseAirport = req.body.operational?.baseAirport || baseAirport;
    
    if (operationalStatus) updateData['operational.status'] = operationalStatus;
    if (operationalCurrentLocation !== undefined) {
      if (operationalCurrentLocation) {
        // Handle if it's an object with airport field or just airport ID
        const airportId = operationalCurrentLocation.airport || operationalCurrentLocation;
        updateData['operational.currentLocation'] = {
          airport: airportId,
          updatedAt: new Date()
        };
      } else {
        updateData['operational.currentLocation'] = null;
      }
    }
    if (operationalBaseAirport !== undefined) updateData['operational.baseAirport'] = operationalBaseAirport || null;
    
    // Update other fields
    if (configuration) updateData.configuration = configuration;
    if (specifications) updateData.specifications = specifications;
    
    // Update ownership - handle both flat and nested structure
    const ownershipAirline = req.body.ownership?.airline || airline;
    if (ownershipAirline) updateData['ownership.airline'] = ownershipAirline;
    if (ownership && ownership.owner) updateData['ownership.owner'] = ownership.owner;

    console.log('🔧 Update aircraft data:', updateData);

    const updatedAircraft = await Aircraft.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'ownership.airline', select: 'name code logo' },
      { path: 'operational.currentLocation.airport', select: 'code name' },
      { path: 'operational.baseAirport', select: 'code name' }
    ]);

    if (!updatedAircraft) {
      return next(new AppError('Không tìm thấy máy bay', 404));
    }

    const response = ApiResponse.success(updatedAircraft, 'Cập nhật máy bay thành công');
    response.send(res);
  });

  // Xóa máy bay
  static deleteAircraft = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const aircraft = await Aircraft.findById(id);

    if (!aircraft) {
      return next(new AppError('Không tìm thấy máy bay', 404));
    }

    // Kiểm tra xem máy bay có đang được sử dụng trong chuyến bay nào không
    const Flight = require('../models/Flight');
    const flightsUsingAircraft = await Flight.countDocuments({
      'aircraft.type': id,
      status: { $in: ['scheduled', 'boarding', 'departed', 'in_flight'] }
    });

    if (flightsUsingAircraft > 0) {
      return next(new AppError(
        'Không thể xóa máy bay đang được sử dụng trong chuyến bay', 
        400
      ));
    }

    await aircraft.deleteOne();

    const response = ApiResponse.success(null, 'Xóa máy bay thành công');
    response.send(res);
  });

  // Cập nhật trạng thái máy bay
  static updateAircraftStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { current, location, availability, reason } = req.body;

    const aircraft = await Aircraft.findById(id);

    if (!aircraft) {
      return next(new AppError('Không tìm thấy máy bay', 404));
    }

    // Cập nhật status
    if (current) aircraft.status.current = current;
    if (location) aircraft.status.location = location;
    if (typeof availability === 'boolean') aircraft.status.availability = availability;

    // Thêm vào status history
    aircraft.status.history.push({
      status: current || aircraft.status.current,
      timestamp: new Date(),
      location: location || aircraft.status.location,
      reason: reason || 'Status update'
    });

    await aircraft.save();

    const response = ApiResponse.success(aircraft, 'Cập nhật trạng thái máy bay thành công');
    response.send(res);
  });

  // Lấy danh sách máy bay có sẵn (cho dropdown)
  static getAvailableAircraft = asyncHandler(async (req, res, next) => {
    const aircraft = await Aircraft.find({
      'operational.status': 'active'
    })
      .select('registration aircraft.manufacturer aircraft.model aircraft.variant configuration.totalSeats operational')
      .populate('ownership.airline', 'name code')
      .populate('operational.currentLocation.airport', 'code name')
      .populate('operational.baseAirport', 'code name')
      .sort('registration');
 
    // Transform data to include flat fields for easier access in frontend
    const transformedAircraft = aircraft.map(a => ({
      _id: a._id,
      registration: a.registration,
      manufacturer: a.aircraft?.manufacturer,
      model: a.aircraft?.model,
      variant: a.aircraft?.variant,
      totalSeats: a.configuration?.totalSeats,
      status: a.operational?.status,
      currentLocation: a.operational?.currentLocation?.airport,
      airline: a.ownership?.airline
    }));

    const response = ApiResponse.success(transformedAircraft, 'Lấy danh sách máy bay khả dụng thành công');
    response.send(res);
  });

  // Lấy thống kê máy bay
  static getAircraftStats = asyncHandler(async (req, res, next) => {
    const stats = await Aircraft.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status.current',
                count: { $sum: 1 }
              }
            }
          ],
          byManufacturer: [
            {
              $group: {
                _id: '$manufacturer',
                count: { $sum: 1 }
              }
            }
          ],
          total: [
            {
              $count: 'count'
            }
          ],
          available: [
            {
              $match: {
                'status.current': 'active',
                'status.availability': true
              }
            },
            {
              $count: 'count'
            }
          ]
        }
      }
    ]);

    const response = ApiResponse.success({
      byStatus: stats[0].byStatus,
      byManufacturer: stats[0].byManufacturer,
      total: stats[0].total[0]?.count || 0,
      available: stats[0].available[0]?.count || 0
    }, 'Lấy thống kê máy bay thành công');
    
    response.send(res);
  });
}

module.exports = AircraftController;
