const mongoose = require('mongoose');

// Schema cho hành khách
const passengerSchema = new mongoose.Schema({
  // Thông tin cá nhân
  title: {
    type: String,
    enum: ['Mr', 'Ms', 'Mrs', 'Dr'],
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  nationality: {
    type: String,
    required: true,
    default: 'Vietnam'
  },

  // Thông tin giấy tờ
  document: {
    type: {
      type: String,
      enum: ['passport', 'national_id'],
      required: true,
      default: 'passport'
    },
    number: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    issuedCountry: {
      type: String,
      required: true
    }
  },

  // Thông tin chuyến bay
  ticket: {
    seatClass: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      required: true,
      default: 'economy'
    },
    seatNumber: {
      type: String,
      default: null
    },
    boardingGroup: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: 'C'
    },
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    eTicketNumber: {
      type: String,
      unique: true,
      sparse: true
    }
  },

  // Dịch vụ bổ sung
  services: {
    baggage: {
      checkedWeight: {
        type: Number,
        default: 20 // kg
      },
      additionalWeight: {
        type: Number,
        default: 0
      },
      handCarryWeight: {
        type: Number,
        default: 7
      }
    },
    meal: {
      type: {
        type: String,
        enum: ['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'child', 'no_meal'],
        default: 'normal'
      },
      specialRequest: String
    },
    seat: {
      preference: {
        type: String,
        enum: ['window', 'aisle', 'middle', 'front', 'exit_row'],
        default: 'window'
      },
      specialRequest: String
    },
    assistance: {
      type: [String],
      default: [],
      enum: ['wheelchair', 'blind', 'deaf', 'elderly', 'unaccompanied_minor', 'pregnant']
    }
  },

  // Thông tin check-in
  checkIn: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: String,
      enum: ['online', 'mobile', 'airport', 'agent'],
      default: 'online'
    },
    boardingPass: {
      barcodeData: String,
      qrCodeData: String,
      gate: String,
      boardingTime: Date,
      priority: Number
    }
  },

  // Metadata
  passengerType: {
    type: String,
    enum: ['adult', 'child', 'infant'],
    required: true,
    default: 'adult'
  },
  frequentFlyerNumber: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
});

// Schema chính cho booking
const bookingSchema = new mongoose.Schema({
  // Thông tin booking
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },
  
  // PNR (Passenger Name Record)
  pnr: {
    type: String,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },

  // Liên kết với user (nếu đăng ký tài khoản)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Thông tin chuyến bay
  flights: [{
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: true
    },
    type: {
      type: String,
      enum: ['outbound', 'return', 'connecting'],
      required: true
    },
    passengers: [passengerSchema] // Hành khách cho từng chuyến bay
  }],

  // Thông tin liên lạc chính
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: String,
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      province: String,
      country: {
        type: String,
        default: 'Vietnam'
      },
      zipCode: String
    }
  },

  // Thông tin thanh toán
  payment: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR']
    },
    breakdown: {
      baseFare: Number,
      taxes: Number,
      fees: Number,
      services: Number,
      discount: {
        type: Number,
        default: 0
      }
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash', 'points'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentGateway: String,
    paidAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundedAt: Date
  },

  // Trạng thái booking
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'no_show', 'completed'],
    default: 'confirmed'
  },

  // Thông tin hủy/thay đổi
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['customer', 'airline', 'agent', 'system']
    },
    reason: String,
    refundEligible: {
      type: Boolean,
      default: true
    },
    cancellationFee: {
      type: Number,
      default: 0
    }
  },

  // Thông tin thay đổi
  modifications: [{
    type: {
      type: String,
      enum: ['flight_change', 'passenger_change', 'service_change', 'upgrade']
    },
    originalData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    fee: Number,
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: String,
    reason: String
  }],

  // Thông tin đặc biệt
  specialRequests: [{
    type: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending'
    }
  }],

  // Thông tin đại lý/kênh bán
  bookingSource: {
    channel: {
      type: String,
      enum: ['website', 'mobile_app', 'call_center', 'travel_agent', 'partner', 'airport'],
      default: 'website'
    },
    agent: String,
    reference: String,
    commission: Number
  },

  // Thông tin bảo hiểm
  insurance: {
    isInsured: {
      type: Boolean,
      default: false
    },
    provider: String,
    policyNumber: String,
    coverage: [String],
    premium: Number
  },

  // Metadata và tracking
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    marketingSource: String,
    promoCode: String,
    loyaltyPointsUsed: {
      type: Number,
      default: 0
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0
    }
  },

  // Thông tin thông báo
  notifications: {
    bookingConfirmation: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    checkInReminder: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    flightReminder: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tổng số hành khách
bookingSchema.virtual('totalPassengers').get(function() {
  return this.flights.reduce((total, flight) => total + flight.passengers.length, 0);
});

// Virtual cho trạng thái có thể check-in
bookingSchema.virtual('canCheckIn').get(function() {
  if (this.status !== 'confirmed' || this.payment.status !== 'paid') return false;
  
  // Kiểm tra thời gian check-in (24h trước giờ bay)
  const now = new Date();
  const flightTime = this.flights[0]?.flight?.departure?.time;
  if (!flightTime) return false;
  
  const timeDiff = new Date(flightTime) - now;
  const hoursUntilFlight = timeDiff / (1000 * 60 * 60);
  
  return hoursUntilFlight <= 24 && hoursUntilFlight > 1;
});

// Pre-save middleware tạo mã booking và PNR
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = generateBookingReference();
  }
  if (!this.pnr) {
    this.pnr = generatePNR();
  }
  next();
});

// Pre-save middleware tính loyalty points
bookingSchema.pre('save', function(next) {
  if (this.payment.status === 'paid' && !this.metadata.loyaltyPointsEarned) {
    // Tính điểm dựa trên tổng tiền (1 điểm cho mỗi 1000 VND)
    this.metadata.loyaltyPointsEarned = Math.floor(this.payment.totalAmount / 1000);
  }
  next();
});

// Functions để tạo mã
function generateBookingReference() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'VJ';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePNR() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Indexes cho hiệu suất
bookingSchema.index({ user: 1 });
bookingSchema.index({ 'contactInfo.email': 1 });
bookingSchema.index({ 'contactInfo.phone': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'flights.flight': 1 });

module.exports = mongoose.model('Booking', bookingSchema);