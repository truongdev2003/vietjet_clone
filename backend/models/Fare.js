const mongoose = require('mongoose');

// Schema cho fare rules
const fareRuleSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  rule: {
    type: String,
    required: true
  },
  penalty: {
    amount: Number,
    percentage: Number,
    currency: String
  }
});

// Schema cho booking classes
const bookingClassSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    maxlength: 1
  },
  availability: {
    type: Number,
    min: 0,
    max: 9,
    default: 9
  },
  price: {
    type: Number,
    required: true
  },
  sold: {
    type: Number,
    default: 0
  }
});

const fareSchema = new mongoose.Schema({
  // Thông tin cơ bản
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  name: {
    vi: {
      type: String,
      required: true
    },
    en: {
      type: String,
      required: true
    }
  },

  // Thông tin tuyến bay
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },

  // Hãng hàng không
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline',
    required: true
  },

  // Loại giá vé
  type: {
    type: String,
    enum: ['published', 'private', 'negotiated', 'promotional', 'group'],
    default: 'published'
  },

  // Hạng vé
  cabinClass: {
    type: String,
    enum: ['economy', 'premium_economy', 'business', 'first'],
    required: true
  },

  // Loại hành trình
  tripType: {
    type: String,
    enum: ['one_way', 'round_trip', 'open_jaw', 'multi_city'],
    required: true
  },

  // Thông tin giá
  pricing: {
    // Giá cơ bản
    baseFare: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'VND'
      }
    },

    // Các khoản phí
    fees: {
      taxes: [{
        code: String,
        description: String,
        amount: Number
      }],
      surcharges: [{
        type: String,
        description: String,
        amount: Number
      }],
      serviceFees: [{
        type: String,
        description: String,
        amount: Number
      }]
    },

    // Tổng giá
    total: {
      type: Number,
      required: true
    },

    // Giá theo độ tuổi
    ageBasedPricing: {
      adult: {
        type: Number,
        required: true
      },
      child: {
        type: Number,
        default: function() { return this.adult * 0.75; }
      },
      infant: {
        type: Number,
        default: function() { return this.adult * 0.1; }
      }
    },

    // Dynamic pricing
    dynamic: {
      enabled: {
        type: Boolean,
        default: true
      },
      factors: [{
        factor: {
          type: String,
          enum: ['demand', 'time_to_departure', 'day_of_week', 'season', 'competition', 'load_factor']
        },
        weight: Number,
        multiplier: Number
      }],
      priceRange: {
        minimum: Number,
        maximum: Number
      }
    }
  },

  // Booking classes (RBD - Reservations/Booking Designator)
  bookingClasses: [bookingClassSchema],

  // Thời gian áp dụng
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    
    // Thời gian được phép đặt vé
    salesPeriod: {
      startDate: Date,
      endDate: Date
    },
    
    // Thời gian bay được phép
    travelPeriod: {
      startDate: Date,
      endDate: Date,
      blackoutDates: [Date],
      validDays: [Number] // 0-6, Sunday-Saturday
    }
  },

  // Điều kiện và hạn chế
  conditions: {
    // Hạn chế về thời gian đặt vé
    booking: {
      advancePurchase: {
        minimum: Number, // days
        maximum: Number
      },
      lastBookingTime: Number // hours before departure
    },

    // Hạn chế về độ lưu trú
    stay: {
      minimumStay: {
        nights: Number,
        includeSaturday: Boolean,
        includeSunday: Boolean
      },
      maximumStay: {
        months: Number,
        days: Number
      }
    },

    // Hạn chế về hành khách
    passenger: {
      minAge: Number,
      maxAge: Number,
      residency: [String],
      accompaniedBy: String
    },

    // Hạn chế về routing
    routing: {
      directOnly: Boolean,
      maxConnections: Number,
      allowedStopover: [String],
      forbiddenStopover: [String]
    }
  },

  // Quy tắc fare
  rules: {
    // Quy tắc hủy vé
    cancellation: {
      allowed: {
        type: Boolean,
        default: true
      },
      timeLimit: {
        hours: Number,
        beforeDeparture: Boolean
      },
      penalty: {
        amount: Number,
        percentage: Number,
        minimum: Number,
        maximum: Number
      },
      refundable: {
        type: Boolean,
        default: true
      }
    },

    // Quy tắc thay đổi
    changes: {
      allowed: {
        type: Boolean,
        default: true
      },
      timeLimit: {
        hours: Number,
        beforeDeparture: Boolean
      },
      penalty: {
        amount: Number,
        percentage: Number,
        minimum: Number,
        maximum: Number
      },
      allowedChanges: [String] // date, time, routing, class
    },

    // Quy tắc no-show
    noShow: {
      penalty: {
        amount: Number,
        percentage: Number
      },
      graceTime: Number // minutes
    },

    // Quy tắc upgrade/downgrade
    reclass: {
      upgradeAllowed: Boolean,
      downgradeAllowed: Boolean,
      penalty: Number,
      conditions: [String]
    }
  },

  // Bao gồm dịch vụ
  inclusions: {
    baggage: {
      carryOn: {
        weight: Number,
        pieces: Number
      },
      checked: {
        weight: Number,
        pieces: Number
      }
    },
    
    meals: {
      included: Boolean,
      type: [String]
    },
    
    seats: {
      selection: {
        type: String,
        enum: ['free', 'fee', 'not_allowed'],
        default: 'fee'
      },
      upgrade: Boolean
    },
    
    loungeAccess: Boolean,
    priorityBoarding: Boolean,
    fastTrack: Boolean
  },

  // Thông tin thị trường
  market: {
    segment: {
      type: String,
      enum: ['leisure', 'business', 'group', 'corporate', 'government']
    },
    
    distribution: {
      channels: [{
        channel: {
          type: String,
          enum: ['direct', 'gds', 'ota', 'agent', 'corporate']
        },
        commission: Number,
        markup: Number
      }]
    },
    
    competition: {
      benchmark: [{
        competitor: String,
        price: Number,
        source: String,
        date: Date
      }],
      positioning: {
        type: String,
        enum: ['premium', 'competitive', 'value', 'budget']
      }
    }
  },

  // Thống kê và hiệu suất
  performance: {
    bookings: {
      total: {
        type: Number,
        default: 0
      },
      revenue: {
        type: Number,
        default: 0
      },
      loadFactor: Number
    },
    
    demand: {
      elasticity: Number,
      seasonality: [{
        period: String,
        multiplier: Number
      }]
    },
    
    optimization: {
      lastUpdated: Date,
      algorithm: String,
      parameters: mongoose.Schema.Types.Mixed
    }
  },

  // Thông tin kỹ thuật
  technical: {
    fareCalculation: {
      method: {
        type: String,
        enum: ['published', 'constructed', 'net', 'commission']
      },
      components: [String]
    },
    
    tariff: {
      reference: String,
      source: String,
      version: String
    },
    
    gds: {
      filed: Boolean,
      carriers: [String],
      lastUpdate: Date
    }
  },

  // Approval và trạng thái
  status: {
    current: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'expired', 'suspended'],
      default: 'pending'
    },
    
    approval: {
      required: Boolean,
      approvedBy: String,
      approvedDate: Date,
      notes: String
    },
    
    filing: {
      filed: Boolean,
      filedDate: Date,
      authority: String,
      reference: String
    }
  },

  // Metadata
  metadata: {
    created: {
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    },
    
    lastUpdated: {
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    },
    
    version: {
      type: Number,
      default: 1
    },
    
    tags: [String],
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho trạng thái hiện tại
fareSchema.virtual('isValid').get(function() {
  const now = new Date();
  return now >= this.validity.startDate && 
         now <= this.validity.endDate && 
         this.status.current === 'active';
});

// Virtual cho số ngày còn lại
fareSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.validity.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual cho tỷ lệ bán
fareSchema.virtual('salesRate').get(function() {
  if (!this.bookingClasses || this.bookingClasses.length === 0) return 0;
  
  const totalSold = this.bookingClasses.reduce((sum, bc) => sum + bc.sold, 0);
  const totalAvailable = this.bookingClasses.reduce((sum, bc) => sum + bc.availability, 0);
  
  return totalAvailable > 0 ? (totalSold / totalAvailable) * 100 : 0;
});

// Index cho tìm kiếm hiệu quả
fareSchema.index({ code: 1 });
fareSchema.index({ route: 1 });
fareSchema.index({ airline: 1 });
fareSchema.index({ cabinClass: 1 });
fareSchema.index({ type: 1 });
fareSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });
fareSchema.index({ 'status.current': 1 });
fareSchema.index({ 'pricing.total': 1 });

