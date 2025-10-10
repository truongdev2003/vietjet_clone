const Banner = require('../models/Banner');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const path = require('path');

class BannerController {
  // Public: Lấy danh sách banners đang active
  static getActiveBanners = asyncHandler(async (req, res, next) => {
    const banners = await Banner.getActiveBanners();
    
    const response = ApiResponse.success({
      banners
    }, 'Lấy danh sách banners thành công');
    
    return response.send(res);
  });

  // Public: Tăng view count
  static incrementView = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    await banner.incrementView();
    
    const response = ApiResponse.success(null, 'Cập nhật view count thành công');
    return response.send(res);
  });

  // Public: Tăng click count
  static incrementClick = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    await banner.incrementClick();
    
    const response = ApiResponse.success(null, 'Cập nhật click count thành công');
    return response.send(res);
  });

  // Admin: Lấy tất cả banners
  static getAllBanners = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [banners, total] = await Promise.all([
      Banner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Banner.countDocuments(query)
    ]);

    const response = ApiResponse.success({
      banners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách banners thành công');
    
    return response.send(res);
  });

  // Admin: Lấy chi tiết một banner
  static getBannerById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    const response = ApiResponse.success({ banner }, 'Lấy thông tin banner thành công');
    return response.send(res);
  });

  // Admin: Tạo banner mới
  static createBanner = asyncHandler(async (req, res, next) => {
    const { title, description, image, link, order, isActive, startDate, endDate } = req.body;

    // Validate required fields
    if (!title || !image) {
      return next(new AppError('Tiêu đề và hình ảnh là bắt buộc', 400));
    }

    const banner = await Banner.create({
      title,
      description,
      image,
      link,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null
    });

    const response = ApiResponse.success({ banner }, 'Tạo banner thành công', 201);
    return response.send(res);
  });

  // Admin: Cập nhật banner
  static updateBanner = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, image, link, order, isActive, startDate, endDate } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    // Update fields
    if (title !== undefined) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (image !== undefined) banner.image = image;
    if (link !== undefined) banner.link = link;
    if (order !== undefined) banner.order = order;
    if (isActive !== undefined) banner.isActive = isActive;
    if (startDate !== undefined) banner.startDate = startDate || null;
    if (endDate !== undefined) banner.endDate = endDate || null;

    await banner.save();

    const response = ApiResponse.success({ banner }, 'Cập nhật banner thành công');
    return response.send(res);
  });

  // Admin: Xóa banner
  static deleteBanner = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    await banner.deleteOne();

    const response = ApiResponse.success(null, 'Xóa banner thành công');
    return response.send(res);
  });

  // Admin: Cập nhật thứ tự nhiều banners
  static updateBannersOrder = asyncHandler(async (req, res, next) => {
    const { banners } = req.body; // Array of { id, order }

    if (!Array.isArray(banners)) {
      return next(new AppError('Dữ liệu không hợp lệ', 400));
    }

    const updatePromises = banners.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    const response = ApiResponse.success(null, 'Cập nhật thứ tự banners thành công');
    return response.send(res);
  });

  // Admin: Toggle active status
  static toggleBannerStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError('Không tìm thấy banner', 404));
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    const response = ApiResponse.success({ banner }, 'Cập nhật trạng thái banner thành công');
    return response.send(res);
  });

  // Admin: Thống kê banner
  static getBannerStats = asyncHandler(async (req, res, next) => {
    const stats = await Banner.aggregate([
      {
        $group: {
          _id: null,
          totalBanners: { $sum: 1 },
          activeBanners: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalViews: { $sum: '$viewCount' },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    const topBanners = await Banner.find()
      .sort({ clickCount: -1 })
      .limit(5)
      .select('title clickCount viewCount');

    const response = ApiResponse.success({
      stats: stats[0] || {
        totalBanners: 0,
        activeBanners: 0,
        totalViews: 0,
        totalClicks: 0
      },
      topBanners
    }, 'Lấy thống kê banner thành công');
    
    return response.send(res);
  });
}

module.exports = BannerController;
