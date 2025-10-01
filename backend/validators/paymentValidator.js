const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

// Payment creation validation
const validatePaymentCreate = [
  body('bookingId')
    .notEmpty()
    .withMessage('ID booking là bắt buộc')
    .isMongoId()
    .withMessage('ID booking không hợp lệ'),
  
  body('amount')
    .notEmpty()
    .withMessage('Số tiền là bắt buộc')
    .isNumeric()
    .withMessage('Số tiền phải là số')
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Số tiền phải lớn hơn 0');
      }
      if (value > 100000000) { // 100 million VND
        throw new Error('Số tiền không được vượt quá 100,000,000 VND');
      }
      return true;
    }),
  
  body('currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR'])
    .withMessage('Loại tiền tệ không hợp lệ'),
  
  body('paymentMethod.type')
    .notEmpty()
    .withMessage('Phương thức thanh toán là bắt buộc')
    .isIn(['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'installment', 'points', 'voucher'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  
  // Card payment validation
  body('paymentMethod.card.holderName')
    .if(body('paymentMethod.type').isIn(['credit_card', 'debit_card']))
    .notEmpty()
    .withMessage('Tên chủ thẻ là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên chủ thẻ phải có từ 2-50 ký tự')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Tên chủ thẻ chỉ được chứa chữ cái và khoảng trắng'),
  
  body('paymentMethod.card.brand')
    .if(body('paymentMethod.type').isIn(['credit_card', 'debit_card']))
    .optional()
    .isIn(['visa', 'mastercard', 'jcb', 'amex'])
    .withMessage('Loại thẻ không hợp lệ'),
  
  // Bank transfer validation
  body('paymentMethod.bankTransfer.bankCode')
    .if(body('paymentMethod.type').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Mã ngân hàng là bắt buộc')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã ngân hàng không hợp lệ'),
  
  // E-wallet validation
  body('paymentMethod.eWallet.provider')
    .if(body('paymentMethod.type').equals('e_wallet'))
    .notEmpty()
    .withMessage('Nhà cung cấp ví điện tử là bắt buộc')
    .isIn(['momo', 'zalopay', 'vnpay', 'paypal', 'grab_pay', 'shopee_pay'])
    .withMessage('Nhà cung cấp ví điện tử không hợp lệ'),
  
  // Installment validation
  body('paymentMethod.installment.tenure')
    .if(body('paymentMethod.type').equals('installment'))
    .notEmpty()
    .withMessage('Kỳ hạn trả góp là bắt buộc')
    .isInt({ min: 3, max: 36 })
    .withMessage('Kỳ hạn trả góp phải từ 3-36 tháng'),
  
  body('paymentMethod.installment.provider')
    .if(body('paymentMethod.type').equals('installment'))
    .notEmpty()
    .withMessage('Nhà cung cấp trả góp là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nhà cung cấp trả góp không hợp lệ'),
  
  body('returnUrl')
    .optional()
    .isURL()
    .withMessage('URL trả về không hợp lệ'),
  
  body('cancelUrl')
    .optional()
    .isURL()
    .withMessage('URL hủy không hợp lệ'),
  
  handleValidationErrors
];

// Refund validation
const validateRefund = [
  param('paymentId')
    .notEmpty()
    .withMessage('ID thanh toán là bắt buộc')
    .isMongoId()
    .withMessage('ID thanh toán không hợp lệ'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Số tiền hoàn phải là số')
    .custom((value) => {
      if (value && value <= 0) {
        throw new Error('Số tiền hoàn phải lớn hơn 0');
      }
      return true;
    }),
  
  body('reason')
    .notEmpty()
    .withMessage('Lý do hoàn tiền là bắt buộc')
    .isLength({ min: 5, max: 200 })
    .withMessage('Lý do hoàn tiền phải có từ 5-200 ký tự'),
  
  handleValidationErrors
];

// Payment status update validation
const validatePaymentStatusUpdate = [
  param('paymentId')
    .notEmpty()
    .withMessage('ID thanh toán là bắt buộc')
    .isMongoId()
    .withMessage('ID thanh toán không hợp lệ'),
  
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc')
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
    .withMessage('Trạng thái thanh toán không hợp lệ'),
  
  body('reason')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Lý do thay đổi trạng thái phải có từ 5-200 ký tự'),
  
  handleValidationErrors
];

module.exports = {
  validatePaymentCreate,
  validateRefund,
  validatePaymentStatusUpdate
};