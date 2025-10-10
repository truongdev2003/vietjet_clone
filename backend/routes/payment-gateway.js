const express = require('express');
const PaymentGatewayService = require('../services/paymentGatewayService');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');

const router = express.Router();

// Tạo payment URL
router.post('/create', asyncHandler(async (req, res, next) => {
  const { bookingId, amount, gateway, orderInfo, ipAddr } = req.body;

  if (!bookingId || !amount || !gateway) {
    return next(new AppError('Thiếu thông tin thanh toán', 400));
  }

  let result;
  
  switch (gateway.toLowerCase()) {
    case 'vnpay':
      result = await PaymentGatewayService.createVNPayPayment(
        bookingId, 
        amount, 
        orderInfo || 'VietJet Air - Thanh toán vé máy bay', 
        ipAddr || req.ip
      );
      break;
      
    case 'zalopay':
      result = await PaymentGatewayService.createZaloPayPayment(
        bookingId,
        amount,
        orderInfo || 'VietJet Air - Thanh toán vé máy bay'
      );
      break;
      
    case 'momo':
      result = await PaymentGatewayService.createMoMoPayment(
        bookingId,
        amount,
        orderInfo || 'VietJet Air - Thanh toán vé máy bay'
      );
      break;
      
    default:
      return next(new AppError('Gateway không được hỗ trợ', 400));
  }

  const response = ApiResponse.success(result, 'Tạo payment URL thành công');
  response.send(res);
}));

// VNPay callback
router.get('/vnpay/callback', asyncHandler(async (req, res, next) => {
  const result = await PaymentGatewayService.handleVNPayCallback(req.query);
  
  // Redirect về frontend với kết quả
  const redirectUrl = `${process.env.FRONTEND_URL}/payment/${result.success ? 'success' : 'failed'}?txnRef=${result.transactionId}&amount=${result.amount}`;
  res.redirect(redirectUrl);
}));

// ZaloPay callback
router.post('/zalopay/callback', asyncHandler(async (req, res, next) => {
  const result = await PaymentGatewayService.handleZaloPayCallback(req.body);
  
  res.json({
    return_code: result.success ? 1 : 0,
    return_message: result.success ? 'success' : 'failed'
  });
}));

// MoMo callback (IPN)
router.post('/momo/callback', asyncHandler(async (req, res, next) => {
  const result = await PaymentGatewayService.handleMoMoCallback(req.body);
  
  res.json({
    resultCode: result.success ? 0 : 1,
    message: result.success ? 'Confirm Success' : 'Confirm Failed'
  });
}));

// MoMo return URL (redirect user)
router.get('/momo/return', asyncHandler(async (req, res, next) => {
  const { orderId, resultCode, message } = req.query;
  
  // Redirect về frontend với kết quả
  const redirectUrl = `${process.env.FRONTEND_URL}/payment/${resultCode === '0' ? 'success' : 'failed'}?orderId=${orderId}&message=${encodeURIComponent(message)}`;
  res.redirect(redirectUrl);
}));

// Kiểm tra trạng thái payment
router.get('/status/:paymentId', asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  
  const result = await PaymentGatewayService.checkPaymentStatus(paymentId);
  
  const response = ApiResponse.success(result, 'Lấy trạng thái thanh toán thành công');
  response.send(res);
}));

// Xử lý refund
router.post('/refund', asyncHandler(async (req, res, next) => {
  const { paymentId, refundAmount, reason } = req.body;
  
  if (!paymentId || !refundAmount || !reason) {
    return next(new AppError('Thiếu thông tin refund', 400));
  }
  
  const result = await PaymentGatewayService.processRefund(paymentId, refundAmount, reason);
  
  const response = ApiResponse.success(result, 'Tạo yêu cầu hoàn tiền thành công');
  response.send(res);
}));

module.exports = router;