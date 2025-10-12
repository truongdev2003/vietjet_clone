const mongoose = require('mongoose');

const paymentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã thanh toán là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [4, 'Mã phải có ít nhất 4 ký tự'],
    maxlength: [20, 'Mã không được vượt quá 20 ký tự']
  },

  name: {
    type: String,
    required: [true, 'Tên mã thanh toán là bắt buộc'],
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Loại giảm giá là bắt buộc'],
    default: 'percentage'
  },

  // Giá trị giảm (% hoặc số tiền cố định)
  value: {
    type: Number,
    required: [true, 'Giá trị giảm là bắt buộc'],
    min: [0, 'Giá trị giảm không được âm']
  },

  // Số tiền tối thiểu để áp dụng
  minAmount: {
    type: Number,
    default: 0,
    min: [0, 'Số tiền tối thiểu không được âm']
  },

  // Số tiền giảm tối đa (chỉ áp dụng cho percentage)
  maxDiscount: {
    type: Number,
    default: null
  },

  // Ngày bắt đầu hiệu lực
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc'],
    default: Date.now
  },

  // Ngày hết hạn
  expiryDate: {
    type: Date,
    required: [true, 'Ngày hết hạn là bắt buộc']
  },

  // Giới hạn số lần sử dụng
  usageLimit: {
    total: {
      type: Number,
      default: null // null = không giới hạn
    },
    perUser: {
      type: Number,
      default: 1 // Mỗi user chỉ được dùng 1 lần
    }
  },

  // Số lần đã sử dụng
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Danh sách user đã sử dụng mã này
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
    },
    discountAmount: {
      type: Number
    }
  }],

  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },

  // Áp dụng cho
  applicableFor: {
    // Áp dụng cho chuyến bay cụ thể
    flights: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight'
    }],
    
    // Áp dụng cho route cụ thể
    routes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    }],
    
    // Áp dụng cho hạng vé
    fareClasses: [{
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first']
    }],
    
    // Áp dụng cho loại user
    userTypes: [{
      type: String,
      enum: ['all', 'new', 'returning', 'vip']
    }]
  },

  // Metadata
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String],
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
paymentCodeSchema.index({ code: 1 });
paymentCodeSchema.index({ status: 1 });
paymentCodeSchema.index({ expiryDate: 1 });
paymentCodeSchema.index({ 'usedBy.user': 1 });

// Virtual: Kiểm tra còn hiệu lực
paymentCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.startDate <= now &&
    this.expiryDate >= now &&
    (this.usageLimit.total === null || this.usedCount < this.usageLimit.total)
  );
});

// Method: Kiểm tra user có thể sử dụng mã này không
paymentCodeSchema.methods.canUserUse = function(userId) {
  if (!this.isValid) {
    return { valid: false, message: 'Mã không còn hiệu lực' };
  }

  // Kiểm tra giới hạn tổng
  if (this.usageLimit.total !== null && this.usedCount >= this.usageLimit.total) {
    return { valid: false, message: 'Mã đã hết lượt sử dụng' };
  }

  // Kiểm tra giới hạn per user
  const userUsageCount = this.usedBy.filter(
    usage => usage.user && usage.user.toString() === userId.toString()
  ).length;

  if (userUsageCount >= this.usageLimit.perUser) {
    return { valid: false, message: 'Bạn đã sử dụng hết lượt cho mã này' };
  }

  return { valid: true };
};

// Method: Tính toán discount
paymentCodeSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid) {
    return 0;
  }

  if (amount < this.minAmount) {
    return 0;
  }

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (amount * this.value) / 100;
    
    // Áp dụng giới hạn giảm tối đa
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed amount
    discount = this.value;
    
    // Không cho phép discount lớn hơn amount
    if (discount > amount) {
      discount = amount;
    }
  }

  return Math.round(discount);
};

// Method: Ghi nhận sử dụng mã
paymentCodeSchema.methods.recordUsage = async function(userId, bookingId, discountAmount) {
  this.usedCount += 1;
  this.usedBy.push({
    user: userId,
    booking: bookingId,
    discountAmount: discountAmount,
    usedAt: new Date()
  });
  
  await this.save();
};

// Static method: Tìm mã hợp lệ
paymentCodeSchema.statics.findValidCode = async function(code) {
  const paymentCode = await this.findOne({ 
    code: code.toUpperCase(),
    status: 'active'
  });

  if (!paymentCode) {
    throw new Error('Mã không tồn tại hoặc đã bị vô hiệu hóa');
  }

  const now = new Date();
  
  if (paymentCode.startDate > now) {
    throw new Error('Mã chưa có hiệu lực');
  }
  
  if (paymentCode.expiryDate < now) {
    // Tự động update status
    paymentCode.status = 'expired';
    await paymentCode.save();
    throw new Error('Mã đã hết hạn');
  }

  if (paymentCode.usageLimit.total !== null && 
      paymentCode.usedCount >= paymentCode.usageLimit.total) {
    throw new Error('Mã đã hết lượt sử dụng');
  }

  return paymentCode;
};

// Middleware: Tự động update status khi hết hạn
paymentCodeSchema.pre('save', function(next) {
  if (this.expiryDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Middleware: Validate percentage value
paymentCodeSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.value > 100) {
    next(new Error('Giá trị giảm theo phần trăm không được vượt quá 100%'));
  }
  next();
});

const PaymentCode = mongoose.model('PaymentCode', paymentCodeSchema);

module.exports = PaymentCode;
