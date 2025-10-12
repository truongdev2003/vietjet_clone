const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const PaymentCode = require('../models/PaymentCode');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');

class PaymentController {
  // Tạo payment intent
  static createPayment = asyncHandler(async (req, res, next) => {
    const {
      bookingId,
      amount,
      currency = 'VND',
      paymentMethod,
      returnUrl,
      cancelUrl
    } = req.body;

    // Validate required fields
    if (!bookingId || !amount || !paymentMethod) {
      return next(new AppError('Thiếu thông tin thanh toán', 400));
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Không tìm thấy booking', 404));
    }

    if (req.user && booking.user && booking.user.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền thanh toán cho booking này', 403));
    }

    if (booking.status !== 'pending_payment') {
      return next(new AppError('Booking không ở trạng thái chờ thanh toán', 400));
    }

    // Validate amount matches booking total
    if (amount !== booking.pricing.total) {
      return next(new AppError('Số tiền thanh toán không khớp với tổng tiền booking', 400));
    }

    // Generate payment reference
    const paymentReference = this.generatePaymentReference();

    // Create payment record
    const payment = await Payment.create({
      reference: paymentReference,
      booking: bookingId,
      user: req.user ? req.user.id : null,
      
      amount: {
        total: amount,
        currency: currency,
        breakdown: {
          subtotal: booking.pricing.subtotal,
          taxes: booking.pricing.taxes || 0,
          fees: booking.pricing.fees || 0,
          serviceCharges: booking.pricing.serviceCharges || 0,
          discount: booking.pricing.discount || 0
        }
      },

      paymentMethod: {
        type: paymentMethod.type,
        card: paymentMethod.card,
        bankTransfer: paymentMethod.bankTransfer,
        eWallet: paymentMethod.eWallet,
        installment: paymentMethod.installment
      },

      status: 'pending',
      
      metadata: {
        returnUrl,
        cancelUrl,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    // Generate payment URL based on payment method
    let paymentUrl = '';
    let gatewayResponse = {};

    try {
      switch (paymentMethod.type) {
        case 'credit_card':
        case 'debit_card':
          gatewayResponse = await this.processCardPayment(payment, paymentMethod);
          break;
        case 'bank_transfer':
          gatewayResponse = await this.processBankTransfer(payment, paymentMethod);
          break;
        case 'e_wallet':
          gatewayResponse = await this.processEWalletPayment(payment, paymentMethod);
          break;
        case 'installment':
          gatewayResponse = await this.processInstallmentPayment(payment, paymentMethod);
          break;
        default:
          return next(new AppError('Phương thức thanh toán không được hỗ trợ', 400));
      }

      paymentUrl = gatewayResponse.paymentUrl;

      // Update payment with gateway information
      payment.gateway = {
        provider: gatewayResponse.provider,
        transactionId: gatewayResponse.transactionId,
        paymentUrl: paymentUrl
      };

      await payment.save();

    } catch (error) {
      payment.status = 'failed';
      payment.failure = {
        code: 'GATEWAY_ERROR',
        message: error.message,
        timestamp: new Date()
      };
      await payment.save();

      return next(new AppError('Lỗi khi tạo thanh toán: ' + error.message, 500));
    }

    const response = ApiResponse.created({
        payment: {
          id: payment._id,
          reference: payment.reference,
          amount: payment.amount.total,
          currency: payment.amount.currency,
          status: payment.status,
          paymentUrl: paymentUrl
        },
        redirectUrl: paymentUrl
      }, 'Tạo thanh toán thành công');
    response.send(res);
  });

  // Xử lý callback từ payment gateway
  static handlePaymentCallback = asyncHandler(async (req, res, next) => {
    const { provider } = req.params;
    const callbackData = req.body;

    let payment;
    let isSuccess = false;
    let errorMessage = '';

    try {
      switch (provider) {
        case 'vnpay':
          ({ payment, isSuccess, errorMessage } = await this.handleVNPayCallback(callbackData));
          break;
        case 'momo':
          ({ payment, isSuccess, errorMessage } = await this.handleMoMoCallback(callbackData));
          break;
        case 'zalopay':
          ({ payment, isSuccess, errorMessage } = await this.handleZaloPayCallback(callbackData));
          break;
        default:
          return next(new AppError('Provider không được hỗ trợ', 400));
      }

      if (isSuccess) {
        // Update payment status
        payment.status.overall = 'paid';
        payment.status.details = {
          authorized: true,
          captured: true,
          settled: false,
          reconciled: false
        };
        payment.status.timeline.completed = new Date();
        
        // Add transaction to transactions array
        payment.transactions.push({
          id: callbackData.transactionId || callbackData.orderId,
          gateway: {
            provider: provider,
            transactionId: callbackData.transactionId,
            responseCode: callbackData.responseCode,
            responseMessage: callbackData.message || 'Success'
          },
          amount: payment.amount.total,
          currency: payment.amount.currency,
          status: 'success',
          timestamp: {
            initiated: payment.status.timeline.initiated,
            completed: new Date()
          }
        });

        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.booking)
          .populate('flights.flight')
          .populate('user');
        
        if (booking) {
          booking.status = 'confirmed';
          booking.payment = payment._id;
          booking.confirmedAt = new Date();

          // Generate tickets for passengers
          for (const passenger of booking.passengers) {
            if (!passenger.ticket.ticketNumber) {
              passenger.ticket.ticketNumber = this.generateTicketNumber();
            }
            if (!passenger.ticket.eTicketNumber) {
              passenger.ticket.eTicketNumber = this.generateETicketNumber();
            }
          }

          await booking.save();

          // Update flight inventory (convert held seats to sold)
          const Inventory = require('../models/Inventory');
          for (const flightBooking of booking.flights) {
            await Inventory.findOneAndUpdate(
              { 
                flight: flightBooking.flight,
                'bookingClasses.category': flightBooking.seatClass
              },
              { 
                $inc: { 
                  'bookingClasses.$.held': -booking.passengers.length,
                  'bookingClasses.$.sold': booking.passengers.length
                }
              }
            );
          }

          // Send payment confirmation email
          try {
            const emailService = require('../services/emailService');
            const emailResult = await emailService.sendPaymentConfirmation(
              booking.user, 
              booking, 
              payment
            );
            
            if (emailResult.success) {
              console.log('✅ Payment confirmation email sent to:', booking.contactInfo.email);
            } else {
              console.error('❌ Failed to send payment confirmation email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('❌ Email sending error:', emailError);
            // Không throw error, payment đã thành công
          }
        }

        const response = ApiResponse.success({
            payment,
            booking: booking
          }, 'Thanh toán thành công');
        response.send(res);

      } else {
        // Update payment status as failed
        payment.status.overall = 'failed';
        payment.status.timeline.failed = new Date();
        payment.failure = {
          code: callbackData.responseCode || 'PAYMENT_FAILED',
          message: errorMessage || 'Thanh toán thất bại',
          timestamp: new Date(),
          gatewayResponse: callbackData
        };

        await payment.save();

        const response = ApiResponse.error(errorMessage, 'Thanh toán thất bại', 400);
        response.send(res);
      }

    } catch (error) {
      console.error('Payment callback error:', error);
      const response = ApiResponse.error(error.message, 'Lỗi xử lý callback thanh toán', 500);
      response.send(res);
    }
  });

  // Lấy thông tin payment
  static getPayment = asyncHandler(async (req, res, next) => {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('booking', 'bookingReference passengers flights pricing')
      .populate('user', 'personalInfo.firstName personalInfo.lastName contactInfo.email');

    if (!payment) {
      return next(new AppError('Không tìm thấy thanh toán', 404));
    }

    // Check permission
    if (req.user && payment.user && payment.user._id.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền xem thanh toán này', 403));
    }

    const response = ApiResponse.success(payment, 'Lấy thông tin thanh toán thành công');
    response.send(res);
  });

  // Lấy danh sách payments (user)
  static getUserPayments = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      status,
      fromDate,
      toDate
    } = req.query;

    const query = { user: req.user.id };
    
    if (status) query.status = status;
    
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('booking', 'bookingReference flights.flight')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = ApiResponse.success({
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }, 'Lấy danh sách thanh toán thành công');
    response.send(res);
  });

  // Hoàn tiền (admin)
  static refundPayment = asyncHandler(async (req, res, next) => {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return next(new AppError('Không tìm thấy thanh toán', 404));
    }

    if (payment.status !== 'completed') {
      return next(new AppError('Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành', 400));
    }

    if (payment.refund && payment.refund.status === 'completed') {
      return next(new AppError('Thanh toán này đã được hoàn tiền', 400));
    }

    const refundAmount = amount || payment.amount.total;

    if (refundAmount > payment.amount.total) {
      return next(new AppError('Số tiền hoàn tiền không thể lớn hơn số tiền gốc', 400));
    }

    // Process refund with gateway
    let refundResult;
    try {
      refundResult = await this.processRefund(payment, refundAmount, reason);
    } catch (error) {
      return next(new AppError('Lỗi khi xử lý hoàn tiền: ' + error.message, 500));
    }

    // Update payment record
    payment.refund = {
      amount: refundAmount,
      reason: reason || 'Admin refund',
      status: 'completed',
      processedAt: new Date(),
      transactionId: refundResult.transactionId,
      gatewayResponse: refundResult
    };

    await payment.save();

    const response = ApiResponse.success(payment, 'Hoàn tiền thành công');
    response.send(res);
  });

