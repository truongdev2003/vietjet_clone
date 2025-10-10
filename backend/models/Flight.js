const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  // Thông tin chuyến bay cơ bản
  flightNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z]{2}\d{1,4}$/  // VD: VJ123
  },
  
  // Thông tin hãng bay
  airline: {
    code: {
      type: String,
      default: 'VJ',
      uppercase: true
    },
    name: {
      type: String,
      default: 'VietJet Air'
    },
    logo: String
  },

  // Thông tin tuyến bay
  route: {
    departure: {
      airport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport',
        required: true
      },
      time: {
        type: Date,
        required: true
      },
      terminal: {
        type: String,
        default: 'T1'
      },
      gate: String,
      checkInCounters: [String],
      scheduledTime: Date,  // Giờ dự kiến ban đầu
      estimatedTime: Date,  // Giờ ước tính hiện tại
      actualTime: Date      // Giờ thực tế
    },
    arrival: {
      airport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport',
        required: true
      },
      time: {
        type: Date,
        required: true
      },
      terminal: {
        type: String,
        default: 'T1'
      },
      gate: String,
      scheduledTime: Date,
      estimatedTime: Date,
      actualTime: Date
    },
    distance: {
      type: Number,  // km
      required: true
    },
    duration: {
      scheduled: {
        type: Number,  // phút
        required: true
      },
      actual: Number
    }
  },

  // Thông tin máy bay
  aircraft: {
    type: {
      type: String,
      required: true
    },
    registration: String,  // VD: VN-A123
    age: Number,
    configuration: {
      economy: {
        rows: Number,
        seatsPerRow: Number,
        totalSeats: Number
      },
      premiumEconomy: {
        rows: Number,
        seatsPerRow: Number,
        totalSeats: Number
      },
      business: {
        rows: Number,
        seatsPerRow: Number,
        totalSeats: Number
      },
      first: {
        rows: Number,
        seatsPerRow: Number,
        totalSeats: Number
      }
    }
  },

  // Thông tin giá vé
  pricing: {
    economy: {
      base: {
        type: Number,
        required: true
      },
      saver: Number,      // Giá tiết kiệm
      classic: Number,    // Giá cơ bản
      flexible: Number    // Giá linh hoạt
    },
    premiumEconomy: {
      base: Number,
      flexible: Number
    },
    business: {
      base: {
        type: Number,
        required: true
      },
      flexible: Number
    },
    first: {
      base: Number,
      flexible: Number
    }
  },

  // Thông tin ghế ngồi
  seats: {
    economy: {
      total: {
        type: Number,
        required: true
      },
      available: {
        type: Number,
        required: true
      },
      blocked: {
        type: Number,
        default: 0
      }
    },
    premiumEconomy: {
      total: {
        type: Number,
        default: 0
      },
      available: {
        type: Number,
        default: 0
      },
      blocked: {
        type: Number,
        default: 0
      }
    },
    business: {
      total: {
        type: Number,
        required: true
      },
      available: {
        type: Number,
        required: true
      },
      blocked: {
        type: Number,
        default: 0
      }
    },
    first: {
      total: {
        type: Number,
        default: 0
      },
      available: {
        type: Number,
        default: 0
      },
      blocked: {
        type: Number,
        default: 0
      }
    }
  },

  // Sơ đồ ghế
  seatMap: [{
    row: Number,
    seats: [{
      seatNumber: String,
      class: {
        type: String,
        enum: ['economy', 'premium_economy', 'business', 'first']
      },
      type: {
        type: String,
        enum: ['window', 'middle', 'aisle', 'exit_row', 'bulkhead']
      },
      status: {
        type: String,
        enum: ['available', 'occupied', 'blocked', 'maintenance'],
        default: 'available'
      },
      price: {
        type: Number,
        default: 0  // Phí chọn ghế
      },
      features: [String]  // VD: ['extra_legroom', 'power_outlet']
    }]
  }],

  // Trạng thái chuyến bay
  status: {
    type: String,
    enum: [
      'scheduled',    // Đã lên lịch
      'boarding',     // Đang lên máy bay
      'delayed',      // Bị hoãn
      'departed',     // Đã khởi hành
      'in_flight',    // Đang bay
      'landed',       // Đã hạ cánh
      'arrived',      // Đã đến
      'cancelled',    // Đã hủy
      'diverted'      // Chuyển hướng
    ],
    default: 'scheduled'
  },

  // Thông tin về độ trễ
  delay: {
    departure: {
      minutes: {
        type: Number,
        default: 0
      },
      reason: String,
      category: {
        type: String,
        enum: ['weather', 'technical', 'atc', 'crew', 'passenger', 'security', 'other']
      }
    },
    arrival: {
      minutes: {
        type: Number,
        default: 0
      },
      reason: String
    }
  },

  // Thông tin dịch vụ
  services: {
    meals: {
      available: {
        type: Boolean,
        default: true
      },
      types: [{
        type: String,
        enum: ['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'child'],
        price: Number
      }]
    },
    baggage: {
      carryOn: {
        weight: {
          type: Number,
          default: 7  // kg
        },
        dimensions: String
      },
      checked: [{
        weight: Number,
        price: Number
      }]
    },
    entertainment: {
      wifi: {
        available: {
          type: Boolean,
          default: false
        },
        price: Number
      },
      ife: {
        type: Boolean,
        default: false  // In-flight entertainment
      }
    },
    specialServices: [String]  // VD: ['wheelchair', 'unaccompanied_minor']
  },

  // Thông tin tần suất
  frequency: {
    isRegular: {
      type: Boolean,
      default: true
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6  // 0 = Sunday, 6 = Saturday
    }],
    seasonality: {
      type: String,
      enum: ['year_round', 'summer', 'winter', 'special'],
      default: 'year_round'
    },
    effectiveFrom: Date,
    effectiveTo: Date
  },

  // Thông tin vận hành
  operational: {
    crew: {
      pilots: Number,
      flightAttendants: Number,
      captain: String,
      firstOfficer: String
    },
    fuel: {
      planned: Number,
      actual: Number,
      unit: {
        type: String,
        default: 'kg'
      }
    },
    weight: {
      payload: Number,
      baggage: Number,
      cargo: Number
    }
  },

  // Metadata
  metadata: {
    codeshare: [{
      airline: String,
      flightNumber: String
    }],
    bookingClass: {
      economy: [String],      // Y, M, B, H, K, L...
      business: [String],     // C, J, D, I, Z...
      first: [String]         // F, A, P...
    },
    createdBy: String,
    lastModifiedBy: String,
    isActive: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'active'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tổng số ghế
flightSchema.virtual('totalSeats').get(function() {
  return this.seats.economy.total + 
         this.seats.premiumEconomy.total + 
         this.seats.business.total + 
         this.seats.first.total;
});

// Virtual cho tổng số ghế còn trống
flightSchema.virtual('totalAvailable').get(function() {
  return this.seats.economy.available + 
         this.seats.premiumEconomy.available + 
         this.seats.business.available + 
         this.seats.first.available;
});

// Virtual cho tỷ lệ lấp đầy
flightSchema.virtual('loadFactor').get(function() {
  const total = this.totalSeats;
  const available = this.totalAvailable;
  if (total === 0) return 0;
  return Math.round(((total - available) / total) * 100);
});

// Virtual cho thời gian bay thực tế
flightSchema.virtual('actualDuration').get(function() {
  if (this.route.departure.actualTime && this.route.arrival.actualTime) {
    const diff = new Date(this.route.arrival.actualTime) - new Date(this.route.departure.actualTime);
    return Math.round(diff / (1000 * 60)); // phút
  }
  return this.route.duration.scheduled;
});

// Index cho tìm kiếm hiệu quả
flightSchema.index({ 
  'route.departure.airport': 1, 
  'route.arrival.airport': 1, 
  'route.departure.time': 1 
});
flightSchema.index({ 'route.departure.time': 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ 'metadata.isActive': 1 });
flightSchema.index({ 'frequency.daysOfWeek': 1 });

// Middleware tự động cập nhật thời gian ước tính
flightSchema.pre('save', function(next) {
  // Cập nhật estimated time dựa trên delay
  if (this.delay.departure.minutes > 0) {
    const departureTime = new Date(this.route.departure.scheduledTime || this.route.departure.time);
    this.route.departure.estimatedTime = new Date(departureTime.getTime() + this.delay.departure.minutes * 60000);
    
    const arrivalTime = new Date(this.route.arrival.scheduledTime || this.route.arrival.time);
    this.route.arrival.estimatedTime = new Date(arrivalTime.getTime() + this.delay.departure.minutes * 60000);
  }
  
  next();
});

module.exports = mongoose.model('Flight', flightSchema);