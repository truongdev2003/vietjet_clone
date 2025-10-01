const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
  // Thông tin cơ bản
  code: {
    iata: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2
    },
    icao: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3
    },
    numeric: {
      type: String,
      unique: true,
      minlength: 3,
      maxlength: 3
    }
  },

  // Tên hãng hàng không
  name: {
    full: {
      vi: {
        type: String,
        required: true
      },
      en: {
        type: String,
        required: true
      }
    },
    short: {
      vi: String,
      en: String
    },
    brand: String
  },

  // Thông tin công ty
  company: {
    legalName: String,
    headquarter: {
      address: String,
      city: String,
      country: String
    },
    founded: Date,
    ceo: String,
    employees: Number,
    website: String,
    contact: {
      phone: String,
      email: String,
      customerService: {
        hotline: String,
        email: String,
        hours: String
      }
    }
  },

  // Thông tin vận hành
  operational: {
    homeBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport'
    },
    hubs: [{
      airport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
      },
      type: {
        type: String,
        enum: ['primary', 'secondary', 'focus']
      }
    }],
    destinations: {
      domestic: Number,
      international: Number,
      total: Number
    },
    fleet: {
      total: Number,
      aircraftTypes: [{
        model: String,
        count: Number,
        averageAge: Number
      }]
    }
  },

  // Chính sách và quy định
  policies: {
    baggage: {
      carryOn: {
        weight: Number,
        dimensions: {
          length: Number,
          width: Number,
          height: Number
        },
        pieces: Number
      },
      checked: [{
        class: {
          type: String,
          enum: ['economy', 'premium_economy', 'business', 'first']
        },
        weight: Number,
        pieces: Number,
        fee: Number
      }],
      excess: {
        weightFee: Number, // VND per kg
        sizeFee: Number
      }
    },
    
    checkin: {
      online: {
        opens: Number, // hours before departure
        closes: Number
      },
      airport: {
        opens: Number,
        closes: Number
      },
      requirements: [String]
    },

    cancellation: {
      refundable: {
        fee: Number,
        timeLimit: Number // hours before departure
      },
      nonRefundable: {
        changeFee: Number,
        timeLimit: Number
      }
    },

    child: {
      infantAge: Number, // months
      childAge: Number,  // years
      unaccompaniedMinor: {
        minAge: Number,
        maxAge: Number,
        fee: Number
      }
    }
  },

  // Chương trình khách hàng thân thiết
  loyaltyProgram: {
    name: String,
    tiers: [{
      name: String,
      requirements: {
        flights: Number,
        miles: Number,
        spending: Number
      },
      benefits: [String],
      multiplier: Number
    }],
    pointsExpiry: Number, // months
    redemptionOptions: [String]
  },

  // Dịch vụ
  services: {
    classes: [{
      name: {
        type: String,
        enum: ['economy', 'premium_economy', 'business', 'first']
      },
      features: [String],
      amenities: [String]
    }],
    
    meals: {
      complimentary: {
        domestic: Boolean,
        international: Boolean
      },
      special: [String],
      purchase: Boolean
    },

    entertainment: {
      ife: Boolean, // In-flight entertainment
      wifi: {
        available: Boolean,
        pricing: String
      },
      magazines: Boolean,
      music: Boolean
    },

    ground: {
      lounges: [{
        airport: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Airport'
        },
        name: String,
        access: [String]
      }],
      fastTrack: Boolean,
      valet: Boolean
    }
  },

  // Thông tin tài chính
  financial: {
    revenue: {
      annual: Number,
      currency: String
    },
    marketShare: {
      domestic: Number,
      international: Number
    },
    stockSymbol: String
  },

  // Giải thưởng và chứng nhận
  certifications: {
    safety: [{
      organization: String,
      rating: String,
      validUntil: Date
    }],
    quality: [{
      award: String,
      year: Number,
      organization: String
    }],
    environmental: [String]
  },

  // Liên minh và đối tác
  partnerships: {
    alliance: String,
    codeshare: [{
      airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline'
      },
      routes: [String]
    }],
    interline: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airline'
    }]
  },

  // Brand và marketing
  branding: {
    logo: {
      primary: String,
      variations: [String]
    },
    colors: {
      primary: String,
      secondary: String,
      accent: String
    },
    livery: {
      standard: String,
      special: [String]
    },
    slogan: {
      vi: String,
      en: String
    }
  },

  // Trạng thái
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    operatingStatus: {
      type: String,
      enum: ['operational', 'suspended', 'ceased', 'merged'],
      default: 'operational'
    },
    licenseStatus: {
      type: String,
      enum: ['valid', 'suspended', 'revoked'],
      default: 'valid'
    },
    licenseExpiry: Date
  },

  // Metadata
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: String,
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

// Virtual cho tên hiển thị
airlineSchema.virtual('displayName').get(function() {
  return `${this.name.full.vi} (${this.code.iata})`;
});

// Virtual cho tổng số điểm đến
airlineSchema.virtual('totalDestinations').get(function() {
  return this.operational.destinations.domestic + this.operational.destinations.international;
});

// Index cho tìm kiếm
airlineSchema.index({ 'name.full.vi': 1 });
airlineSchema.index({ 'name.full.en': 1 });
airlineSchema.index({ 'status.isActive': 1, 'status.operatingStatus': 1 });

// Text index cho tìm kiếm
airlineSchema.index({
  'name.full.vi': 'text',
  'name.full.en': 'text',
  'name.short.vi': 'text',
  'name.short.en': 'text',
  'code.iata': 'text',
  'code.icao': 'text'
});

module.exports = mongoose.model('Airline', airlineSchema);