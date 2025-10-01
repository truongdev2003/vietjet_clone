const mongoose = require('mongoose');

// Schema cho terminal
const terminalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  gates: [{
    number: String,
    type: {
      type: String,
      enum: ['domestic', 'international']
    },
    aircraftCapacity: String,
    facilities: [String]
  }],
  facilities: {
    restaurants: [String],
    shops: [String],
    lounges: [String],
    services: [String]
  },
  checkInCounters: {
    economy: [String],
    business: [String],
    online: [String]
  }
});

const airportSchema = new mongoose.Schema({
  // Mã sân bay
  code: {
    iata: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3
    },
    icao: {
      type: String,
      uppercase: true,
      minlength: 4,
      maxlength: 4
    }
  },

  // Thông tin cơ bản
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

  // Vị trí địa lý
  location: {
    city: {
      vi: {
        type: String,
        required: true
      },
      en: {
        type: String,
        required: true
      }
    },
    province: {
      vi: String,
      en: String
    },
    country: {
      vi: {
        type: String,
        required: true
      },
      en: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true,
        uppercase: true,
        minlength: 2,
        maxlength: 2
      }
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    elevation: Number // mét so với mực nước biển
  },

  // Thông tin vận hành
  operational: {
    timezone: {
      type: String,
      required: true
    },
    operatingHours: {
      domestic: {
        open: String,
        close: String
      },
      international: {
        open: String,
        close: String
      }
    },
    runways: [{
      name: String,
      length: Number, // mét
      width: Number,  // mét
      surface: String,
      heading: String
    }],
    capacity: {
      peakHourly: Number,
      dailyMax: Number
    }
  },

  // Cơ sở hạ tầng
  infrastructure: {
    terminals: [terminalSchema],
    parkingSpaces: {
      shortTerm: Number,
      longTerm: Number,
      premium: Number
    },
    transportation: {
      bus: Boolean,
      taxi: Boolean,
      metro: Boolean,
      train: Boolean,
      shuttle: Boolean
    }
  },

  // Dịch vụ và tiện ích
  services: {
    checkinServices: {
      online: Boolean,
      kiosk: Boolean,
      counter: Boolean,
      curbside: Boolean
    },
    baggageServices: {
      storage: Boolean,
      wrapping: Boolean,
      delivery: Boolean
    },
    passengerServices: {
      wifi: Boolean,
      chargingStations: Boolean,
      nursery: Boolean,
      prayerRoom: Boolean,
      medicalCenter: Boolean,
      lostAndFound: Boolean
    },
    specialServices: {
      vipLounge: Boolean,
      meetAndGreet: Boolean,
      wheelchairAssist: Boolean,
      unaccompaniedMinor: Boolean
    }
  },

  // Thông tin cho VietJet
  vietjetInfo: {
    isHub: {
      type: Boolean,
      default: false
    },
    isFocus: {
      type: Boolean,
      default: false
    },
    checkInCounters: [String],
    gates: [String],
    loungeAccess: Boolean,
    groundHandling: String, // Nhà cung cấp dịch vụ mặt đất
    fuelProvider: String
  },

  // Thông tin thương mại
  commercial: {
    passengerTraffic: {
      annual: Number,
      domestic: Number,
      international: Number
    },
    popularDestinations: [{
      airport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport'
      },
      frequency: Number
    }],
    seasonality: {
      peakMonths: [Number],
      lowMonths: [Number]
    }
  },

  // Thông tin liên lạc
  contact: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String
    }
  },

  // Trạng thái và metadata
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    isOperational: {
      type: Boolean,
      default: true
    },
    restrictions: [String],
    notes: String
  },

  // Thông tin cập nhật
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tên đầy đủ
airportSchema.virtual('fullName').get(function() {
  return `${this.name.vi} (${this.code.iata})`;
});

// Virtual cho tổng số gates
airportSchema.virtual('totalGates').get(function() {
  return this.infrastructure.terminals.reduce((total, terminal) => {
    return total + (terminal.gates ? terminal.gates.length : 0);
  }, 0);
});

// Index cho tìm kiếm hiệu quả
airportSchema.index({ 'code.icao': 1 });
airportSchema.index({ 'location.city.vi': 1 });
airportSchema.index({ 'location.city.en': 1 });
airportSchema.index({ 'location.country.code': 1 });
airportSchema.index({ 'status.isActive': 1, 'status.isOperational': 1 });
airportSchema.index({ 'vietjetInfo.isHub': 1 });
airportSchema.index({ 'location.coordinates': '2dsphere' });

// Text index cho tìm kiếm
airportSchema.index({
  'name.vi': 'text',
  'name.en': 'text',
  'location.city.vi': 'text',
  'location.city.en': 'text',
  'code.iata': 'text'
});

module.exports = mongoose.model('Airport', airportSchema);