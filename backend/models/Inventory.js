const mongoose = require('mongoose');

// Schema cho seat inventory
const seatInventorySchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: ['economy', 'premium_economy', 'business', 'first'],
    required: true
  },
  type: {
    type: String,
    enum: ['window', 'middle', 'aisle', 'exit_row', 'bulkhead']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'blocked', 'maintenance', 'reserved'],
    default: 'available'
  },
  price: {
    type: Number,
    default: 0 // Phí chọn ghế
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  features: [String],
  restrictions: [String]
});

// Schema cho booking class inventory
const bookingClassInventorySchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    maxlength: 1
  },
  name: String,
  category: {
    type: String,
    enum: ['economy', 'premium_economy', 'business', 'first']
  },
  authorized: {
    type: Number,
    required: true,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  available: {
    type: Number,
    default: function() {
      return this.authorized - this.sold;
    }
  },
  oversold: {
    type: Number,
    default: 0
  },
  waitlist: {
    type: Number,
    default: 0
  }
});

const inventorySchema = new mongoose.Schema({
  // Thông tin chuyến bay
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },

  // Ngày bay cụ thể
  departureDate: {
    type: Date,
    required: true
  },

  // Thông tin tuyến bay
  route: {
    origin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    }
  },

  // Thông tin máy bay
  aircraft: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aircraft',
    required: true
  },

  // Capacity tổng
  capacity: {
    total: {
      type: Number,
      required: true
    },
    byClass: {
      economy: {
        total: Number,
        available: Number,
        blocked: Number
      },
      premiumEconomy: {
        total: Number,
        available: Number,
        blocked: Number
      },
      business: {
        total: Number,
        available: Number,
        blocked: Number
      },
      first: {
        total: Number,
        available: Number,
        blocked: Number
      }
    }
  },

  // Booking class inventory (RBD)
  bookingClasses: [bookingClassInventorySchema],

  // Seat map và inventory
  seatMap: [seatInventorySchema],

  // Thông tin booking
  bookings: {
    confirmed: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    waitlist: {
      type: Number,
      default: 0
    },
    noShow: {
      type: Number,
      default: 0
    },
    cancelled: {
      type: Number,
      default: 0
    }
  },

  // Load factor và occupancy
  occupancy: {
    loadFactor: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    paxLoadFactor: Number,
    weightLoadFactor: Number,
    revenueLoadFactor: Number
  },

  // Revenue management
  revenueManagement: {
    strategy: {
      type: String,
      enum: ['aggressive', 'moderate', 'conservative'],
      default: 'moderate'
    },
    
    forecast: {
      demandForecast: Number,
      revenueForecast: Number,
      lastUpdated: Date
    },
    
    pricing: {
      currentStrategy: String,
      pricePoints: [{
        class: String,
        price: Number,
        availability: Number
      }],
      dynamicPricing: {
        enabled: Boolean,
        lastUpdate: Date,
        factors: [String]
      }
    },
    
    overbooking: {
      allowed: {
        type: Boolean,
        default: true
      },
      limit: {
        percentage: Number,
        absolute: Number
      },
      current: Number,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }
  },

  // Yield management
  yieldManagement: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    
    revenueByClass: {
      economy: Number,
      premiumEconomy: Number,
      business: Number,
      first: Number
    },
    
    averageFare: Number,
    
    yieldMetrics: {
      rasm: Number, // Revenue per Available Seat Mile
      prasm: Number, // Passenger Revenue per Available Seat Mile
      yield: Number, // Revenue per RPM
      revpax: Number // Revenue per Passenger
    }
  },

  // Group và block allocations
  allocations: [{
    type: {
      type: String,
      enum: ['group', 'corporate', 'charter', 'tour', 'crew', 'positioning']
    },
    reference: String,
    allocatedSeats: Number,
    usedSeats: {
      type: Number,
      default: 0
    },
    class: String,
    validUntil: Date,
    notes: String
  }],

  // Waitlist management
  waitlist: [{
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedClass: String,
    priority: {
      type: Number,
      default: 1
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'confirmed', 'cancelled', 'expired'],
      default: 'active'
    }
  }],

  // Upgrade management
  upgrades: {
    available: {
      fromEconomy: Number,
      fromPremiumEconomy: Number,
      fromBusiness: Number
    },
    
    policies: [{
      fromClass: String,
      toClass: String,
      price: Number,
      availability: Number,
      restrictions: [String]
    }],
    
    queue: [{
      passenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fromClass: String,
      toClass: String,
      bidAmount: Number,
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'declined'],
        default: 'pending'
      }
    }]
  },

  // Ancillary services inventory
  ancillaryServices: {
    meals: {
      available: Number,
      reserved: Number,
      types: [{
        type: String,
        available: Number,
        price: Number
      }]
    },
    
    baggage: {
      extraBaggage: {
        available: Boolean,
        slots: Number,
        price: Number
      }
    },
    
    seats: {
      premium: {
        available: Number,
        price: Number
      },
      extra: {
        available: Number,
        price: Number
      }
    }
  },

  // Operational constraints
  constraints: {
    weightRestrictions: {
      maxPayload: Number,
      currentWeight: Number,
      baggageWeight: Number,
      cargoWeight: Number
    },
    
    crewRequirements: {
      cockpitCrew: Number,
      cabinCrew: Number,
      assigned: Boolean
    },
    
    groundServices: {
      catering: {
        required: Boolean,
        confirmed: Boolean
      },
      fuel: {
        required: Number,
        confirmed: Boolean
      },
      handling: {
        confirmed: Boolean
      }
    }
  },

  // Status và controls
  status: {
    bookingStatus: {
      type: String,
      enum: ['open', 'closed', 'waitlist_only', 'suspended'],
      default: 'open'
    },
    
    inventoryStatus: {
      type: String,
      enum: ['active', 'frozen', 'closed', 'archived'],
      default: 'active'
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    autoUpdate: {
      type: Boolean,
      default: true
    }
  },

  // Audit trail
  auditTrail: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: String,
    user: String,
    changes: mongoose.Schema.Types.Mixed,
    reason: String
  }],

  // Metadata
  metadata: {
    created: {
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    },
    
    lastModified: {
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
    
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tổng số ghế đã bán
inventorySchema.virtual('totalSold').get(function() {
  return this.bookingClasses.reduce((total, bc) => total + bc.sold, 0);
});

// Virtual cho tổng số ghế còn trống
inventorySchema.virtual('totalAvailable').get(function() {
  return this.bookingClasses.reduce((total, bc) => total + bc.available, 0);
});

// Virtual cho tỷ lệ lấp đầy
inventorySchema.virtual('currentLoadFactor').get(function() {
  if (this.capacity.total === 0) return 0;
  return Math.round((this.totalSold / this.capacity.total) * 100);
});

// Virtual cho revenue per available seat
inventorySchema.virtual('revpar').get(function() {
  if (this.capacity.total === 0) return 0;
  return this.yieldManagement.totalRevenue / this.capacity.total;
});

// Virtual cho trạng thái overbooking
inventorySchema.virtual('isOverbooked').get(function() {
  return this.totalSold > this.capacity.total;
});

// Index cho tìm kiếm hiệu quả
inventorySchema.index({ flight: 1, departureDate: 1 }, { unique: true });
inventorySchema.index({ 'route.origin': 1, 'route.destination': 1, departureDate: 1 });
inventorySchema.index({ departureDate: 1 });
inventorySchema.index({ aircraft: 1 });
inventorySchema.index({ 'status.bookingStatus': 1 });
inventorySchema.index({ 'status.inventoryStatus': 1 });

// Compound index cho revenue management
inventorySchema.index({
  'route.origin': 1,
  'route.destination': 1,
  departureDate: 1,
  'status.bookingStatus': 1
});

// Pre-save middleware
inventorySchema.pre('save', function(next) {
  // Cập nhật available seats cho từng booking class
  this.bookingClasses.forEach(bc => {
    bc.available = Math.max(0, bc.authorized - bc.sold);
  });
  
  // Cập nhật load factor
  if (this.capacity.total > 0) {
    this.occupancy.loadFactor = Math.round((this.totalSold / this.capacity.total) * 100);
  }
  
  // Cập nhật average fare
  if (this.totalSold > 0) {
    this.yieldManagement.averageFare = this.yieldManagement.totalRevenue / this.totalSold;
  }
  
  // Cập nhật metadata
  this.metadata.lastModified.date = new Date();
  this.status.lastUpdated = new Date();
  
  next();
});

// Method để book seats
inventorySchema.methods.bookSeats = function(bookingClass, quantity, revenue = 0) {
  const bc = this.bookingClasses.find(c => c.class === bookingClass);
  if (!bc) {
    throw new Error(`Booking class ${bookingClass} not found`);
  }
  
  if (bc.available < quantity) {
    throw new Error(`Not enough seats available in class ${bookingClass}`);
  }
  
  bc.sold += quantity;
  bc.available = bc.authorized - bc.sold;
  this.bookings.confirmed += quantity;
  this.yieldManagement.totalRevenue += revenue;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'book_seats',
    changes: {
      bookingClass,
      quantity,
      revenue
    }
  });
  
  return this.save();
};

