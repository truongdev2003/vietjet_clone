const { body, param } = require('express-validator');
const AuthUtils = require('../utils/authUtils');

// Update profile validation
const validateUpdateProfile = [
  body('personalInfo.title')
    .optional()
    .isIn(['Mr', 'Ms', 'Mrs', 'Dr'])
    .withMessage('Danh xưng không hợp lệ'),
    
  body('personalInfo.firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
    
  body('personalInfo.lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ phải từ 2-50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Họ chỉ được chứa chữ cái và khoảng trắng'),
    
  body('personalInfo.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Ngày sinh không đúng định dạng')
    .custom((value) => {
      const age = AuthUtils.calculateAge(value);
      if (age < 18) {
        throw new Error('Bạn phải từ 18 tuổi trở lên');
      }
      if (age > 120) {
        throw new Error('Ngày sinh không hợp lệ');
      }
      return true;
    }),
    
  body('personalInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Giới tính không hợp lệ'),
    
  body('personalInfo.nationality')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Quốc tịch phải từ 2-50 ký tự'),
    
  body('preferences.language')
    .optional()
    .isIn(['vi', 'en', 'zh', 'ja', 'ko'])
    .withMessage('Ngôn ngữ không hợp lệ'),
    
  body('preferences.currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR', 'JPY'])
    .withMessage('Đơn vị tiền tệ không hợp lệ'),
    
  body('preferences.seatPreference')
    .optional()
    .isIn(['window', 'aisle', 'middle', 'no_preference'])
    .withMessage('Tùy chọn ghế ngồi không hợp lệ'),
    
  body('preferences.mealPreference')
    .optional()
    .isIn(['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'no_meal'])
    .withMessage('Tùy chọn suất ăn không hợp lệ')
];

// Update contact info validation
const validateUpdateContactInfo = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !AuthUtils.isValidPhone(value)) {
        throw new Error('Số điện thoại không hợp lệ');
      }
      return true;
    }),
    
  body('alternatePhone')
    .optional()
    .custom((value) => {
      if (value && !AuthUtils.isValidPhone(value)) {
        throw new Error('Số điện thoại phụ không hợp lệ');
      }
      return true;
    }),
    
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Địa chỉ đường không được quá 200 ký tự'),
    
  body('address.ward')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên phường/xã không được quá 100 ký tự'),
    
  body('address.district')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên quận/huyện không được quá 100 ký tự'),
    
  body('address.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên thành phố không được quá 100 ký tự'),
    
  body('address.province')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên tỉnh không được quá 100 ký tự'),
    
  body('address.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Tên quốc gia không được quá 100 ký tự'),
    
  body('address.zipCode')
    .optional()
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Mã bưu điện không hợp lệ')
];

// Document validation
const validateDocument = [
  body('type')
    .notEmpty()
    .withMessage('Loại giấy tờ là bắt buộc')
    .isIn(['passport', 'national_id', 'driver_license'])
    .withMessage('Loại giấy tờ không hợp lệ'),
    
  body('number')
    .notEmpty()
    .withMessage('Số giấy tờ là bắt buộc')
    .isLength({ min: 5, max: 20 })
    .withMessage('Số giấy tờ phải từ 5-20 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Số giấy tờ chỉ được chứa chữ cái in hoa và số'),
    
  body('issuedDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày cấp không đúng định dạng')
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Ngày cấp không thể là tương lai');
      }
      return true;
    }),
    
  body('expiryDate')
    .notEmpty()
    .withMessage('Ngày hết hạn là bắt buộc')
    .isISO8601()
    .withMessage('Ngày hết hạn không đúng định dạng')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Ngày hết hạn phải sau ngày hiện tại');
      }
      return true;
    }),
    
  body('issuedBy')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Nơi cấp không được quá 100 ký tự'),
    
  body('issuedCountry')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Quốc gia cấp không được quá 100 ký tự'),
    
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary phải là boolean'),
    
  param('documentId')
    .optional()
    .custom((value) => {
      if (value !== 'new' && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Document ID không hợp lệ');
      }
      return true;
    })
];

// Preferences validation
const validateUpdatePreferences = [
  body('language')
    .optional()
    .isIn(['vi', 'en', 'zh', 'ja', 'ko'])
    .withMessage('Ngôn ngữ không hợp lệ'),
    
  body('currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR', 'JPY'])
    .withMessage('Đơn vị tiền tệ không hợp lệ'),
    
  body('seatPreference')
    .optional()
    .isIn(['window', 'aisle', 'middle', 'no_preference'])
    .withMessage('Tùy chọn ghế ngồi không hợp lệ'),
    
  body('mealPreference')
    .optional()
    .isIn(['normal', 'vegetarian', 'vegan', 'halal', 'kosher', 'no_meal'])
    .withMessage('Tùy chọn suất ăn không hợp lệ'),
    
  body('specialAssistance')
    .optional()
    .isArray()
    .withMessage('Hỗ trợ đặc biệt phải là mảng'),
    
  body('specialAssistance.*')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Mỗi yêu cầu hỗ trợ không được quá 100 ký tự'),
    
  body('marketingConsent.email')
    .optional()
    .isBoolean()
    .withMessage('Đồng ý email marketing phải là boolean'),
    
  body('marketingConsent.sms')
    .optional()
    .isBoolean()
    .withMessage('Đồng ý SMS marketing phải là boolean'),
    
  body('marketingConsent.phone')
    .optional()
    .isBoolean()
    .withMessage('Đồng ý gọi điện marketing phải là boolean')
];

// Frequent flyer validation
const validateFrequentFlyerInfo = [
  body('membershipNumber')
    .notEmpty()
    .withMessage('Số thành viên là bắt buộc')
    .isLength({ min: 5, max: 20 })
    .withMessage('Số thành viên phải từ 5-20 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Số thành viên chỉ được chứa chữ cái in hoa và số')
];

// Deactivate account validation
const validateDeactivateAccount = [
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu xác nhận là bắt buộc'),
    
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Lý do không được quá 500 ký tự')
];

// Delete account validation
const validateDeleteAccount = [
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu xác nhận là bắt buộc'),
    
  body('confirmText')
    .notEmpty()
    .withMessage('Vui lòng nhập "DELETE_MY_ACCOUNT" để xác nhận')
    .equals('DELETE_MY_ACCOUNT')
    .withMessage('Vui lòng nhập chính xác "DELETE_MY_ACCOUNT"')
];

// Document ID validation
const validateDocumentId = [
  param('documentId')
    .notEmpty()
    .withMessage('Document ID là bắt buộc')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Document ID không hợp lệ')
];

module.exports = {
  validateUpdateProfile,
  validateUpdateContactInfo,
  validateDocument,
  validateUpdatePreferences,
  validateFrequentFlyerInfo,
  validateDeactivateAccount,
  validateDeleteAccount,
  validateDocumentId
};