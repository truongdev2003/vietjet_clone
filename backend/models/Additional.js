const mongoose = require('mongoose');

// Model cho lịch sử tìm kiếm
const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: String,
  ipAddress: String,
  
  // Thông tin tìm kiếm
  searchParams: {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    returnDate: Date,
    passengers: {
      adults: {
        type: Number,
        default: 1
      },
      children: {
        type: Number,
        default: 0
      },
      infants: {
        type: Number,
        default: 0
      }
    },
    seatClass: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      default: 'economy'
    },
    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'multi_city'],
      default: 'one_way'
    }
  },
  
  // Kết quả tìm kiếm
  results: {
    totalFlights: Number,
    searchTime: Number, // milliseconds
    filters: {
      priceRange: {
        min: Number,
        max: Number
      },
      timeRange: {
        departure: {
          from: String,
          to: String
        },
        arrival: {
          from: String,
          to: String
        }
      },
      airlines: [String],
      stops: String
    }
  },
  
  // Hành vi người dùng
  userBehavior: {
    clickedFlights: [{
      flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight'
      },
      clickedAt: {
        type: Date,
        default: Date.now
      },
      position: Number // Vị trí trong kết quả tìm kiếm
    }],
    timeSpent: Number, // seconds
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    converted: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Model cho thông báo
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Thông tin thông báo
  type: {
    type: String,
    enum: [
      'booking_confirmation',
      'payment_success',
      'check_in_reminder',
      'flight_reminder',
      'flight_delay',
      'flight_cancellation',
      'gate_change',
      'promotion',
      'loyalty_update',
      'general'
    ],
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  // Dữ liệu liên quan
  relatedData: {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight'
    },
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    }
  },
  
  // Kênh gửi
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      emailId: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      messageId: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      pushId: String
    },
    inApp: {
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date
    }
  },
  
  // Cài đặt
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  category: {
    type: String,
    enum: ['operational', 'marketing', 'service', 'alert'],
    default: 'operational'
  },
  
  // Lên lịch
  scheduledFor: Date,
  expiresAt: Date,
  
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'expired'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Model cho khuyến mãi
const promotionSchema = new mongoose.Schema({
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
  
  description: String,
  
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
    bookingDeadline: Date,
    travelPeriod: {
      from: Date,
      to: Date
    }
  },
  
  // Loại khuyến mãi
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'buy_one_get_one', 'upgrade', 'points_multiplier'],
    required: true
  },
  
  discountValue: {
    type: Number,
    required: true
  },
  
  maxDiscount: Number,
  minSpend: Number,
  
  // Điều kiện áp dụng
  conditions: {
    routes: [{
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
      },
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
      }
    }],
    seatClasses: [{
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first']
    }],
    userTypes: [{
      type: String,
      enum: ['new_user', 'existing_user', 'frequent_flyer', 'student', 'senior']
    }],
    minPassengers: Number,
    maxPassengers: Number,
    daysOfWeek: [Number],
    advanceBooking: {
      minDays: Number,
      maxDays: Number
    }
  },
  
  // Giới hạn sử dụng
  usage: {
    totalLimit: Number,
    perUserLimit: {
      type: Number,
      default: 1
    },
    currentUsage: {
      type: Number,
      default: 0
    }
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired', 'disabled'],
    default: 'draft'
  },
  
  // Thông tin tạo
  createdBy: String,
  approvedBy: String,
  approvedAt: Date
}, {
  timestamps: true
});

// Model cho báo cáo và thống kê
const analyticsSchema = new mongoose.Schema({
  // Thời gian báo cáo
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  
  date: {
    type: Date,
    required: true
  },
  
  // Dữ liệu booking
  bookings: {
    total: Number,
    confirmed: Number,
    cancelled: Number,
    revenue: Number,
    averageBookingValue: Number,
    conversionRate: Number
  },
  
  // Dữ liệu chuyến bay
  flights: {
    total: Number,
    onTime: Number,
    delayed: Number,
    cancelled: Number,
    averageLoadFactor: Number
  },
  
  // Dữ liệu người dùng
  users: {
    newRegistrations: Number,
    activeUsers: Number,
    returningUsers: Number
  },
  
  // Dữ liệu tìm kiếm
  searches: {
    total: Number,
    convertedToBooking: Number,
    averageSearchTime: Number,
    popularRoutes: [{
      route: String,
      count: Number
    }]
  },
  
  // Dữ liệu doanh thu
  revenue: {
    total: Number,
    byClass: {
      economy: Number,
      premiumEconomy: Number,
      business: Number,
      first: Number
    },
    byChannel: {
      website: Number,
      mobile: Number,
      agent: Number,
      partner: Number
    }
  }
}, {
  timestamps: true
});

// Indexes
searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ sessionId: 1 });
searchHistorySchema.index({ 'searchParams.from': 1, 'searchParams.to': 1 });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledFor: 1 });

promotionSchema.index({ code: 1 });
promotionSchema.index({ status: 1 });
promotionSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });

analyticsSchema.index({ period: 1, date: 1 });

module.exports = {
  SearchHistory: mongoose.model('SearchHistory', searchHistorySchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Promotion: mongoose.model('Promotion', promotionSchema),
  Analytics: mongoose.model('Analytics', analyticsSchema)
};