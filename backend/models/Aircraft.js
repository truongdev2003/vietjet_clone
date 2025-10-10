const mongoose = require('mongoose');

// Schema cho cấu hình ghế ngồi
const seatConfigurationSchema = new mongoose.Schema({
  class: {
    type: String,
    enum: ['economy', 'premium_economy', 'business', 'first'],
    required: true
  },
  rows: {
    type: Number,
    required: true
  },
  seatsPerRow: {
    type: Number,
    required: true
  },
  pitch: {
    type: Number, // inches
    required: true
  },
  width: {
    type: Number, // inches
    required: true
  },
  recline: {
    type: Number, // inches
    default: 0
  },
  features: [String] // flatbed, power, wifi, etc.
});

// Schema cho bảo trì
const maintenanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['A-check', 'B-check', 'C-check', 'D-check', 'line_maintenance', 'heavy_maintenance'],
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  location: String,
  duration: Number, // hours
  cost: Number,
  description: String,
  components: [String],
  technician: String,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'overdue'],
    default: 'scheduled'
  }
});

const aircraftSchema = new mongoose.Schema({
  // Thông tin đăng ký
  registration: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z]{1,2}-[A-Z0-9]{3,5}$/ // VD: VN-A123
  },

  // Thông tin máy bay
  aircraft: {
    manufacturer: {
      type: String,
      required: true,
      enum: ['Airbus', 'Boeing', 'ATR', 'Embraer', 'Bombardier']
    },
    model: {
      type: String,
      required: true
    },
    series: String,
    variant: String,
    msn: {
      type: String, // Manufacturer Serial Number
      required: true,
      unique: true
    }
  },

  // Thông tin sở hữu
  ownership: {
    airline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airline',
      required: true
    },
    owner: {
      type: String,
      enum: ['owned', 'leased', 'wet_lease', 'dry_lease']
    },
    lessor: String,
    leaseStartDate: Date,
    leaseEndDate: Date,
    purchaseDate: Date,
    purchasePrice: Number
  },

  // Thông tin kỹ thuật
  specifications: {
    engines: {
      type: String,
      required: true
    },
    engineCount: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    maxSeats: {
      type: Number,
      required: true
    },
    mtow: {
      type: Number, // Maximum Take-off Weight (kg)
      required: true
    },
    range: {
      type: Number, // nautical miles
      required: true
    },
    serviceSpeed: Number, // knots
    serviceCeiling: Number, // feet
    fuelCapacity: Number // liters
  },

  // Cấu hình ghế ngồi
  configuration: {
    layout: String, // VD: "3-3" cho A320
    totalSeats: {
      type: Number,
      required: true
    },
    classes: [seatConfigurationSchema],
    exitRows: [Number],
    galley: [String],
    lavatory: [String]
  },

  // Thông tin vận hành
  operational: {
    status: {
      type: String,
      enum: ['active', 'maintenance', 'grounded', 'retired', 'stored'],
      default: 'active'
    },
    baseAirport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport'
    },
    currentLocation: {
      airport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    utilization: {
      hoursPerDay: Number,
      cyclesPerDay: Number,
      utilizationRate: Number // percentage
    }
  },

  // Lịch sử và thống kê
  history: {
    firstFlight: Date,
    deliveryDate: Date,
    entryIntoService: Date,
    totalFlightHours: {
      type: Number,
      default: 0
    },
    totalCycles: {
      type: Number,
      default: 0
    },
    averageUtilization: Number,
    previousOperators: [String]
  },

  // Bảo trì
  maintenance: {
    nextDue: {
      hours: Number,
      cycles: Number,
      date: Date,
      type: String
    },
    lastCompleted: {
      type: Date
    },
    records: [maintenanceSchema],
    intervals: {
      A: Number, // hours
      B: Number,
      C: Number,
      D: Number
    }
  },

  // Thiết bị và hệ thống
  equipment: {
    avionics: {
      manufacturer: String,
      version: String,
      capabilities: [String]
    },
    ife: {
      available: {
        type: Boolean,
        default: false
      },
      system: String,
      screens: String
    },
    connectivity: {
      wifi: {
        available: {
          type: Boolean,
          default: false
        },
        provider: String,
        type: String
      },
      gsm: Boolean,
      satellite: Boolean
    },
    galley: {
      ovens: Number,
      chillers: Number,
      coffee: Boolean,
      water: Boolean
    }
  },

  // Chứng nhận và giấy phép
  certifications: {
    airworthiness: {
      certificate: String,
      issuedDate: Date,
      expiryDate: Date,
      authority: String
    },
    noise: {
      category: String,
      chapter: String
    },
    emissions: {
      category: String,
      co2: Number
    }
  },

  // Tài chính
  financial: {
    bookValue: Number,
    marketValue: Number,
    insuranceValue: Number,
    depreciationRate: Number,
    operatingCostPerHour: Number,
    maintenanceCostPerHour: Number
  },

  // Thông tin an toàn
  safety: {
    incidents: [{
      date: Date,
      type: String,
      severity: String,
      description: String,
      resolved: Boolean
    }],
    inspections: [{
      date: Date,
      type: String,
      result: String,
      inspector: String
    }],
    modifications: [{
      date: Date,
      type: String,
      description: String,
      authority: String
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
    dataSource: String,
    verified: {
      type: Boolean,
      default: false
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: false },  // Tạm thời disable virtuals
  toObject: { virtuals: false }
});

// Virtual cho tuổi máy bay
aircraftSchema.virtual('age').get(function() {
  if (!this.history?.deliveryDate) return null;
  const now = new Date();
  const delivered = new Date(this.history.deliveryDate);
  return Math.floor((now - delivered) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual cho tên đầy đủ
aircraftSchema.virtual('fullName').get(function() {
  const manufacturer = this.aircraft?.manufacturer || 'Unknown';
  const model = this.aircraft?.model || 'Unknown';
  return `${manufacturer} ${model} (${this.registration})`;
});

// Virtual cho trạng thái bảo trì
aircraftSchema.virtual('maintenanceStatus').get(function() {
  if (!this.maintenance?.nextDue?.date) return 'unknown';
  const now = new Date();
  const dueDate = new Date(this.maintenance.nextDue.date);
  const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'due_soon';
  if (daysUntilDue <= 30) return 'due_next_month';
  return 'current';
});

// Index cho tìm kiếm
aircraftSchema.index({ registration: 1 });
aircraftSchema.index({ 'ownership.airline': 1 });
aircraftSchema.index({ 'aircraft.manufacturer': 1, 'aircraft.model': 1 });
aircraftSchema.index({ 'operational.status': 1 });
aircraftSchema.index({ 'operational.baseAirport': 1 });
aircraftSchema.index({ 'maintenance.nextDue.date': 1 });

// Pre-save middleware
aircraftSchema.pre('save', function(next) {
  // Cập nhật lastUpdated
  this.metadata.lastUpdated.date = new Date();
  
  // Tính tổng số ghế từ cấu hình các hạng
  if (this.configuration.classes && this.configuration.classes.length > 0) {
    const totalSeats = this.configuration.classes.reduce((total, cls) => {
      return total + (cls.rows * cls.seatsPerRow);
    }, 0);
    this.configuration.totalSeats = totalSeats;
  }
  
  next();
});

// Method cập nhật giờ bay và chu kỳ
aircraftSchema.methods.updateUtilization = function(hours, cycles) {
  this.history.totalFlightHours += hours;
  this.history.totalCycles += cycles;
  
  // Cập nhật maintenance due
  if (this.maintenance.intervals.A) {
    const hoursToA = this.maintenance.intervals.A - (this.history.totalFlightHours % this.maintenance.intervals.A);
    this.maintenance.nextDue.hours = hoursToA;
  }
  
  return this.save();
};

// Virtual fields để dễ truy cập
aircraftSchema.virtual('manufacturer').get(function() {
  return this.aircraft?.manufacturer;
});

aircraftSchema.virtual('model').get(function() {
  return this.aircraft?.model;
});

aircraftSchema.virtual('variant').get(function() {
  return this.aircraft?.variant;
});

// Ensure virtual fields are serialized
aircraftSchema.set('toJSON', { virtuals: true });
aircraftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Aircraft', aircraftSchema);