// Method để cancel seats
inventorySchema.methods.cancelSeats = function(bookingClass, quantity, revenue = 0) {
  const bc = this.bookingClasses.find(c => c.class === bookingClass);
  if (!bc) {
    throw new Error(`Booking class ${bookingClass} not found`);
  }
  
  bc.sold = Math.max(0, bc.sold - quantity);
  bc.available = bc.authorized - bc.sold;
  this.bookings.confirmed = Math.max(0, this.bookings.confirmed - quantity);
  this.bookings.cancelled += quantity;
  this.yieldManagement.totalRevenue = Math.max(0, this.yieldManagement.totalRevenue - revenue);
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'cancel_seats',
    changes: {
      bookingClass,
      quantity,
      revenue
    }
  });
  
  return this.save();
};

// Method để check availability
inventorySchema.methods.checkAvailability = function(bookingClass, quantity = 1) {
  const bc = this.bookingClasses.find(c => c.class === bookingClass);
  return bc ? bc.available >= quantity : false;
};

// Method để update pricing
inventorySchema.methods.updatePricing = function(pricePoints) {
  this.revenueManagement.pricing.pricePoints = pricePoints;
  this.revenueManagement.pricing.dynamicPricing.lastUpdate = new Date();
  
  this.auditTrail.push({
    action: 'update_pricing',
    changes: { pricePoints }
  });
  
  return this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);