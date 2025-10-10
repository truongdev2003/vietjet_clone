const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã khuyến mãi là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [4, 'Mã khuyến mãi phải có ít nhất 4 ký tự'],
    maxlength: [20, 'Mã khuyến mãi không được quá 20 ký tự']
  },

  description: {
    type: String,
    required: [true, 'Mô tả khuyến mãi là bắt buộc']
  },

  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },

  // Giá trị giảm giá
  value: {
    type: Number,
    required: [true, 'Giá trị khuyến mãi là bắt buộc'],
    min: [0, 'Giá trị khuyến mãi không được âm']
  },

  // Giảm tối đa (cho type = percentage)
  maxDiscount: {
    type: Number,
    min: [0, 'Giá trị giảm tối đa không được âm']
  },

  // Giá trị đơn hàng tối thiểu để áp dụng
  minAmount: {
    type: Number,
    default: 0,
    min: [0, 'Giá trị tối thiểu không được âm']
  },

  // Thời gian hiệu lực
  validFrom: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc'],
    default: Date.now
  },

  validUntil: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },

  // Giới hạn số lần sử dụng
  usageLimit: {
    type: Number,
    default: null // null = unlimited
  },

  // Số lần đã sử dụng
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Số lần sử dụng không được âm']
  },

  // Giới hạn sử dụng per user
  perUserLimit: {
    type: Number,
    default: 1
  },

  // Danh sách users đã sử dụng
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],

  // Áp dụng cho routes cụ thể
  applicableRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],

  // Áp dụng cho airlines cụ thể
  applicableAirlines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline'
  }],

  // Chỉ dành cho new users
  newUserOnly: {
    type: Boolean,
    default: false
  },

  // Active/Inactive
  active: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notes: String

}, {
  timestamps: true
});

// Indexes
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ active: 1 });

// Virtual: check if promo is currently valid
promoCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.active && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.usageLimit === null || this.usageCount < this.usageLimit);
});

// Method: Calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid) {
    return 0;
  }

  if (amount < this.minAmount) {
    return 0;
  }

  let discount = 0;

  if (this.type === 'percentage') {
    discount = (amount * this.value) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // fixed
    discount = this.value;
  }

  // Không giảm quá tổng tiền
  return Math.min(discount, amount);
};

// Method: Check if user can use this promo
promoCodeSchema.methods.canUserUse = function(userId) {
  if (!this.isValid) {
    return false;
  }

  // Check new user only restriction
  if (this.newUserOnly && userId) {
    // This check should be done in controller with User model
    return true; // Let controller handle this
  }

  // Check per user limit
  if (userId && this.perUserLimit) {
    const userUsageCount = this.usedBy.filter(
      u => u.user && u.user.toString() === userId.toString()
    ).length;

    if (userUsageCount >= this.perUserLimit) {
      return false;
    }
  }

  return true;
};

// Method: Mark as used
promoCodeSchema.methods.markAsUsed = async function(userId, bookingId) {
  this.usageCount += 1;
  
  if (userId) {
    this.usedBy.push({
      user: userId,
      booking: bookingId,
      usedAt: new Date()
    });
  }

  return this.save();
};

// Pre-save validation
promoCodeSchema.pre('save', function(next) {
  // Validate dates
  if (this.validUntil <= this.validFrom) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }

  // Validate percentage value
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Phần trăm giảm giá không được vượt quá 100'));
  }

  next();
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

module.exports = PromoCode;
