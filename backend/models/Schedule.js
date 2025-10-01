const mongoose = require('mongoose');

// Schema cho flight schedule
const flightScheduleSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true
  },
  departure: {
    time: {
      type: String, // HH:MM format
      required: true
    },
    day: {
      type: Number, // 0 = Sunday, 6 = Saturday
      required: true
    }
  },
  arrival: {
    time: {
      type: String,
      required: true
    },
    day: Number // Có thể khác ngày khởi hành cho chuyến bay dài
  },
  aircraft: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aircraft'
  },
  crew: {
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crew'
    },
    firstOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crew'
    },
    cabinCrew: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crew'
    }]
  }
});

const scheduleSchema = new mongoose.Schema({
  // Thông tin cơ bản
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  name: {
    type: String,
    required: true
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

  // Loại lịch trình
  type: {
    type: String,
    enum: ['regular', 'seasonal', 'charter', 'special'],
    default: 'regular'
  },

  // Thời gian hiệu lực
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      required: true
    }
  },

  // Tần suất hoạt động
  frequency: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly', 'seasonal'],
      required: true
    },
    
    // Các ngày trong tuần hoạt động
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6,
      required: true
    }],
    
    // Số lần bay mỗi ngày
    dailyFrequency: {
      type: Number,
      default: 1,
      min: 1
    },

    // Thông tin mùa vụ
    seasonal: {
      isActive: {
        type: Boolean,
        default: false
      },
      seasons: [{
        name: {
          type: String,
          enum: ['spring', 'summer', 'autumn', 'winter', 'peak', 'off_peak']
        },
        startMonth: Number,
        endMonth: Number,
        frequency: Number
      }]
    }
  },

  // Lịch trình chi tiết
  flights: [flightScheduleSchema],

  // Thông tin slot
  slots: {
    departure: {
      slotTime: String,
      coordinator: String,
      confirmed: {
        type: Boolean,
        default: false
      }
    },
    arrival: {
      slotTime: String,
      coordinator: String,
      confirmed: {
        type: Boolean,
        default: false
      }
    }
  },

  // Thông tin tài nguyên
  resources: {
    // Yêu cầu về máy bay
    aircraft: {
      required: [{
        type: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Aircraft'
        },
        count: Number,
        preference: String
      }],
      
      utilization: {
        hoursPerDay: Number,
        rotationsPerDay: Number,
        turnaroundTime: Number // phút
      }
    },

    // Yêu cầu về phi hành đoàn
    crew: {
      required: {
        captains: Number,
        firstOfficers: Number,
        cabinCrew: Number
      },
      
      qualifications: [String],
      
      scheduling: {
        dutyPattern: String,
        maxDutyHours: Number,
        restRequirements: Number
      }
    },

    // Yêu cầu về cơ sở hạ tầng
    infrastructure: {
      gates: {
        departure: [String],
        arrival: [String]
      },
      
      ground: {
        handling: String,
        catering: Boolean,
        fueling: Boolean,
        maintenance: Boolean
      }
    }
  },

  // Thông tin vận hành
  operational: {
    status: {
      type: String,
      enum: ['active', 'suspended', 'cancelled', 'pending_approval'],
      default: 'pending_approval'
    },

    // Thông tin hiệu suất
    performance: {
      punctuality: {
        target: Number, // percentage
        actual: Number
      },
      
      reliability: {
        target: Number,
        actual: Number
      },
      
      loadFactor: {
        target: Number,
        actual: Number
      }
    },

    // Thông tin về độ trễ và hủy chuyến
    disruptions: {
      delays: {
        count: Number,
        averageMinutes: Number,
        reasons: [{
          reason: String,
          count: Number
        }]
      },
      
      cancellations: {
        count: Number,
        percentage: Number,
        reasons: [{
          reason: String,
          count: Number
        }]
      }
    }
  },

  // Thông tin thương mại
  commercial: {
    // Pricing strategy
    pricing: {
      strategy: {
        type: String,
        enum: ['fixed', 'dynamic', 'seasonal', 'demand_based']
      },
      
      baseFare: {
        economy: Number,
        business: Number
      },
      
      yieldManagement: {
        enabled: Boolean,
        algorithm: String
      }
    },

    // Market information
    market: {
      segment: {
        type: String,
        enum: ['business', 'leisure', 'mixed']
      },
      
      competition: {
        level: {
          type: String,
          enum: ['low', 'medium', 'high']
        },
        competitors: [String]
      },
      
      demand: {
        elasticity: Number,
        seasonality: Boolean,
        peakPeriods: [String]
      }
    }
  },

  // Thông tin quy định
  regulations: {
    approvals: [{
      authority: String,
      type: String,
      number: String,
      issuedDate: Date,
      expiryDate: Date,
      status: {
        type: String,
        enum: ['valid', 'expired', 'pending', 'denied']
      }
    }],

    restrictions: [{
      type: String,
      description: String,
      effectiveFrom: Date,
      effectiveTo: Date
    }],

    compliance: {
      environmental: [String],
      noise: [String],
      security: [String]
    }
  },

  // Thông tin đặc biệt
  special: {
    // Chuyến bay liên minh
    codeshare: [{
      partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline'
      },
      flightNumber: String,
      type: {
        type: String,
        enum: ['operated_by', 'marketed_by']
      }
    }],

    // Chuyến bay charter
    charter: {
      isCharter: {
        type: Boolean,
        default: false
      },
      client: String,
      purpose: String
    },

    // Dịch vụ đặc biệt
    services: {
      cargo: Boolean,
      mail: Boolean,
      medical: Boolean,
      vip: Boolean
    }
  },

  // Lịch sử thay đổi
  history: {
    changes: [{
      date: Date,
      type: String,
      description: String,
      changedBy: String,
      reason: String,
      previousValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],

    versions: [{
      version: String,
      effectiveFrom: Date,
      effectiveTo: Date,
      changes: [String]
    }]
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

    approvedBy: String,
    approvedDate: Date,
    
    nextReview: Date,
    
    tags: [String],
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tổng số chuyến bay mỗi tuần
scheduleSchema.virtual('weeklyFlights').get(function() {
  return this.frequency.daysOfWeek.length * this.frequency.dailyFrequency;
});

// Virtual cho thời gian hoạt động
scheduleSchema.virtual('operatingPeriod').get(function() {
  const start = new Date(this.validity.startDate);
  const end = new Date(this.validity.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual cho trạng thái hiện tại
scheduleSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  const start = new Date(this.validity.startDate);
  const end = new Date(this.validity.endDate);
  
  if (now < start) return 'future';
  if (now > end) return 'expired';
  return 'active';
});

// Index cho tìm kiếm hiệu quả
scheduleSchema.index({ code: 1 });
scheduleSchema.index({ route: 1 });
scheduleSchema.index({ airline: 1 });
scheduleSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });
scheduleSchema.index({ 'frequency.daysOfWeek': 1 });
scheduleSchema.index({ 'operational.status': 1 });
scheduleSchema.index({ type: 1 });

// Compound index cho tìm kiếm lịch trình
scheduleSchema.index({
  route: 1,
  'frequency.daysOfWeek': 1,
  'validity.startDate': 1,
  'validity.endDate': 1
});

// Pre-save middleware
scheduleSchema.pre('save', function(next) {
  this.metadata.lastUpdated.date = new Date();
  
  // Validate flight schedules
  if (this.flights && this.flights.length > 0) {
    this.flights.forEach(flight => {
      if (!this.frequency.daysOfWeek.includes(flight.departure.day)) {
        throw new Error(`Flight ${flight.flightNumber} departure day not in operating days`);
      }
    });
  }
  
  next();
});

// Method tạo flight instances từ schedule
scheduleSchema.methods.generateFlightInstances = function(startDate, endDate) {
  const flights = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    if (this.frequency.daysOfWeek.includes(dayOfWeek)) {
      this.flights.forEach(flightSchedule => {
        flights.push({
          flightNumber: flightSchedule.flightNumber,
          date: new Date(date),
          departureTime: flightSchedule.departure.time,
          arrivalTime: flightSchedule.arrival.time,
          aircraft: flightSchedule.aircraft,
          crew: flightSchedule.crew
        });
      });
    }
  }
  
  return flights;
};

module.exports = mongoose.model('Schedule', scheduleSchema);