const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const { EMAIL_USERNAME, EMAIL_PASSWORD,EMAIL_HOST,EMAIL_PORT } = require('../config/config');
class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    // Cấu hình transporter dựa trên môi trường
    if (process.env.NODE_ENV === 'production') {
      // Production - sử dụng SMTP service thật
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: true,
        auth: {
          user: EMAIL_USERNAME,
          pass: EMAIL_PASSWORD
        }
      });
    } else {
      // Development - sử dụng Ethereal hoặc Gmail test
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: EMAIL_USERNAME || 'test@vietjet.com',
          pass: EMAIL_PASSWORD || 'test-password'
        }
      });
    }

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('📧 Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  // Load và compile email template
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  // Gửi email xác nhận đăng ký
  async sendRegistrationConfirmation(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const emailData = {
      userName: user.personalInfo.firstName,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@vietjet.com'
    };

    const htmlContent = await this.loadTemplate('registration-confirmation', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: user.contactInfo.email,
      subject: 'Xác nhận đăng ký tài khoản VietJet Air',
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email xác nhận đặt vé (hỗ trợ cả guest và registered user)
  async sendBookingConfirmation(user, booking, flightDetails = []) {
    // Lấy thông tin passenger đầu tiên
    const firstPassenger = booking.passengers && booking.passengers[0];
    let passengerName = 'Quý khách';
    
    if (firstPassenger && firstPassenger.firstName && firstPassenger.lastName) {
      passengerName = `${firstPassenger.firstName} ${firstPassenger.lastName}`;
    } else if (booking.contact && booking.contact.firstName && booking.contact.lastName) {
      passengerName = `${booking.contact.firstName} ${booking.contact.lastName}`;
    } else if (booking.contactInfo && booking.contactInfo.email) {
      passengerName = booking.contactInfo.email.split('@')[0];
    }

    // Xử lý flight details
    const flightsInfo = flightDetails.map(detail => ({
      flightNumber: detail.flight.flightNumber,
      route: `${detail.flight.route.departure.airport.code} → ${detail.flight.route.arrival.airport.code}`,
      departureDate: detail.flight.route.departure.time.toLocaleDateString('vi-VN'),
      departureTime: detail.flight.route.departure.time.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      arrivalTime: detail.flight.route.arrival.time.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      seatClass: detail.seatClass
    }));

    const emailData = {
      bookingReference: booking.bookingReference,
      pnr: booking.pnr,
      passengerName,
      isGuest: user.isGuest,
      guestMessage: user.isGuest ? 'Đây là booking của khách vãng lai. Vui lòng lưu mã booking để tra cứu sau này.' : '',
      flights: flightsInfo,
      totalAmount: booking.pricing.total.toLocaleString('vi-VN'),
      currency: booking.pricing.currency,
      checkInUrl: `${process.env.FRONTEND_URL}/check-in/${booking.bookingReference}`,
      manageBookingUrl: user.isGuest 
        ? `${process.env.FRONTEND_URL}/lookup/${booking.bookingReference}`
        : `${process.env.FRONTEND_URL}/manage-booking/${booking.bookingReference}`,
      lookupInstructions: user.isGuest ? [
        'Lưu mã booking: ' + booking.bookingReference,
        'Sử dụng email này để tra cứu',
        'Hoặc sử dụng số điện thoại: ' + booking.contact.phone
      ] : null
    };

    const templateName = user.isGuest ? 'guest-booking-confirmation' : 'booking-confirmation';
    let htmlContent;
    
    try {
      htmlContent = await this.loadTemplate(templateName, emailData);
    } catch (error) {
      // Fallback to basic template if specific template not found
      console.log(`Template ${templateName} not found, using basic booking-confirmation`);
      htmlContent = await this.loadTemplate('booking-confirmation', emailData);
    }

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: booking.contact.email,
      subject: user.isGuest 
        ? `Xác nhận đặt vé (Khách vãng lai) - ${booking.bookingReference}`
        : `Xác nhận đặt vé thành công - ${booking.bookingReference}`,
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email xác nhận thanh toán
  async sendPaymentConfirmation(user, booking, payment) {
    // Lấy tên hành khách
    const firstPassenger = booking.flights[0]?.passengers[0];
    let passengerName = 'Quý khách';
    
    if (firstPassenger && firstPassenger.firstName && firstPassenger.lastName) {
      passengerName = `${firstPassenger.firstName} ${firstPassenger.lastName}`;
    } else if (booking.contactInfo && booking.contactInfo.email) {
      passengerName = booking.contactInfo.email.split('@')[0];
    }

    // Lấy phương thức thanh toán
    const paymentMethod = payment.paymentMethods && payment.paymentMethods[0]
      ? (payment.paymentMethods[0].eWallet?.provider || payment.paymentMethods[0].type)
      : 'N/A';

    // Format thời gian thanh toán
    const paymentTime = payment.status?.timeline?.completed 
      ? new Date(payment.status.timeline.completed).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    // Xử lý flight details
    const flightsInfo = booking.flights.map(flightBooking => {
      const flight = flightBooking.flight;
      return {
        flightNumber: flight.flightNumber,
        route: `${flight.route.departure.airport.code.iata} → ${flight.route.arrival.airport.code.iata}`,
        departureDate: new Date(flight.route.departure.time).toLocaleDateString('vi-VN'),
        departureTime: new Date(flight.route.departure.time).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        arrivalTime: new Date(flight.route.arrival.time).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        seatClass: flightBooking.type || 'Economy'
      };
    });

    const emailData = {
      passengerName,
      transactionId: payment.paymentReference,
      bookingReference: booking.bookingReference,
      paymentMethod,
      paymentTime,
      totalAmount: payment.amount.total.toLocaleString('vi-VN'),
      currency: payment.amount.currency,
      flights: flightsInfo,
      checkInUrl: `${process.env.FRONTEND_URL}/check-in/${booking.bookingReference}`,
      manageBookingUrl: user.isGuest 
        ? `${process.env.FRONTEND_URL}/lookup/${booking.bookingReference}`
        : `${process.env.FRONTEND_URL}/manage-booking/${booking.bookingReference}`
    };

    const htmlContent = await this.loadTemplate('payment-confirmation', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: booking.contactInfo.email,
      subject: `Xác nhận thanh toán - ${booking.bookingReference}`,
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email boarding pass sau khi check-in
  async sendBoardingPass(booking, flight, passenger, checkinData) {
    // Format thông tin hành khách
    const passengerName = `${passenger.firstName} ${passenger.lastName}`.toUpperCase();
    const passengerType = passenger.type === 'adult' ? 'Người lớn' : 
                         passenger.type === 'child' ? 'Trẻ em' : 'Em bé';

    // Format thời gian
    const departureDate = new Date(flight.route.departure.time).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const departureTime = new Date(flight.route.departure.time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const arrivalTime = new Date(flight.route.arrival.time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tính thời gian bay
    const duration = Math.floor(
      (new Date(flight.route.arrival.time) - new Date(flight.route.departure.time)) / (1000 * 60)
    );
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationStr = `${hours}h ${minutes}m`;

    // Thời gian lên máy bay (trước 30 phút)
    const boardingTime = new Date(new Date(flight.route.departure.time) - 30 * 60000)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Thời gian đóng cổng (trước 15 phút)
    const gateCloseTime = new Date(new Date(flight.route.departure.time) - 15 * 60000)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const emailData = {
      flightNumber: flight.flightNumber,
      bookingReference: booking.bookingReference,
      passengerName,
      passengerType,
      departureAirport: flight.route.departure.airport.code,
      departureAirportName: flight.route.departure.airport.name.vi,
      arrivalAirport: flight.route.arrival.airport.code,
      arrivalAirportName: flight.route.arrival.airport.name.vi,
      departureDate,
      departureTime,
      arrivalTime,
      duration: durationStr,
      seatNumber: checkinData.seatNumber || passenger.seatNumber,
      seatClass: checkinData.fareClass || 'Economy',
      gate: checkinData.gate || flight.route.departure.gate || 'TBA',
      boardingGroup: checkinData.boardingGroup || 'A',
      boardingTime,
      gateCloseTime,
      boardingPassNumber: `${booking.bookingReference}${passenger._id.toString().slice(-6)}`.toUpperCase(),
      downloadUrl: `${process.env.FRONTEND_URL}/boarding-pass/${booking.bookingReference}/${passenger._id}`
    };

    const htmlContent = await this.loadTemplate('boarding-pass', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: booking.contactInfo.email,
      subject: `Thẻ lên máy bay - ${flight.flightNumber} - ${passengerName}`,
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email nhắc nhở check-in
  async sendCheckInReminder(booking, flight) {
    const emailData = {
      bookingReference: booking.bookingReference,
      passengerName: booking.flights[0].passengers[0]?.firstName + ' ' + booking.flights[0].passengers[0]?.lastName,
      flightNumber: flight.flightNumber,
      route: `${flight.route.departure.airport.name.vi} → ${flight.route.arrival.airport.name.vi}`,
      departureDate: flight.route.departure.time.toLocaleDateString('vi-VN'),
      departureTime: flight.route.departure.time.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      checkInUrl: `${process.env.FRONTEND_URL}/check-in/${booking.bookingReference}`,
      terminal: flight.route.departure.terminal
    };

    const htmlContent = await this.loadTemplate('checkin-reminder', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: booking.contactInfo.email,
      subject: `Nhắc nhở check-in - Chuyến bay ${flight.flightNumber}`,
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email thông báo thay đổi chuyến bay
  async sendFlightUpdate(booking, flight, updateType, details) {
    const updateMessages = {
      delay: 'Chuyến bay bị hoãn',
      gate_change: 'Thay đổi cổng khởi hành',
      cancellation: 'Chuyến bay bị hủy',
      schedule_change: 'Thay đổi lịch trình'
    };

    const emailData = {
      bookingReference: booking.bookingReference,
      passengerName: booking.flights[0].passengers[0]?.firstName + ' ' + booking.flights[0].passengers[0]?.lastName,
      flightNumber: flight.flightNumber,
      updateType: updateMessages[updateType],
      details,
      newDepartureTime: details.newDepartureTime,
      newGate: details.newGate,
      reason: details.reason,
      compensation: details.compensation,
      contactPhone: process.env.CUSTOMER_SERVICE_PHONE || '1900 1886'
    };

    const htmlContent = await this.loadTemplate('flight-update', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: booking.contactInfo.email,
      subject: `Thông báo cập nhật - ${updateMessages[updateType]} ${flight.flightNumber}`,
      html: htmlContent,
      priority: 'high'
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email reset password
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailData = {
      userName: user.personalInfo.firstName,
      resetUrl,
      expirationTime: '10 phút',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@vietjet.com'
    };

    const htmlContent = await this.loadTemplate('password-reset', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: user.contactInfo.email,
      subject: 'Đặt lại mật khẩu VietJet Air',
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Gửi email khuyến mãi
  async sendPromotionalEmail(user, promotion) {
    const emailData = {
      userName: user.personalInfo.firstName,
      promotionTitle: promotion.name,
      promotionCode: promotion.code,
      discount: promotion.discount,
      validUntil: promotion.validUntil.toLocaleDateString('vi-VN'),
      description: promotion.description,
      termsUrl: `${process.env.FRONTEND_URL}/promotions/${promotion.code}/terms`,
      bookingUrl: `${process.env.FRONTEND_URL}/search?promo=${promotion.code}`
    };

    const htmlContent = await this.loadTemplate('promotion', emailData);

    const mailOptions = {
      from: {
        name: 'VietJet Air',
        address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
      },
      to: user.contactInfo.email,
      subject: `🎉 Ưu đãi đặc biệt - ${promotion.name}`,
      html: htmlContent
    };

    return await this.sendEmail(mailOptions);
  }

  // Method chung để gửi email
  async sendEmail(mailOptions) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Email sent successfully:', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gửi email bulk (cho marketing)
  async sendBulkEmails(recipients, templateName, templateData, subject) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedData = { ...templateData, ...recipient };
        const htmlContent = await this.loadTemplate(templateName, personalizedData);
        
        const mailOptions = {
          from: {
            name: 'VietJet Air',
            address: process.env.FROM_EMAIL || 'noreply@vietjet.com'
          },
          to: recipient.email,
          subject: subject,
          html: htmlContent
        };

        const result = await this.sendEmail(mailOptions);
        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId || null,
          error: result.error || null
        });

        // Delay để tránh spam
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new EmailService();