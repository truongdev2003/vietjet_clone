const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const Booking = require('../models/Booking');
const ApiResponse = require('../utils/apiResponse');
const mongoose = require('mongoose');

/**
 * Validate promo code
 * POST /api/promo/validate
 */
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, amount, userId, routeId, airlineId } = req.body;

    // Find promo code
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      active: true 
    });

    if (!promoCode) {
      return errorResponse(res, 'Mã khuyến mãi không tồn tại hoặc đã hết hạn', 404);
    }

    // Check if valid
    if (!promoCode.isValid) {
      return errorResponse(res, 'Mã khuyến mãi đã hết hạn hoặc đã sử dụng hết', 400);
    }

    // Check minimum amount
    if (amount < promoCode.minAmount) {
      return errorResponse(
        res, 
        `Đơn hàng tối thiểu để áp dụng mã này là ${promoCode.minAmount.toLocaleString('vi-VN')} VNĐ`, 
        400
      );
    }

    // Check route restriction
    if (promoCode.applicableRoutes.length > 0) {
      if (!routeId || !promoCode.applicableRoutes.includes(routeId)) {
        return errorResponse(res, 'Mã khuyến mãi không áp dụng cho tuyến bay này', 400);
      }
    }

    // Check airline restriction
    if (promoCode.applicableAirlines.length > 0) {
      if (!airlineId || !promoCode.applicableAirlines.includes(airlineId)) {
        return errorResponse(res, 'Mã khuyến mãi không áp dụng cho hãng bay này', 400);
      }
    }

    // Check user eligibility
    if (userId) {
      const canUse = promoCode.canUserUse(userId);
      if (!canUse) {
        return errorResponse(
          res, 
          `Bạn đã sử dụng hết số lần cho phép (${promoCode.perUserLimit} lần)`, 
          400
        );
      }

      // Check new user only
      if (promoCode.newUserOnly) {
        const user = await User.findById(userId);
        if (!user) {
          return errorResponse(res, 'Người dùng không tồn tại', 404);
        }

        const bookingCount = await Booking.countDocuments({ 
          user: userId,
          status: { $nin: ['cancelled', 'expired'] }
        });

        if (bookingCount > 0) {
          return errorResponse(res, 'Mã khuyến mãi chỉ dành cho khách hàng mới', 400);
        }
      }
    } else {
      // Guest user
      if (promoCode.newUserOnly) {
        return errorResponse(res, 'Mã khuyến mãi chỉ dành cho tài khoản đã đăng ký', 400);
      }
    }

    // Calculate discount
    const discount = promoCode.calculateDiscount(amount);

    return successResponse(res, {
      valid: true,
      promoCode: {
        code: promoCode.code,
        description: promoCode.description,
        type: promoCode.type,
        value: promoCode.value,
        discount: discount,
        finalAmount: amount - discount
      }
    }, 'Mã khuyến mãi hợp lệ');

  } catch (error) {
    console.error('Validate promo code error:', error);
    return errorResponse(res, 'Lỗi khi xác thực mã khuyến mãi', 500);
  }
};

/**
 * Get all active promo codes (public)
 * GET /api/promo/public
 */
exports.getPublicPromoCodes = async (req, res) => {
  try {
    const now = new Date();

    const promoCodes = await PromoCode.find({
      active: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
      ]
    })
    .select('code description type value maxDiscount minAmount validUntil')
    .sort({ createdAt: -1 });

    const response = ApiResponse.success({ promoCodes }, 'Lấy danh sách mã khuyến mãi thành công');
    return response.send(res);

  } catch (error) {
    console.error('Get public promo codes error:', error);
    const response = ApiResponse.error('Lỗi khi lấy danh sách mã khuyến mãi', 500);
    return response.send(res);
  }
};

/**
 * Apply promo code to booking
 * POST /api/promo/apply
 */
exports.applyPromoCode = async (req, res) => {
  try {
    const { code, bookingId, userId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking không tồn tại', 404);
    }

    if (booking.status !== 'pending') {
      return errorResponse(res, 'Chỉ có thể áp dụng mã khuyến mãi cho booking đang chờ thanh toán', 400);
    }

    if (booking.promoCode) {
      return errorResponse(res, 'Booking đã áp dụng mã khuyến mãi', 400);
    }

    // Find and validate promo code
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      active: true 
    });

    if (!promoCode || !promoCode.isValid) {
      return errorResponse(res, 'Mã khuyến mãi không hợp lệ', 400);
    }

    // Validate conditions
    const totalAmount = booking.totalAmount;

    if (totalAmount < promoCode.minAmount) {
      return errorResponse(
        res, 
        `Đơn hàng tối thiểu để áp dụng mã này là ${promoCode.minAmount.toLocaleString('vi-VN')} VNĐ`, 
        400
      );
    }

    // Check user eligibility
    if (userId && !promoCode.canUserUse(userId)) {
      return errorResponse(res, 'Bạn đã sử dụng hết số lần cho phép', 400);
    }

    // Calculate discount
    const discount = promoCode.calculateDiscount(totalAmount);

    // Update booking
    booking.promoCode = promoCode._id;
    booking.discount = discount;
    booking.totalAmount = totalAmount - discount;
    await booking.save();

    // Mark promo as used
    await promoCode.markAsUsed(userId || null, bookingId);

    return successResponse(res, {
      booking: {
        _id: booking._id,
        originalAmount: totalAmount,
        discount: discount,
        finalAmount: booking.totalAmount
      }
    }, 'Áp dụng mã khuyến mãi thành công');

  } catch (error) {
    console.error('Apply promo code error:', error);
    return errorResponse(res, 'Lỗi khi áp dụng mã khuyến mãi', 500);
  }
};