  // Helper methods
  static generatePaymentReference() {
    return 'PAY' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  static generateTicketNumber() {
    return '157' + Date.now().toString().slice(-10);
  }

  static generateETicketNumber() {
    return 'VJ' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Payment method processors (placeholders - implement with actual gateways)
  static async processCardPayment(payment, paymentMethod) {
    // TODO: Integrate with actual card payment gateway (VNPay, OnePay, etc.)
    return {
      provider: 'vnpay',
      transactionId: 'TXN' + Date.now(),
      paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${payment.reference}`
    };
  }

  static async processBankTransfer(payment, paymentMethod) {
    // TODO: Generate bank transfer instructions
    return {
      provider: 'bank_transfer',
      transactionId: 'BT' + Date.now(),
      paymentUrl: `/payment/bank-transfer/${payment._id}`
    };
  }

  static async processEWalletPayment(payment, paymentMethod) {
    // TODO: Integrate with e-wallet providers (MoMo, ZaloPay, etc.)
    const provider = paymentMethod.eWallet.provider;
    return {
      provider: provider,
      transactionId: 'EW' + Date.now(),
      paymentUrl: `https://${provider}.vn/payment?ref=${payment.reference}`
    };
  }

  static async processInstallmentPayment(payment, paymentMethod) {
    // TODO: Integrate with installment providers
    return {
      provider: 'installment',
      transactionId: 'INS' + Date.now(),
      paymentUrl: `/payment/installment/${payment._id}`
    };
  }

  // Gateway callback handlers (placeholders)
  static async handleVNPayCallback(callbackData) {
    // TODO: Implement VNPay callback verification
    const payment = await Payment.findOne({ reference: callbackData.vnp_TxnRef });
    return {
      payment,
      isSuccess: callbackData.vnp_ResponseCode === '00',
      errorMessage: callbackData.vnp_ResponseCode !== '00' ? 'VNPay payment failed' : ''
    };
  }

  static async handleMoMoCallback(callbackData) {
    // TODO: Implement MoMo callback verification
    const payment = await Payment.findOne({ reference: callbackData.orderId });
    return {
      payment,
      isSuccess: callbackData.resultCode === 0,
      errorMessage: callbackData.resultCode !== 0 ? callbackData.message : ''
    };
  }

  static async handleZaloPayCallback(callbackData) {
    // TODO: Implement ZaloPay callback verification
    const payment = await Payment.findOne({ reference: callbackData.app_trans_id });
    return {
      payment,
      isSuccess: callbackData.return_code === 1,
      errorMessage: callbackData.return_code !== 1 ? callbackData.return_message : ''
    };
  }

  static async processRefund(payment, amount, reason) {
    // TODO: Implement actual refund processing with payment gateway
    return {
      transactionId: 'REF' + Date.now(),
      status: 'completed',
      amount: amount,
      message: 'Refund processed successfully'
    };
  }

  // Admin: Get all payments
  static getAllPayments = asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 20,
      status,
      method,
      search,
      dateFrom,
      dateTo
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by status (nested in status.overall)
    if (status) {
      query['status.overall'] = status;
    }
    
    // Filter by payment method (paymentMethods array)
    if (method) {
      query['paymentMethods.type'] = method;
    }
    
    // Search by paymentReference or booking reference
    if (search) {
      const bookings = await Booking.find({
        bookingReference: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { paymentReference: { $regex: search, $options: 'i' } },
        { booking: { $in: bookings.map(b => b._id) } }
      ];
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      query['status.timeline.initiated'] = {};
      if (dateFrom) query['status.timeline.initiated'].$gte = new Date(dateFrom);
      if (dateTo) query['status.timeline.initiated'].$lte = new Date(dateTo);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .sort({ 'status.timeline.initiated': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('booking', 'bookingReference contactInfo')
      .populate('user', 'personalInfo.firstName personalInfo.lastName contactInfo.email')
      .lean();

    // Get total count
    const total = await Payment.countDocuments(query);

    const response = ApiResponse.success({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách thanh toán thành công');

    response.send(res);
  });

  // Validate và tính toán discount cho payment code
  static validatePaymentCode = asyncHandler(async (req, res, next) => {
    const { code, amount, bookingId } = req.body;

    if (!code || !amount) {
      return next(new AppError('Thiếu thông tin mã thanh toán hoặc số tiền', 400));
    }

    try {
      // Tìm payment code hợp lệ
      const paymentCode = await PaymentCode.findValidCode(code);

      // Kiểm tra user có thể sử dụng mã không
      const userId = req.user ? req.user.id : null;
      if (userId) {
        const canUse = paymentCode.canUserUse(userId);
        if (!canUse.valid) {
          return next(new AppError(canUse.message, 400));
        }
      }

      // Kiểm tra số tiền tối thiểu
      if (amount < paymentCode.minAmount) {
        return next(new AppError(
          `Số tiền thanh toán tối thiểu để áp dụng mã này là ${paymentCode.minAmount.toLocaleString('vi-VN')} VND`,
          400
        ));
      }

      // Nếu có bookingId, kiểm tra điều kiện áp dụng
      if (bookingId && paymentCode.applicableFor) {
        const booking = await Booking.findById(bookingId).populate('flights.flight');
        
        if (booking) {
          // Kiểm tra flights
          if (paymentCode.applicableFor.flights && 
              paymentCode.applicableFor.flights.length > 0) {
            const flightIds = booking.flights.map(f => f.flight._id.toString());
            const hasApplicableFlight = flightIds.some(id => 
              paymentCode.applicableFor.flights.map(f => f.toString()).includes(id)
            );
            
            if (!hasApplicableFlight) {
              return next(new AppError('Mã không áp dụng cho chuyến bay này', 400));
            }
          }

          // Kiểm tra fare classes
          if (paymentCode.applicableFor.fareClasses && 
              paymentCode.applicableFor.fareClasses.length > 0) {
            const fareClasses = booking.flights.map(f => f.fare.class);
            const hasApplicableFare = fareClasses.some(fc => 
              paymentCode.applicableFor.fareClasses.includes(fc)
            );
            
            if (!hasApplicableFare) {
              return next(new AppError('Mã không áp dụng cho hạng vé này', 400));
            }
          }
        }
      }

      // Tính toán discount
      const discountAmount = paymentCode.calculateDiscount(amount);
      const finalAmount = amount - discountAmount;

      const response = ApiResponse.success({
        valid: true,
        code: paymentCode.code,
        name: paymentCode.name,
        discountType: paymentCode.discountType,
        discountValue: paymentCode.value,
        discountAmount,
        originalAmount: amount,
        finalAmount,
        expiryDate: paymentCode.expiryDate
      }, 'Mã thanh toán hợp lệ');

      response.send(res);
    } catch (error) {
      return next(new AppError(error.message, 400));
    }
  });
}

module.exports = PaymentController;