// Compound index cho tìm kiếm fare
fareSchema.index({
  route: 1,
  cabinClass: 1,
  tripType: 1,
  'validity.startDate': 1,
  'validity.endDate': 1,
  'status.current': 1
});

// Pre-save middleware
fareSchema.pre('save', function(next) {
  // Tính tổng giá nếu chưa có
  if (!this.pricing.total) {
    let total = this.pricing.baseFare.amount;
    
    // Cộng taxes
    if (this.pricing.fees.taxes) {
      total += this.pricing.fees.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    }
    
    // Cộng surcharges
    if (this.pricing.fees.surcharges) {
      total += this.pricing.fees.surcharges.reduce((sum, charge) => sum + charge.amount, 0);
    }
    
    // Cộng service fees
    if (this.pricing.fees.serviceFees) {
      total += this.pricing.fees.serviceFees.reduce((sum, fee) => sum + fee.amount, 0);
    }
    
    this.pricing.total = total;
  }
  
  // Cập nhật adult price nếu chưa có
  if (!this.pricing.ageBasedPricing.adult) {
    this.pricing.ageBasedPricing.adult = this.pricing.total;
  }
  
  // Cập nhật lastUpdated
  this.metadata.lastUpdated.date = new Date();
  
  next();
});

// Method để calculate dynamic price
fareSchema.methods.calculateDynamicPrice = function(factors = {}) {
  let basePrice = this.pricing.baseFare.amount;
  let finalPrice = basePrice;
  
  if (this.pricing.dynamic.enabled && this.pricing.dynamic.factors) {
    this.pricing.dynamic.factors.forEach(factor => {
      const factorValue = factors[factor.factor] || 1;
      const adjustment = basePrice * factor.weight * factor.multiplier * factorValue;
      finalPrice += adjustment;
    });
    
    // Apply min/max limits
    if (this.pricing.dynamic.priceRange.minimum) {
      finalPrice = Math.max(finalPrice, this.pricing.dynamic.priceRange.minimum);
    }
    if (this.pricing.dynamic.priceRange.maximum) {
      finalPrice = Math.min(finalPrice, this.pricing.dynamic.priceRange.maximum);
    }
  }
  
  return Math.round(finalPrice);
};

// Method để check availability
fareSchema.methods.checkAvailability = function(requestedSeats = 1) {
  if (!this.bookingClasses || this.bookingClasses.length === 0) return false;
  
  return this.bookingClasses.some(bc => {
    const available = bc.availability - bc.sold;
    return available >= requestedSeats;
  });
};

module.exports = mongoose.model('Fare', fareSchema);