// ========== ADMIN ENDPOINTS ==========

/**
 * Create promo code (Admin)
 * POST /api/admin/promo
 */
exports.createPromoCode = async (req, res) => {
  try {
    const promoData = {
      ...req.body,
      createdBy: req.user._id
    };

    const promoCode = await PromoCode.create(promoData);

    return successResponse(res, { promoCode }, 'Tạo mã khuyến mãi thành công', 201);

  } catch (error) {
    console.error('Create promo code error:', error);
    
    if (error.code === 11000) {
      return errorResponse(res, 'Mã khuyến mãi đã tồn tại', 400);
    }

    if (error.name === 'ValidationError') {
      return errorResponse(res, Object.values(error.errors)[0].message, 400);
    }

    return errorResponse(res, 'Lỗi khi tạo mã khuyến mãi', 500);
  }
};

/**
 * Get all promo codes (Admin)
 * GET /api/admin/promo
 */
exports.getAllPromoCodes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      active, 
      type,
      search 
    } = req.query;

    const filter = {};

    if (active !== undefined) {
      filter.active = active === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const promoCodes = await PromoCode.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PromoCode.countDocuments(filter);

    return successResponse(res, {
      promoCodes,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count
    }, 'Lấy danh sách mã khuyến mãi thành công');

  } catch (error) {
    console.error('Get all promo codes error:', error);
    return errorResponse(res, 'Lỗi khi lấy danh sách mã khuyến mãi', 500);
  }
};

/**
 * Get promo code by ID (Admin)
 * GET /api/admin/promo/:id
 */
exports.getPromoCodeById = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('usedBy.user', 'name email')
      .populate('usedBy.booking', 'bookingReference totalAmount');

    if (!promoCode) {
      return errorResponse(res, 'Mã khuyến mãi không tồn tại', 404);
    }

    return successResponse(res, { promoCode }, 'Lấy thông tin mã khuyến mãi thành công');

  } catch (error) {
    console.error('Get promo code by ID error:', error);
    return errorResponse(res, 'Lỗi khi lấy thông tin mã khuyến mãi', 500);
  }
};

/**
 * Update promo code (Admin)
 * PUT /api/admin/promo/:id
 */
exports.updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return errorResponse(res, 'Mã khuyến mãi không tồn tại', 404);
    }

    // Don't allow updating code if already used
    if (promoCode.usageCount > 0 && req.body.code) {
      return errorResponse(res, 'Không thể thay đổi mã đã được sử dụng', 400);
    }

    Object.assign(promoCode, req.body);
    await promoCode.save();

    return successResponse(res, { promoCode }, 'Cập nhật mã khuyến mãi thành công');

  } catch (error) {
    console.error('Update promo code error:', error);

    if (error.name === 'ValidationError') {
      return errorResponse(res, Object.values(error.errors)[0].message, 400);
    }

    return errorResponse(res, 'Lỗi khi cập nhật mã khuyến mãi', 500);
  }
};

/**
 * Delete promo code (Admin)
 * DELETE /api/admin/promo/:id
 */
exports.deletePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return errorResponse(res, 'Mã khuyến mãi không tồn tại', 404);
    }

    // Don't allow deleting if already used
    if (promoCode.usageCount > 0) {
      return errorResponse(res, 'Không thể xóa mã đã được sử dụng. Hãy deactivate thay vì xóa.', 400);
    }

    await promoCode.deleteOne();

    return successResponse(res, null, 'Xóa mã khuyến mãi thành công');

  } catch (error) {
    console.error('Delete promo code error:', error);
    return errorResponse(res, 'Lỗi khi xóa mã khuyến mãi', 500);
  }
};

/**
 * Toggle promo code status (Admin)
 * PATCH /api/admin/promo/:id/toggle
 */
exports.togglePromoCodeStatus = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return errorResponse(res, 'Mã khuyến mãi không tồn tại', 404);
    }

    promoCode.active = !promoCode.active;
    await promoCode.save();

    return successResponse(
      res, 
      { promoCode }, 
      `${promoCode.active ? 'Kích hoạt' : 'Vô hiệu hóa'} mã khuyến mãi thành công`
    );

  } catch (error) {
    console.error('Toggle promo code status error:', error);
    return errorResponse(res, 'Lỗi khi thay đổi trạng thái mã khuyến mãi', 500);
  }
};

/**
 * Get promo code statistics (Admin)
 * GET /api/admin/promo/stats
 */
exports.getPromoCodeStats = async (req, res) => {
  try {
    const now = new Date();

    const stats = await PromoCode.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [
            { $match: { active: true } },
            { $count: 'count' }
          ],
          valid: [
            {
              $match: {
                active: true,
                validFrom: { $lte: now },
                validUntil: { $gte: now }
              }
            },
            { $count: 'count' }
          ],
          expired: [
            {
              $match: {
                validUntil: { $lt: now }
              }
            },
            { $count: 'count' }
          ],
          totalUsage: [
            {
              $group: {
                _id: null,
                total: { $sum: '$usageCount' }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      total: stats[0].total[0]?.count || 0,
      active: stats[0].active[0]?.count || 0,
      valid: stats[0].valid[0]?.count || 0,
      expired: stats[0].expired[0]?.count || 0,
      totalUsage: stats[0].totalUsage[0]?.total || 0
    };

    return successResponse(res, { stats: result }, 'Lấy thống kê mã khuyến mãi thành công');

  } catch (error) {
    console.error('Get promo code stats error:', error);
    return errorResponse(res, 'Lỗi khi lấy thống kê mã khuyến mãi', 500);
  }
};
