const mongoose = require('mongoose');

// Schema cho payment method details
const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'installment', 'points', 'voucher', 'cash'],
    required: true
  },
  
  // Credit/Debit card details
  card: {
    last4Digits: String,
    brand: {
      type: String,
      enum: ['visa', 'mastercard', 'jcb', 'amex', 'discover']
    },
    type: {
      type: String,
      enum: ['credit', 'debit']
    },
    expiryMonth: Number,
    expiryYear: Number,
    holderName: String,
    issuerBank: String,
    issuerCountry: String
  },
  
  // Bank transfer details
  bankTransfer: {
    bankCode: String,
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    transferReference: String
  },
  
  // E-wallet details
  eWallet: {
    provider: {
      type: String,
      enum: ['momo', 'zalopay', 'vnpay', 'paypal', 'grab_pay', 'shopee_pay']
    },
    accountId: String,
    transactionId: String
  },
  
  // Installment details
  installment: {
    provider: String,
    tenure: Number, // months
    interestRate: Number,
    monthlyAmount: Number,
    firstPayment: Number
  },
  
  // Points/Miles details
  points: {
    program: String,
    accountNumber: String,
    pointsUsed: Number,
    pointsEarned: Number,
    conversionRate: Number
  },
  
  // Voucher details
  voucher: {
    code: String,
    issuer: String,
    value: Number,
    expiryDate: Date
  }
});

// Schema cho transaction details
const transactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  
  gateway: {
    provider: {
      type: String,
      enum: ['vnpay', 'onepay', 'paypal', 'stripe', 'momo', 'zalopay', 'nganluong'],
      required: true
    },
    transactionId: String,
    referenceId: String,
    authCode: String,
    responseCode: String,
    responseMessage: String
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'VND'
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  timestamp: {
    initiated: {
      type: Date,
      default: Date.now
    },
    completed: Date,
    failed: Date
  },
  
  fees: {
    gateway: Number,
    processing: Number,
    currency: Number,
    total: Number
  },
  
  risk: {
    score: Number,
    level: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    checks: [String],
    fraud: {
      detected: Boolean,
      reason: String
    }
  }
});

const paymentSchema = new mongoose.Schema({
  // Thông tin booking liên quan
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  // Thông tin user (nếu có)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment reference
  paymentReference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Thông tin số tiền
  amount: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND'
    },
    
    // Breakdown chi tiết
    breakdown: {
      baseFare: Number,
      taxes: Number,
      fees: Number,
      services: Number,
      insurance: Number,
      discount: Number,
      
      // Chi tiết taxes
      taxBreakdown: [{
        code: String,
        description: String,
        amount: Number
      }],
      
      // Chi tiết fees
      feeBreakdown: [{
        type: String,
        description: String,
        amount: Number
      }]
    },
    
    // Converted amounts (for multi-currency)
    converted: {
      amount: Number,
      currency: String,
      rate: Number,
      rateDate: Date
    }
  },
  
  // Payment methods used
  paymentMethods: [paymentMethodSchema],
  
  // Payment strategy
  strategy: {
    type: {
      type: String,
      enum: ['single', 'split', 'partial', 'installment'],
      default: 'single'
    },
    
    // For split payments
    splits: [{
      method: String,
      amount: Number,
      percentage: Number,
      status: String
    }],
    
    // For installment payments
    installmentPlan: {
      totalInstallments: Number,
      currentInstallment: Number,
      monthlyAmount: Number,
      nextDueDate: Date,
      remainingAmount: Number
    }
  },
  
  // Transaction history
  transactions: [transactionSchema],
  
  // Payment status
  status: {
    overall: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'partially_paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    
    details: {
      authorized: Boolean,
      captured: Boolean,
      settled: Boolean,
      reconciled: Boolean
    },
    
    timeline: {
      initiated: {
        type: Date,
        default: Date.now
      },
      authorized: Date,
      captured: Date,
      settled: Date,
      completed: Date,
      failed: Date,
      cancelled: Date
    }
  },
  
  // Refund information
  refund: {
    eligible: {
      type: Boolean,
      default: true
    },
    
    policy: {
      type: String,
      enum: ['full_refund', 'partial_refund', 'non_refundable', 'fee_applicable']
    },
    
    requests: [{
      requestId: String,
      amount: Number,
      reason: String,
      requestedDate: Date,
      processedDate: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processed']
      },
      method: String, // How refund will be processed
      fee: Number,
      netRefund: Number
    }],
    
    processed: {
      total: {
        type: Number,
        default: 0
      },
      transactions: [{
        amount: Number,
        date: Date,
        method: String,
        reference: String,
        status: String
      }]
    }
  },
  
  // Security and compliance
  security: {
    pci: {
      compliant: Boolean,
      tokenized: Boolean,
      encrypted: Boolean
    },
    
    threeDS: {
      version: String,
      status: String,
      authenticationId: String,
      eci: String,
      cavv: String
    },
    
    antiMoney: {
      checked: Boolean,
      status: String,
      riskScore: Number
    }
  },
  
  // Customer information
  customer: {
    ipAddress: String,
    userAgent: String,
    fingerprint: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    
    // Billing information
    billing: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
      }
    }
  },
  
  // Payment gateway configuration
  gateway: {
    provider: String,
    merchantId: String,
    terminalId: String,
    configuration: mongoose.Schema.Types.Mixed,
    
    // Gateway response
    response: {
      code: String,
      message: String,
      raw: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }
  },
  
  // Notifications
  notifications: {
    customer: {
      email: {
        sent: Boolean,
        sentAt: Date,
        template: String
      },
      sms: {
        sent: Boolean,
        sentAt: Date,
        message: String
      }
    },
    
    merchant: {
      sent: Boolean,
      sentAt: Date,
      method: String
    }
  },
  
  // Reconciliation
  reconciliation: {
    matched: Boolean,
    matchedDate: Date,
    settlementDate: Date,
    settlementAmount: Number,
    discrepancy: {
      amount: Number,
      reason: String,
      resolved: Boolean
    }
  },
  
  // Analytics and tracking
  analytics: {
    source: String,
    campaign: String,
    medium: String,
    conversionTime: Number, // seconds from booking to payment
    retryAttempts: Number,
    
    performance: {
      processingTime: Number, // milliseconds
      gatewayLatency: Number,
      userExperience: String
    }
  },
  
  // Additional metadata
  metadata: {
    created: {
      date: {
        type: Date,
        default: Date.now
      },
      by: String,
      ip: String
    },
    
    lastUpdated: {
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    },
    
    tags: [String],
    notes: String,
    
    // Integration references
    external: {
      erp: String,
      accounting: String,
      crm: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho payment reference display
paymentSchema.virtual('displayReference').get(function() {
  return `PAY-${this.paymentReference}`;
});

// Virtual cho total paid amount
paymentSchema.virtual('totalPaid').get(function() {
  return this.transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);
});

// Virtual cho remaining amount
paymentSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.amount.total - this.totalPaid);
});

