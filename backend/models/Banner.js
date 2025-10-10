const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề banner là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  image: {
    type: String,
    required: [true, 'Hình ảnh banner là bắt buộc']
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    default: 0,
    min: [0, 'Thứ tự không được nhỏ hơn 0']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index để tối ưu query
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Middleware để validate ngày
bannerSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  next();
});

// Static method để lấy banners đang active
bannerSchema.statics.getActiveBanners = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } }
    ]
  }).sort({ order: 1 });
};

// Instance method để tăng view count
bannerSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method để tăng click count
bannerSchema.methods.incrementClick = function() {
  this.clickCount += 1;
  return this.save();
};

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
