const crypto = require('crypto');
const axios = require('axios');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { AppError } = require('../utils/errorHandler');
const config = require('../config/config');

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      vnpay: {
        baseUrl: process.env.VNPAY_BASE_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        tmnCode: process.env.VNPAY_TMN_CODE,
        secretKey: process.env.VNPAY_SECRET_KEY,
        returnUrl: process.env.VNPAY_RETURN_URL,
        ipnUrl: process.env.VNPAY_IPN_URL
      },
      zalopay: {
        baseUrl: process.env.ZALOPAY_BASE_URL || 'https://sb-openapi.zalopay.vn/v2/create',
        appId: process.env.ZALOPAY_APP_ID,
        key1: process.env.ZALOPAY_KEY1,
        key2: process.env.ZALOPAY_KEY2,
        callbackUrl: process.env.ZALOPAY_CALLBACK_URL
      },
      momo: {
        endpoint: config.MOMO_ENDPOINT,
        partnerCode: config.MOMO_PARTNER_CODE,
        accessKey: config.MOMO_ACCESS_KEY,
        secretKey: config.MOMO_SECRET_KEY,
        returnUrl: config.MOMO_RETURN_URL,
        notifyUrl: config.MOMO_NOTIFY_URL
      }
    };
  }

  // Tạo payment URL cho VNPay
  async createVNPayPayment(bookingId, amount, orderInfo, ipAddr) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      const vnp_TxnRef = this.generateTxnRef();
      const vnp_CreateDate = this.formatDate(new Date());
      const vnp_ExpireDate = this.formatDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes

      // Tạo payment record
      const payment = await Payment.create({
        booking: bookingId,
        amount: amount,
        currency: 'VND',
        gateway: {
          provider: 'vnpay',
          transactionId: vnp_TxnRef
        },
        method: {
          type: 'e_wallet',
          eWallet: {
            provider: 'vnpay',
            transactionId: vnp_TxnRef
          }
        },
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.gateways.vnpay.tmnCode,
        vnp_Amount: amount * 100, // VNPay requires amount in VND * 100
        vnp_CreateDate: vnp_CreateDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: ipAddr,
        vnp_Locale: 'vn',
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: this.gateways.vnpay.returnUrl,
        vnp_TxnRef: vnp_TxnRef,
        vnp_ExpireDate: vnp_ExpireDate
      };

      // Sắp xếp params theo alphabet
      const sortedParams = this.sortObject(vnpParams);
      const signData = new URLSearchParams(sortedParams).toString();
      const secureHash = crypto
        .createHmac('sha512', this.gateways.vnpay.secretKey)
        .update(signData)
        .digest('hex');

      sortedParams.vnp_SecureHash = secureHash;
      const paymentUrl = this.gateways.vnpay.baseUrl + '?' + new URLSearchParams(sortedParams).toString();

      return {
        paymentId: payment._id,
        paymentUrl,
        transactionId: vnp_TxnRef,
        expiresAt: payment.expiresAt
      };
    } catch (error) {
      console.error('VNPay payment creation error:', error);
      throw new AppError('Lỗi tạo thanh toán VNPay', 500);
    }
  }

  // Xử lý callback từ VNPay
  async handleVNPayCallback(params) {
    try {
      const secureHash = params.vnp_SecureHash;
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;

      const sortedParams = this.sortObject(params);
      const signData = new URLSearchParams(sortedParams).toString();
      const checkSum = crypto
        .createHmac('sha512', this.gateways.vnpay.secretKey)
        .update(signData)
        .digest('hex');

      if (secureHash !== checkSum) {
        throw new AppError('Invalid signature', 400);
      }

      const payment = await Payment.findOne({
        'gateway.transactionId': params.vnp_TxnRef
      }).populate('booking');

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Cập nhật payment status
      const isSuccess = params.vnp_ResponseCode === '00';
      
      await Payment.findByIdAndUpdate(payment._id, {
        status: isSuccess ? 'completed' : 'failed',
        'gateway.responseCode': params.vnp_ResponseCode,
        'gateway.responseMessage': this.getVNPayResponseMessage(params.vnp_ResponseCode),
        completedAt: isSuccess ? new Date() : undefined,
        'transactions.0': {
          id: params.vnp_TransactionNo || params.vnp_TxnRef,
          gateway: {
            provider: 'vnpay',
            transactionId: params.vnp_TransactionNo || params.vnp_TxnRef,
            responseCode: params.vnp_ResponseCode,
            responseMessage: this.getVNPayResponseMessage(params.vnp_ResponseCode)
          },
          amount: parseInt(params.vnp_Amount) / 100,
          currency: 'VND',
          status: isSuccess ? 'completed' : 'failed',
          processedAt: new Date()
        }
      });

      // Cập nhật booking status
      if (isSuccess) {
        await Booking.findByIdAndUpdate(payment.booking._id, {
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
          'payment.transactionId': params.vnp_TransactionNo || params.vnp_TxnRef,
          'payment.paymentGateway': 'vnpay'
        });
      }

      return {
        success: isSuccess,
        transactionId: params.vnp_TxnRef,
        amount: parseInt(params.vnp_Amount) / 100,
        responseCode: params.vnp_ResponseCode,
        message: this.getVNPayResponseMessage(params.vnp_ResponseCode)
      };
    } catch (error) {
      console.error('VNPay callback error:', error);
      throw error;
    }
  }

  // Tạo payment cho ZaloPay
  async createZaloPayPayment(bookingId, amount, description) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      const transId = this.generateTxnRef();
      const order = {
        app_id: this.gateways.zalopay.appId,
        app_trans_id: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${transId}`,
        app_user: booking.contactInfo.email,
        app_time: Date.now(),
        amount: amount,
        description: description,
        bank_code: '',
        callback_url: this.gateways.zalopay.callbackUrl,
        embed_data: JSON.stringify({
          bookingId: bookingId,
          redirecturl: process.env.FRONTEND_URL + '/payment/success'
        })
      };

      // Tạo MAC
      const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.description}`;
      order.mac = crypto
        .createHmac('sha256', this.gateways.zalopay.key1)
        .update(data)
        .digest('hex');

      // Tạo payment record
      const payment = await Payment.create({
        booking: bookingId,
        amount: amount,
        currency: 'VND',
        gateway: {
          provider: 'zalopay',
          transactionId: order.app_trans_id
        },
        method: {
          type: 'e_wallet',
          eWallet: {
            provider: 'zalopay',
            transactionId: order.app_trans_id
          }
        },
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

      // Gọi API ZaloPay
      const response = await axios.post(this.gateways.zalopay.baseUrl, order, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.return_code === 1) {
        return {
          paymentId: payment._id,
          paymentUrl: response.data.order_url,
          transactionId: order.app_trans_id,
          expiresAt: payment.expiresAt
        };
      } else {
        throw new AppError('ZaloPay payment creation failed', 500);
      }
    } catch (error) {
      console.error('ZaloPay payment creation error:', error);
      throw new AppError('Lỗi tạo thanh toán ZaloPay', 500);
    }
  }

  // Xử lý callback từ ZaloPay
  async handleZaloPayCallback(data) {
    try {
      const { mac, ...callbackData } = data;
      
      const checkMac = crypto
        .createHmac('sha256', this.gateways.zalopay.key2)
        .update(JSON.stringify(callbackData))
        .digest('hex');

      if (mac !== checkMac) {
        throw new AppError('Invalid MAC', 400);
      }

      const payment = await Payment.findOne({
        'gateway.transactionId': callbackData.app_trans_id
      }).populate('booking');

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      const isSuccess = callbackData.status === 1;

      // Cập nhật payment
      await Payment.findByIdAndUpdate(payment._id, {
        status: isSuccess ? 'completed' : 'failed',
        'gateway.responseCode': callbackData.status.toString(),
        completedAt: isSuccess ? new Date() : undefined,
        'transactions.0': {
          id: callbackData.zp_trans_id || callbackData.app_trans_id,
          gateway: {
            provider: 'zalopay',
            transactionId: callbackData.zp_trans_id || callbackData.app_trans_id,
            responseCode: callbackData.status.toString()
          },
          amount: callbackData.amount,
          currency: 'VND',
          status: isSuccess ? 'completed' : 'failed',
          processedAt: new Date()
        }
      });

      // Cập nhật booking
      if (isSuccess) {
        await Booking.findByIdAndUpdate(payment.booking._id, {
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
          'payment.transactionId': callbackData.zp_trans_id || callbackData.app_trans_id,
          'payment.paymentGateway': 'zalopay'
        });
      }

      return {
        success: isSuccess,
        transactionId: callbackData.app_trans_id,
        amount: callbackData.amount
      };
    } catch (error) {
      console.error('ZaloPay callback error:', error);
      throw error;
    }
  }

  // Tạo payment cho MoMo
  async createMoMoPayment(bookingId, amount, orderInfo) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      // Generate unique IDs
      const orderId = `VJ_${bookingId}_${Date.now()}`;
      const requestId = orderId;
      
      const momoConfig = this.gateways.momo;

      // Build raw signature string theo MoMo spec
      const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=&ipnUrl=${momoConfig.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.returnUrl}&requestId=${requestId}&requestType=payWithMethod`;

      const signature = crypto
        .createHmac('sha256', momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode: momoConfig.partnerCode,
        partnerName: 'Vietjet Air',
        storeId: 'VietjetStore',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: momoConfig.returnUrl,
        ipnUrl: momoConfig.notifyUrl,
        lang: 'vi',
        requestType: 'payWithMethod',
        autoCapture: true,
        extraData: '',
        signature: signature
      };

      console.log('🔐 MoMo Request:', {
        orderId,
        amount,
        endpoint: momoConfig.endpoint
      });

      // Tạo payment record theo đúng Payment schema
      const payment = await Payment.create({
        booking: bookingId,
        paymentReference: orderId, // Required field
        amount: {
          total: amount,           // Required nested field
          currency: 'VND'
        },
        method: {
          type: 'e_wallet',        // Required nested field
          eWallet: {
            provider: 'momo',
            transactionId: orderId
          }
        },
        gateway: {
          provider: 'momo',
          transactionId: orderId
        },
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

      // Gọi MoMo API
      const response = await axios.post(momoConfig.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('💰 MoMo Response:', response.data);

      if (response.data.resultCode === 0) {
        // MoMo trả về payUrl để redirect
        return {
          paymentId: payment._id,
          paymentUrl: response.data.payUrl,
          orderId: orderId,
          expiresAt: payment.expiresAt
        };
      } else {
        // MoMo trả về lỗi
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'failed',
          failureReason: response.data.message || 'MoMo payment creation failed'
        });
        
        throw new AppError(`MoMo error: ${response.data.message}`, 500);
      }
    } catch (error) {
      console.error('❌ MoMo payment creation error:', error.response?.data || error.message);
      throw new AppError(error.message || 'Lỗi tạo thanh toán MoMo', 500);
    }
  }

  // Xử lý callback từ MoMo
  async handleMoMoCallback(data) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = data;

      console.log('🔔 MoMo callback received:', { orderId, resultCode, message });

      const momoConfig = this.gateways.momo;

      // Verify signature theo MoMo spec
      const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Invalid signature:', { expected: expectedSignature, received: signature });
        throw new AppError('Invalid signature', 400);
      }

      console.log('✅ Signature verified successfully');

      // Tìm payment theo paymentReference (orderId)
      const payment = await Payment.findOne({ paymentReference: orderId }).populate('booking');

      if (!payment) {
        console.error('❌ Payment not found:', orderId);
        throw new AppError('Payment not found', 404);
      }

      const isSuccess = resultCode === 0;

      // Cập nhật payment theo Payment schema
      await Payment.findByIdAndUpdate(payment._id, {
        status: isSuccess ? 'completed' : 'failed',
        'gateway.responseCode': resultCode?.toString(),
        'gateway.responseMessage': message,
        'method.eWallet.transactionId': transId?.toString() || orderId,
        completedAt: isSuccess ? new Date() : undefined,
        failedAt: isSuccess ? undefined : new Date(),
        failureReason: isSuccess ? undefined : message
      });

      console.log(`💳 Payment ${isSuccess ? 'completed' : 'failed'}:`, payment._id);

      // Cập nhật booking
      if (isSuccess) {
        await Booking.findByIdAndUpdate(payment.booking._id, {
          status: 'confirmed',
          'payment.status': 'paid',
          'payment.paidAt': new Date()
        });

        console.log('✈️ Booking confirmed:', payment.booking._id);

        // TODO: Gửi email xác nhận thanh toán
        // TODO: Cập nhật inventory từ 'held' sang 'sold'
      } else {
        // Thanh toán thất bại, giải phóng ghế
        await Booking.findByIdAndUpdate(payment.booking._id, {
          'payment.status': 'failed',
          status: 'cancelled'
        });

        // TODO: Release inventory
      }

      return {
        success: isSuccess,
        transactionId: transId || orderId,
        amount: amount,
        message: message
      };
    } catch (error) {
      console.error('MoMo callback error:', error);
      throw error;
    }
  }

  // Kiểm tra trạng thái payment
  async checkPaymentStatus(paymentId) {
    try {
      const payment = await Payment.findById(paymentId).populate('booking');
      
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Kiểm tra timeout
      if (payment.status === 'pending' && new Date() > payment.expiresAt) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: 'expired'
        });
        payment.status = 'expired';
      }

      return {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        gateway: payment.gateway.provider,
        booking: {
          bookingReference: payment.booking.bookingReference,
          totalAmount: payment.booking.payment.totalAmount
        },
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt,
        completedAt: payment.completedAt
      };
    } catch (error) {
      console.error('Check payment status error:', error);
      throw error;
    }
  }

  // Xử lý refund
  async processRefund(paymentId, refundAmount, reason) {
    try {
      const payment = await Payment.findById(paymentId).populate('booking');
      
      if (!payment || payment.status !== 'completed') {
        throw new AppError('Invalid payment for refund', 400);
      }

      // Tạo refund request (sẽ được xử lý manual hoặc qua API gateway)
      const refund = {
        originalPaymentId: paymentId,
        amount: refundAmount,
        reason: reason,
        status: 'pending',
        createdAt: new Date()
      };

      await Payment.findByIdAndUpdate(paymentId, {
        $push: { refunds: refund },
        $inc: { refundAmount: refundAmount }
      });

      // Cập nhật booking
      await Booking.findByIdAndUpdate(payment.booking._id, {
        $inc: { 'payment.refundAmount': refundAmount }
      });

      return {
        refundId: refund._id,
        amount: refundAmount,
        status: 'pending',
        estimatedProcessingTime: '3-7 business days'
      };
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }

  // Helper methods
  generateTxnRef() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  formatDate(date) {
    return date.toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14);
  }

  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  getVNPayResponseMessage(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'KH nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác'
    };
    return messages[code] || 'Lỗi không xác định';
  }
}

module.exports = new PaymentGatewayService();