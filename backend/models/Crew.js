const mongoose = require('mongoose');

// Schema cho chứng chỉ và bằng cấp
const certificateSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  issuedDate: Date,
  expiryDate: Date,
  issuedBy: String,
  status: {
    type: String,
    enum: ['valid', 'expired', 'suspended', 'revoked'],
    default: 'valid'
  }
});

// Schema cho training records
const trainingSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true
  },
  provider: String,
  startDate: Date,
  completionDate: Date,
  result: {
    type: String,
    enum: ['pass', 'fail', 'in_progress']
  },
  score: Number,
  validUntil: Date,
  instructor: String,
  location: String,
  notes: String
});

// Schema cho flight hours
const flightHoursSchema = new mongoose.Schema({
  aircraftType: String,
  role: {
    type: String,
    enum: ['pic', 'sic', 'instructor', 'examiner']
  },
  totalHours: {
    type: Number,
    default: 0
  },
  last30Days: {
    type: Number,
    default: 0
  },
  last90Days: {
    type: Number,
    default: 0
  },
  lastYear: {
    type: Number,
    default: 0
  },
  nightHours: {
    type: Number,
    default: 0
  },
  instrumentHours: {
    type: Number,
    default: 0
  }
});

const crewSchema = new mongoose.Schema({
  // Thông tin cá nhân
  personalInfo: {
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      enum: ['Mr', 'Ms', 'Mrs', 'Dr', 'Capt']
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
      required: true
    },
    homeBase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: true
    }
  },

  // Thông tin liên lạc
  contactInfo: {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    address: {
      street: String,
      city: String,
      province: String,
      country: String,
      zipCode: String
    }
  },

  // Thông tin nghề nghiệp
  position: {
    role: {
      type: String,
      enum: ['captain', 'first_officer', 'flight_engineer', 'cabin_crew_chief', 'cabin_crew', 'instructor', 'check_pilot'],
      required: true
    },
    rank: {
      type: String,
      enum: ['trainee', 'junior', 'senior', 'lead', 'supervisor', 'manager']
    },
    department: String,
    hireDate: {
      type: Date,
      required: true
    },
    probationEndDate: Date,
    seniority: Number
  },

  // Thông tin hàng không
  aviation: {
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    licenseType: {
      type: String,
      enum: ['ATPL', 'CPL', 'MPL', 'PPL', 'cabin_crew'],
      required: true
    },
    medicalCertificate: {
      class: {
        type: String,
        enum: ['class_1', 'class_2', 'cabin_crew']
      },
      expiryDate: Date,
      restrictions: [String]
    },
    
    // Aircraft qualifications
    qualifications: [{
      aircraftType: {
        type: String,
        required: true
      },
      rating: {
        type: String,
        enum: ['type_rating', 'class_rating', 'instructor', 'examiner']
      },
      issuedDate: Date,
      expiryDate: Date,
      recurrent: Date,
      status: {
        type: String,
        enum: ['current', 'expired', 'lapsed'],
        default: 'current'
      }
    }],

    // Flight experience
    experience: {
      totalFlightHours: {
        type: Number,
        default: 0
      },
      flightHoursByType: [flightHoursSchema],
      totalLandings: {
        type: Number,
        default: 0
      },
      recentExperience: {
        last30Days: {
          hours: Number,
          landings: Number
        },
        last90Days: {
          hours: Number,
          landings: Number
        }
      }
    }
  },

  // Chứng chỉ và training
  certifications: [certificateSchema],
  
  training: {
    records: [trainingSchema],
    required: [{
      course: String,
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      }
    }],
    lastRecurrent: Date,
    nextRecurrent: Date
  },

  // Thông tin lịch làm việc
  scheduling: {
    status: {
      type: String,
      enum: ['available', 'on_duty', 'off_duty', 'sick', 'vacation', 'training', 'reserve'],
      default: 'available'
    },
    
    availability: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'reserve'],
      default: 'full_time'
    },

    restrictions: [{
      type: {
        type: String,
        enum: ['medical', 'training', 'disciplinary', 'personal']
      },
      description: String,
      startDate: Date,
      endDate: Date,
      severity: {
        type: String,
        enum: ['grounded', 'limited', 'supervised']
      }
    }],

    preferences: {
      preferredRoutes: [String],
      avoidRoutes: [String],
      maxDutyHours: Number,
      daysOff: [Number] // 0-6, Sunday-Saturday
    },

    // Flight time limitations
    limitations: {
      daily: {
        flightTime: Number,
        dutyTime: Number
      },
      weekly: {
        flightTime: Number,
        dutyTime: Number
      },
      monthly: {
        flightTime: Number,
        dutyTime: Number
      },
      yearly: {
        flightTime: Number,
        dutyTime: Number
      }
    }
  },

  // Hiệu suất và đánh giá
  performance: {
    ratings: [{
      period: String,
      category: String,
      score: Number,
      evaluator: String,
      date: Date,
      comments: String
    }],
    
    incidents: [{
      date: Date,
      type: String,
      severity: String,
      description: String,
      outcome: String,
      status: {
        type: String,
        enum: ['open', 'closed', 'under_investigation']
      }
    }],

    commendations: [{
      date: Date,
      type: String,
      description: String,
      awardedBy: String
    }]
  },

  // Thông tin sức khỏe
  medical: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    restrictions: [String],
    lastExam: Date,
    nextExam: Date,
    fitnessForDuty: {
      type: Boolean,
      default: true
    }
  },

  // Thông tin bảo mật
  security: {
    backgroundCheck: {
      completed: Boolean,
      date: Date,
      level: String,
      expiryDate: Date
    },
    airportId: {
      number: String,
      expiryDate: Date
    },
    securityTraining: {
      completed: Boolean,
      date: Date,
      expiryDate: Date
    }
  },

  // Thông tin tài chính
  employment: {
    salary: {
      base: Number,
      hourly: Number,
      currency: {
        type: String,
        default: 'VND'
      }
    },
    benefits: [String],
    vacationDays: {
      total: Number,
      used: Number,
      remaining: Number
    },
    contract: {
      type: {
        type: String,
        enum: ['permanent', 'fixed_term', 'probation']
      },
      startDate: Date,
      endDate: Date
    }
  },

  // Trạng thái
  status: {
    employment: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'retired'],
      default: 'active'
    },
    operational: {
      type: String,
      enum: ['qualified', 'training', 'grounded', 'medical_hold'],
      default: 'qualified'
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
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tên đầy đủ
crewSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.title || ''} ${this.personalInfo.firstName} ${this.personalInfo.lastName}`.trim();
});

// Virtual cho tuổi
crewSchema.virtual('age').get(function() {
  if (!this.personalInfo.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual cho thời gian làm việc
crewSchema.virtual('serviceYears').get(function() {
  if (!this.position.hireDate) return 0;
  const today = new Date();
  const hireDate = new Date(this.position.hireDate);
  return Math.floor((today - hireDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual cho trạng thái qualification
crewSchema.virtual('isQualified').get(function() {
  const now = new Date();
  
  // Check medical certificate
  if (this.aviation.medicalCertificate.expiryDate && 
      new Date(this.aviation.medicalCertificate.expiryDate) <= now) {
    return false;
  }
  
  // Check if any required qualifications are expired
  const hasExpiredQualifications = this.aviation.qualifications.some(qual => {
    return qual.expiryDate && new Date(qual.expiryDate) <= now;
  });
  
  return !hasExpiredQualifications && this.status.operational === 'qualified';
});

// Index cho tìm kiếm
crewSchema.index({ 'personalInfo.employeeId': 1 });
crewSchema.index({ 'aviation.licenseNumber': 1 });
crewSchema.index({ 'position.role': 1 });
crewSchema.index({ 'personalInfo.homeBase': 1 });
crewSchema.index({ 'scheduling.status': 1 });
crewSchema.index({ 'status.employment': 1, 'status.operational': 1 });
crewSchema.index({ 'aviation.qualifications.aircraftType': 1 });

// Text index cho tìm kiếm
crewSchema.index({
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'personalInfo.employeeId': 'text',
  'aviation.licenseNumber': 'text'
});

// Pre-save middleware
crewSchema.pre('save', function(next) {
  this.metadata.lastUpdated.date = new Date();
  next();
});

// Method cập nhật flight hours
crewSchema.methods.updateFlightHours = function(aircraftType, hours, role = 'pic') {
  let typeHours = this.aviation.experience.flightHoursByType.find(
    fh => fh.aircraftType === aircraftType && fh.role === role
  );
  
  if (!typeHours) {
    typeHours = {
      aircraftType,
      role,
      totalHours: 0,
      last30Days: 0,
      last90Days: 0,
      lastYear: 0
    };
    this.aviation.experience.flightHoursByType.push(typeHours);
  }
  
  typeHours.totalHours += hours;
  this.aviation.experience.totalFlightHours += hours;
  
  return this.save();
};

module.exports = mongoose.model('Crew', crewSchema);