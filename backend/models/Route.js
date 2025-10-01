const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  // Thông tin tuyến bay cơ bản
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Điểm đi và điểm đến
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airport',
    required: true
  },
  
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airport',
    required: true
  },

  // Hãng hàng không vận hành
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline',
    required: true
  },

  // Loại tuyến bay
  type: {
    type: String,
    enum: ['domestic', 'international', 'regional'],
    required: true
  },

  // Thông tin khoảng cách và thời gian
  distance: {
    nauticalMiles: {
      type: Number,
      required: true
    },
    kilometers: {
      type: Number,
      required: true
    }
  },

  duration: {
    scheduled: {
      type: Number, // phút
      required: true
    },
    minimum: Number,
    maximum: Number,
    average: Number
  },

  // Thông tin vận hành
  operational: {
    frequency: {
      daily: Number,
      weekly: Number,
      monthly: Number,
      seasonal: Boolean
    },
    
    schedule: {
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      timeSlots: [{
        departure: String, // HH:MM format
        arrival: String,
        frequency: String // daily, weekly, etc.
      }]
    },

    aircraft: [{
      type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aircraft'
      },
      usage: Number // percentage
    }],

    capacity: {
      daily: {
        passengers: Number,
        cargo: Number // kg
      },
      peak: {
        passengers: Number,
        cargo: Number
      }
    }
  },

  // Thông tin thị trường
  market: {
    competition: {
      totalAirlines: Number,
      competitors: [{
        airline: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Airline'
        },
        marketShare: Number,
        frequency: Number
      }]
    },
    
    demand: {
      business: Number, // percentage
      leisure: Number,
      vfr: Number, // visiting friends and relatives
      other: Number
    },

    seasonality: {
      peakMonths: [Number],
      lowMonths: [Number],
      factors: [String] // weather, holidays, events
    },

    traffic: {
      annual: {
        passengers: Number,
        loadFactor: Number,
        revenue: Number
      },
      monthly: [{
        month: Number,
        passengers: Number,
        loadFactor: Number
      }]
    }
  },

  // Thông tin pricing
  pricing: {
    baseFare: {
      economy: {
        low: Number,
        high: Number,
        average: Number
      },
      business: {
        low: Number,
        high: Number,
        average: Number
      }
    },

    factors: {
      fuelSurcharge: Number,
      airportTax: Number,
      securityFee: Number,
      serviceFee: Number
    },

    seasonal: [{
      season: {
        type: String,
        enum: ['peak', 'high', 'shoulder', 'low']
      },
      months: [Number],
      multiplier: Number
    }],

    dynamic: {
      enabled: {
        type: Boolean,
        default: true
      },
      factors: [String], // demand, competition, time, etc.
      algorithm: String
    }
  },

  // Quy định và hạn chế
  regulations: {
    visa: {
      required: Boolean,
      transitVisa: Boolean,
      visaOnArrival: Boolean
    },
    
    restrictions: {
      embargo: Boolean,
      seasonalBan: [String],
      slotRestrictions: Boolean,
      noiseRestrictions: Boolean
    },

    requirements: {
      passport: {
        validity: Number // months
      },
      health: [String],
      customs: [String]
    }
  },

  // Dịch vụ trên tuyến
  services: {
    available: {
      meals: Boolean,
      entertainment: Boolean,
      wifi: Boolean,
      lounges: Boolean
    },

    ground: {
      fastTrack: Boolean,
      meetAndGreet: Boolean,
      vipServices: Boolean
    },

    cargo: {
      available: Boolean,
      specialHandling: [String],
      restrictions: [String]
    }
  },

  // Hiệu suất vận hành
  performance: {
    onTimePerformance: {
      percentage: Number,
      benchmark: Number
    },
    
    loadFactor: {
      average: Number,
      target: Number,
      breakeven: Number
    },

    revenue: {
      perSeat: Number,
      perKm: Number,
      yield: Number
    },

    costs: {
      fuel: Number,
      crew: Number,
      maintenance: Number,
      airport: Number,
      other: Number
    }
  },

  // Thông tin lịch sử
  history: {
    launched: {
      type: Date,
      required: true
    },
    suspended: [{
      from: Date,
      to: Date,
      reason: String
    }],
    
    milestones: [{
      date: Date,
      event: String,
      description: String
    }]
  },

  // Thông tin hợp tác
  partnerships: {
    codeshare: [{
      airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline'
      },
      direction: {
        type: String,
        enum: ['both', 'inbound', 'outbound']
      }
    }],
    
    interline: [{
      airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline'
      },
      type: String
    }]
  },

  // Trạng thái
  status: {
    operational: {
      type: String,
      enum: ['active', 'suspended', 'seasonal', 'discontinued'],
      default: 'active'
    },
    
    approval: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'
    },

    effectiveFrom: Date,
    effectiveTo: Date,
    
    notes: String
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

    dataSource: String,
    verified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tên tuyến bay
routeSchema.virtual('routeName').get(function() {
  return `${this.origin?.code?.iata || 'N/A'}-${this.destination?.code?.iata || 'N/A'}`;
});

// Virtual cho khoảng cách km
routeSchema.virtual('distanceKm').get(function() {
  return Math.round(this.distance.nauticalMiles * 1.852);
});

// Virtual cho thời gian bay
routeSchema.virtual('flightTime').get(function() {
  const hours = Math.floor(this.duration.scheduled / 60);
  const minutes = this.duration.scheduled % 60;
  return `${hours}h ${minutes}m`;
});

// Index cho tìm kiếm hiệu quả
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ airline: 1 });
routeSchema.index({ type: 1 });
routeSchema.index({ 'status.operational': 1 });
routeSchema.index({ code: 1 });
routeSchema.index({ 'operational.schedule.daysOfWeek': 1 });

// Compound index cho tìm kiếm tuyến bay
routeSchema.index({ 
  origin: 1, 
  destination: 1, 
  'status.operational': 1,
  'operational.schedule.daysOfWeek': 1
});

// Pre-save middleware
routeSchema.pre('save', function(next) {
  // Tự động tính khoảng cách km nếu chưa có
  if (this.distance.nauticalMiles && !this.distance.kilometers) {
    this.distance.kilometers = Math.round(this.distance.nauticalMiles * 1.852);
  }
  
  // Cập nhật lastUpdated
  this.metadata.lastUpdated.date = new Date();
  
  next();
});

module.exports = mongoose.model('Route', routeSchema);