// Virtual cho payment completion percentage
paymentSchema.virtual('completionPercentage').get(function() {
  if (this.amount.total === 0) return 0;
  return Math.round((this.totalPaid / this.amount.total) * 100);
});

// Virtual cho payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Đang chờ thanh toán',
    'processing': 'Đang xử lý',
    'paid': 'Đã thanh toán',
    'partially_paid': 'Thanh toán một phần',
    'failed': 'Thanh toán thất bại',
    'cancelled': 'Đã hủy',
    'refunded': 'Đã hoàn tiền',
    'partially_refunded': 'Hoàn tiền một phần'
  };
  return statusMap[this.status.overall] || this.status.overall;
});

// Index cho tìm kiếm hiệu quả
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ 'status.overall': 1 });
paymentSchema.index({ 'amount.currency': 1 });
paymentSchema.index({ 'status.timeline.initiated': 1 });
paymentSchema.index({ 'gateway.provider': 1 });

// Compound indexes
paymentSchema.index({
  booking: 1,
  'status.overall': 1,
  'status.timeline.initiated': 1
});

paymentSchema.index({
  user: 1,
  'status.timeline.initiated': -1
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Generate payment reference if not exists
  if (!this.paymentReference) {
    this.paymentReference = generatePaymentReference();
  }
  
  // Update last modified
  this.metadata.lastUpdated.date = new Date();
  
  // Calculate total fees
  this.transactions.forEach(transaction => {
    if (transaction.fees) {
      transaction.fees.total = 
        (transaction.fees.gateway || 0) + 
        (transaction.fees.processing || 0) + 
        (transaction.fees.currency || 0);
    }
  });
  
  // Update overall status based on transactions
  this.updateOverallStatus();
  
  next();
});

// Method to generate payment reference
function generatePaymentReference() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}${random}`;
}

// Method to update overall status
paymentSchema.methods.updateOverallStatus = function() {
  const successfulTransactions = this.transactions.filter(t => t.status === 'success');
  const totalPaid = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  if (totalPaid === 0) {
    const hasFailedTransactions = this.transactions.some(t => t.status === 'failed');
    const hasPendingTransactions = this.transactions.some(t => t.status === 'pending' || t.status === 'processing');
    
    if (hasFailedTransactions && !hasPendingTransactions) {
      this.status.overall = 'failed';
    } else {
      this.status.overall = 'pending';
    }
  } else if (totalPaid < this.amount.total) {
    this.status.overall = 'partially_paid';
  } else {
    this.status.overall = 'paid';
    this.status.timeline.completed = new Date();
  }
  
  // Check for refunds
  if (this.refund.processed.total > 0) {
    if (this.refund.processed.total >= this.amount.total) {
      this.status.overall = 'refunded';
    } else {
      this.status.overall = 'partially_refunded';
    }
  }
};

// Method to process payment
paymentSchema.methods.processPayment = function(paymentMethod, gatewayConfig) {
  const transaction = {
    id: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gateway: {
      provider: gatewayConfig.provider,
      merchantId: gatewayConfig.merchantId
    },
    amount: this.remainingAmount,
    currency: this.amount.currency,
    status: 'processing',
    timestamp: {
      initiated: new Date()
    }
  };
  
  this.transactions.push(transaction);
  this.status.overall = 'processing';
  
  return this.save();
};

// Method to confirm payment
paymentSchema.methods.confirmPayment = function(transactionId, gatewayResponse) {
  const transaction = this.transactions.find(t => t.id === transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  transaction.status = 'success';
  transaction.timestamp.completed = new Date();
  transaction.gateway.transactionId = gatewayResponse.transactionId;
  transaction.gateway.responseCode = gatewayResponse.code;
  transaction.gateway.responseMessage = gatewayResponse.message;
  
  this.status.timeline.authorized = new Date();
  this.status.timeline.captured = new Date();
  this.status.details.authorized = true;
  this.status.details.captured = true;
  
  this.updateOverallStatus();
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  if (!this.refund.eligible) {
    throw new Error('Payment is not eligible for refund');
  }
  
  const refundRequest = {
    requestId: `REF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: amount,
    reason: reason,
    requestedDate: new Date(),
    status: 'pending'
  };
  
  this.refund.requests.push(refundRequest);
  
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);