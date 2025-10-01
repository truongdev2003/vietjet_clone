const mongoose = require('mongoose');

// Schema cho meal options
const mealOptionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    vi: String,
    en: String
  },
  description: {
    vi: String,
    en: String
  },
  category: {
    type: String,
    enum: ['regular', 'vegetarian', 'vegan', 'halal', 'kosher', 'diabetic', 'child', 'special']
  },
  ingredients: [String],
  allergens: [String],
  calories: Number,
  price: Number,
  available: {
    type: Boolean,
    default: true
  }
});

// Schema cho baggage rules
const baggageRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['carry_on', 'checked', 'excess'],
    required: true
  },
  weight: {
    included: Number,
    maximum: Number,
    unit: {
      type: String,
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  pieces: Number,
  price: Number,
  restrictions: [String]
});

// Schema cho seat specifications
const seatSpecSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['standard', 'premium', 'extra_legroom', 'exit_row', 'bulkhead', 'bassinet'],
    required: true
  },
  features: [String],
  price: Number,
  restrictions: [String],
  available: {
    type: Boolean,
    default: true
  }
});

const serviceSchema = new mongoose.Schema({
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

  description: {
    vi: String,
    en: String
  },

  // Loại dịch vụ
  category: {
    type: String,
    enum: ['meal', 'baggage', 'seat', 'lounge', 'transport', 'insurance', 'entertainment', 'connectivity', 'special_assistance'],
    required: true
  },

  // Phân loại con
  subCategory: {
    type: String,
    enum: [
      // Meal subcategories
      'meal_selection', 'special_meal', 'beverage', 'snack',
      // Baggage subcategories  
      'extra_baggage', 'overweight', 'oversized', 'special_items',
      // Seat subcategories
      'seat_selection', 'seat_upgrade', 'extra_legroom',
      // Other subcategories
      'priority_boarding', 'fast_track', 'meet_greet', 'wifi', 'insurance_travel'
    ]
  },

  // Hãng hàng không cung cấp
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline',
    required: true
  },

  // Thông tin giá cả
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    
    // Giá theo hạng vé
    classBasedPricing: {
      economy: Number,
      premiumEconomy: Number,
      business: Number,
      first: Number
    },
    
    // Giá theo tuyến bay
    routeBasedPricing: [{
      route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      },
      price: Number
    }],
    
    // Giá theo thời gian
    timeBasedPricing: [{
      period: String,
      startDate: Date,
      endDate: Date,
      price: Number,
      multiplier: Number
    }],
    
    // Khuyến mãi
    promotions: [{
      code: String,
      discount: Number,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      validFrom: Date,
      validTo: Date,
      conditions: [String]
    }]
  },

  // Tính khả dụng
  availability: {
    // Khả dụng chung
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Khả dụng theo tuyến bay
    routes: [{
      route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      },
      available: Boolean,
      restrictions: [String]
    }],
    
    // Khả dụng theo aircraft
    aircraftTypes: [{
      type: String,
      available: Boolean
    }],
    
    // Khả dụng theo thời gian
    timeRestrictions: {
      advanceBooking: {
        minimum: Number, // hours
        maximum: Number
      },
      cutoffTime: Number, // hours before departure
      blackoutDates: [Date],
      seasonalAvailability: [{
        season: String,
        available: Boolean
      }]
    },
    
    // Giới hạn số lượng
    capacity: {
      unlimited: {
        type: Boolean,
        default: true
      },
      perFlight: Number,
      perDay: Number,
      total: Number,
      used: {
        type: Number,
        default: 0
      }
    }
  },

  // Chi tiết dịch vụ theo category
  serviceDetails: {
    // Chi tiết meal service
    meal: {
      options: [mealOptionSchema],
      servingTime: String,
      dietaryOptions: [String],
      preOrderRequired: {
        type: Boolean,
        default: false
      },
      preOrderDeadline: Number // hours before departure
    },
    
    // Chi tiết baggage service
    baggage: {
      rules: [baggageRuleSchema],
      specialItems: [{
        item: String,
        price: Number,
        restrictions: [String]
      }],
      handlingInstructions: String
    },
    
    // Chi tiết seat service
    seat: {
      specifications: [seatSpecSchema],
      selectionRules: {
        advanceSelection: Boolean,
        feeRequired: Boolean,
        restrictions: [String]
      },
      seatMap: {
        available: Boolean,
        interactive: Boolean
      }
    },
    
    // Chi tiết lounge service
    lounge: {
      locations: [{
        airport: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Airport'
        },
        name: String,
        facilities: [String],
        operatingHours: String,
        capacity: Number
      }],
      accessRules: [String],
      guestPolicy: String
    },
    
    // Chi tiết special assistance
    specialAssistance: {
      types: [{
        type: String,
        description: String,
        equipment: [String],
        notice: Number, // hours advance notice required
        restrictions: [String]
      }],
      documentation: [String],
      procedures: String
    }
  },

  // Quy tắc và điều kiện
  rules: {
    // Điều kiện đặt dịch vụ
    bookingConditions: {
      advanceBooking: Number,
      cancellationAllowed: Boolean,
      cancellationDeadline: Number,
      modificationAllowed: Boolean,
      refundable: Boolean
    },
    
    // Hạn chế
    restrictions: {
      ageRestrictions: {
        minimum: Number,
        maximum: Number
      },
      classRestrictions: [String],
      routeRestrictions: [String],
      quantityLimit: {
        perPassenger: Number,
        perBooking: Number
      }
    },
    
    // Yêu cầu đặc biệt
    requirements: {
      documentation: [String],
      medicalClearance: Boolean,
      companionRequired: Boolean,
      advanceNotice: Number
    }
  },

  // Thông tin vận hành
  operational: {
    // Nhà cung cấp dịch vụ
    supplier: {
      name: String,
      contact: String,
      contract: String,
      performance: {
        rating: Number,
        reliability: Number
      }
    },
    
    // Quy trình
    procedures: {
      booking: String,
      delivery: String,
      quality: String,
      escalation: String
    },
    
    // Thống kê
    statistics: {
      utilization: Number, // percentage
      customerSatisfaction: Number,
      complaints: Number,
      revenue: Number
    }
  },

  // Thông tin marketing
  marketing: {
    // Mô tả marketing
    marketingText: {
      vi: String,
      en: String
    },
    
    // Hình ảnh và media
    media: {
      images: [String],
      videos: [String],
      brochures: [String]
    },
    
    // Thông tin bán hàng
    salesInformation: {
      targetSegment: [String],
      sellingPoints: [String],
      competitors: [String],
      positioning: String
    },
    
    // Channels phân phối
    distributionChannels: {
      website: Boolean,
      mobile: Boolean,
      callCenter: Boolean,
      agent: Boolean,
      airport: Boolean
    }
  },

  // Quality và compliance
  quality: {
    // Tiêu chuẩn chất lượng
    standards: [{
      standard: String,
      certification: String,
      validUntil: Date
    }],
    
    // Đánh giá khách hàng
    customerFeedback: {
      averageRating: Number,
      totalReviews: Number,
      lastReviewDate: Date
    },
    
    // Audit và kiểm tra
    audits: [{
      date: Date,
      auditor: String,
      result: String,
      score: Number,
      recommendations: [String]
    }]
  },

  // Tích hợp hệ thống
  integration: {
    // Hệ thống booking
    bookingSystem: {
      integrated: Boolean,
      apiEndpoint: String,
      authentication: String
    },
    
    // Hệ thống thanh toán
    paymentSystem: {
      integrated: Boolean,
      methods: [String]
    },
    
    // Hệ thống inventory
    inventorySync: {
      realTime: Boolean,
      frequency: String,
      lastSync: Date
    }
  },

  // Trạng thái và metadata
  status: {
    current: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'discontinued'],
      default: 'active'
    },
    
    approval: {
      required: Boolean,
      approvedBy: String,
      approvedDate: Date,
      approvalLevel: String
    },
    
    testing: {
      phase: String,
      startDate: Date,
      endDate: Date,
      results: String
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

// Virtual cho giá hiển thị
serviceSchema.virtual('displayPrice').get(function() {
  return `${this.pricing.basePrice.toLocaleString()} ${this.pricing.currency}`;
});

// Virtual cho trạng thái availability
serviceSchema.virtual('isAvailable').get(function() {
  if (!this.availability.isActive || this.status.current !== 'active') {
    return false;
  }
  
  // Check capacity limits
  if (!this.availability.capacity.unlimited) {
    if (this.availability.capacity.used >= this.availability.capacity.total) {
      return false;
    }
  }
  
  return true;
});

// Virtual cho utilization rate
serviceSchema.virtual('utilizationRate').get(function() {
  if (this.availability.capacity.unlimited || !this.availability.capacity.total) {
    return null;
  }
  
  return Math.round((this.availability.capacity.used / this.availability.capacity.total) * 100);
});

// Index cho tìm kiếm hiệu quả
serviceSchema.index({ code: 1 });
serviceSchema.index({ category: 1, subCategory: 1 });
serviceSchema.index({ airline: 1 });
serviceSchema.index({ 'status.current': 1 });
serviceSchema.index({ 'availability.isActive': 1 });
serviceSchema.index({ 'pricing.basePrice': 1 });

// Text index cho tìm kiếm
serviceSchema.index({
  'name.vi': 'text',
  'name.en': 'text',
  'description.vi': 'text',
  'description.en': 'text',
  code: 'text'
});

// Compound index cho filtering
serviceSchema.index({
  category: 1,
  subCategory: 1,
  airline: 1,
  'status.current': 1,
  'availability.isActive': 1
});

// Pre-save middleware
serviceSchema.pre('save', function(next) {
  // Cập nhật lastUpdated
  this.metadata.lastUpdated.date = new Date();
  
  // Validate pricing based on category
  if (this.category === 'seat' && !this.serviceDetails.seat) {
    return next(new Error('Seat service must have seat details'));
  }
  
  if (this.category === 'meal' && !this.serviceDetails.meal) {
    return next(new Error('Meal service must have meal details'));
  }
  
  next();
});

// Method để check availability cho specific flight
serviceSchema.methods.checkFlightAvailability = function(flightId, date) {
  // Check if service is active
  if (!this.isAvailable) return false;
  
  // Check route restrictions
  if (this.availability.routes && this.availability.routes.length > 0) {
    // Would need to check flight's route against allowed routes
    // Implementation depends on flight data structure
  }
  
  // Check time restrictions
  const now = new Date();
  const flightDate = new Date(date);
  const hoursUntilFlight = (flightDate - now) / (1000 * 60 * 60);
  
  if (this.availability.timeRestrictions.cutoffTime && 
      hoursUntilFlight < this.availability.timeRestrictions.cutoffTime) {
    return false;
  }
  
  // Check blackout dates
  if (this.availability.timeRestrictions.blackoutDates) {
    const isBlackout = this.availability.timeRestrictions.blackoutDates.some(blackoutDate => {
      return blackoutDate.toDateString() === flightDate.toDateString();
    });
    if (isBlackout) return false;
  }
  
  return true;
};

// Method để calculate price for specific conditions
serviceSchema.methods.calculatePrice = function(conditions = {}) {
  let price = this.pricing.basePrice;
  
  // Apply class-based pricing
  if (conditions.seatClass && this.pricing.classBasedPricing[conditions.seatClass]) {
    price = this.pricing.classBasedPricing[conditions.seatClass];
  }
  
  // Apply route-based pricing
  if (conditions.route) {
    const routePricing = this.pricing.routeBasedPricing.find(rp => 
      rp.route.toString() === conditions.route.toString()
    );
    if (routePricing) {
      price = routePricing.price;
    }
  }
  
  // Apply time-based pricing
  if (conditions.date) {
    const date = new Date(conditions.date);
    const timePricing = this.pricing.timeBasedPricing.find(tp => {
      const start = new Date(tp.startDate);
      const end = new Date(tp.endDate);
      return date >= start && date <= end;
    });
    
    if (timePricing) {
      if (timePricing.price) {
        price = timePricing.price;
      } else if (timePricing.multiplier) {
        price = price * timePricing.multiplier;
      }
    }
  }
  
  // Apply promotions
  if (conditions.promoCode) {
    const promotion = this.pricing.promotions.find(p => 
      p.code === conditions.promoCode && 
      new Date() >= new Date(p.validFrom) && 
      new Date() <= new Date(p.validTo)
    );
    
    if (promotion) {
      if (promotion.discountType === 'percentage') {
        price = price * (1 - promotion.discount / 100);
      } else {
        price = Math.max(0, price - promotion.discount);
      }
    }
  }
  
  return Math.round(price);
};

// Method để book service
serviceSchema.methods.bookService = function(quantity = 1) {
  if (!this.availability.capacity.unlimited) {
    if (this.availability.capacity.used + quantity > this.availability.capacity.total) {
      throw new Error('Service capacity exceeded');
    }
    
    this.availability.capacity.used += quantity;
  }
  
  return this.save();
};

module.exports = mongoose.model('Service', serviceSchema);