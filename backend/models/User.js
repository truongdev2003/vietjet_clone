const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Thông tin cá nhân
  personalInfo: {
    title: {
      type: String,
      enum: ['Mr', 'Ms', 'Mrs', 'Dr'],
      required: function() {
        return !this.isGuest; // Không bắt buộc với guest
      }
    },
    firstName: {
      type: String,
      required: function() {
        return !this.isGuest; // Không bắt buộc với guest
      },
      trim: true
    },
    lastName: {
      type: String,
      required: function() {
        return !this.isGuest; // Không bắt buộc với guest
      },
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: function() {
        return !this.isGuest; // Không bắt buộc với guest
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: function() {
        return !this.isGuest; // Không bắt buộc với guest
      }
    },
    nationality: {
      type: String,
      required: true,
      default: 'Vietnam'
    },
    avatar: {
      type: String // filename of avatar image
    },
    avatarThumbnails: {
      small: String,
      medium: String,
      large: String
    }
  },

  // Thông tin liên lạc
  contactInfo: {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
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

  // Thông tin tài khoản
  account: {
    password: {
      type: String,
      required: function() {
        return !this.isGuest; // Password chỉ bắt buộc nếu không phải guest
      },
      minlength: 6
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },

  // Two-Factor Authentication
  twoFactorAuth: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    secret: String, // Base32 encoded secret
    tempSecret: String, // Temporary secret during setup
    backupCodes: [{
      code: String, // Hashed backup code
      used: {
        type: Boolean,
        default: false
      },
      usedAt: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    enabledAt: Date,
    disabledAt: Date,
    createdAt: Date
  },

  // Thông tin guest
  isGuest: {
    type: Boolean,
    default: false
  },
  guestInfo: {
    bookingReference: String, // Để guest có thể tra cứu booking
    temporaryToken: String,   // Token tạm thời cho guest
    tokenExpires: Date,       // Hết hạn token
    createdBookings: [{       // Danh sách booking của guest
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }]
  },

  // Thông tin hành khách thường xuyên
  frequentFlyerInfo: {
    membershipNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    membershipLevel: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    totalMiles: {
      type: Number,
      default: 0
    },
    totalFlights: {
      type: Number,
      default: 0
    }
  },

  // Thông tin giấy tờ tùy thân
  documents: [{
    type: {
      type: String,
      enum: ['passport', 'national_id', 'driver_license'],
      required: true
    },
    number: {
      type: String,
      required: true
    },
    issuedDate: Date,
    expiryDate: {
      type: Date,
      required: true
    },
    issuedBy: String,
    issuedCountry: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    filePath: String, // filename of uploaded document
    fileOriginalName: String,
    fileSize: Number,
    uploadedAt: Date
  }],

  // Tùy chọn cá nhân
  preferences: {
    language: {
      type: String,
      default: 'vi',
      enum: ['vi', 'en', 'zh', 'ja', 'ko']
    },
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR', 'JPY']
    },
    seatPreference: {
      type: String,
      enum: ['window', 'aisle', 'middle', 'no_preference'],
      default: 'no_preference'
    },
    mealPreference: {
      type: String,
      enum: ['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'no_meal'],
      default: 'normal'
    },
    specialAssistance: {
      type: [String],
      default: []
    },
    marketingConsent: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      phone: {
        type: Boolean,
        default: false
      }
    }
  },

  // Thông tin trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },

  // Metadata
  metadata: {
    registrationSource: {
      type: String,
      enum: ['web', 'mobile', 'agent', 'partner'],
      default: 'web'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho tên đầy đủ
userSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.title} ${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual cho số booking
userSchema.virtual('bookingCount', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user',
  count: true
});

// Middleware mã hóa password trước khi save
userSchema.pre('save', async function(next) {
  // Chỉ mã hóa password nếu không phải guest và password được modified
  if (!this.isModified('account.password') || this.isGuest) return next();
  
  this.account.password = await bcrypt.hash(this.account.password, 12);
  next();
});

// Static method tạo guest user
userSchema.statics.createGuestUser = async function(contactInfo) {
  const guestUser = new this({
    contactInfo: {
      email: contactInfo.email,
      phone: contactInfo.phone,
      address: contactInfo.address || {}
    },
    isGuest: true,
    guestInfo: {
      temporaryToken: crypto.randomBytes(32).toString('hex'),
      tokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBookings: []
    },
    personalInfo: {
      nationality: 'Vietnam'
    },
    account: {
      isEmailVerified: false,
      loginAttempts: 0
    },
    status: 'active',
    metadata: {
      registrationSource: 'web',
      profileCompleteness: 20 // Guest có ít thông tin hơn
    }
  });

  return await guestUser.save();
};

// Method kiểm tra guest token
userSchema.methods.isValidGuestToken = function(token) {
  return this.isGuest && 
         this.guestInfo.temporaryToken === token && 
         this.guestInfo.tokenExpires > Date.now();
};

// Middleware cập nhật lastUpdated
userSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

// Method kiểm tra password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.account.password);
};

// Method tạo password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.account.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.account.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method kiểm tra account bị khóa
userSchema.virtual('isLocked').get(function() {
  return !!(this.account.lockUntil && this.account.lockUntil > Date.now());
});

// Method tăng login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.account.lockUntil && this.account.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        'account.loginAttempts': 1,
        'account.lockUntil': 1
      }
    });
  }
  
  const updates = { $inc: { 'account.loginAttempts': 1 } };
  
  if (this.account.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      'account.lockUntil': Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Index cho tìm kiếm
userSchema.index({ 'contactInfo.phone': 1 });
userSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
userSchema.index({ 'guestInfo.temporaryToken': 1 });
userSchema.index({ 'guestInfo.bookingReference': 1 });
userSchema.index({ isGuest: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);