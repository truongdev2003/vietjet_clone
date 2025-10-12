const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

class PDFService {
  constructor() {
    this.browser = null;
  }

  // Khởi tạo browser (tái sử dụng cho hiệu suất tốt hơn)
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  // Đóng browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Load và compile template
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      return handlebars.compile(templateContent);
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Failed to load PDF template: ${templateName}`);
    }
  }

  // Format dữ liệu booking cho PDF
  formatBookingData(booking) {
    const flights = booking.flights.map(flightBooking => {
      const flight = flightBooking.flight;
      const departureTime = new Date(flight.route.departure.time);
      const arrivalTime = new Date(flight.route.arrival.time);
      
      // Tính thời gian bay
      const duration = Math.floor((arrivalTime - departureTime) / (1000 * 60));
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;

      // Lấy danh sách ghế
      const seats = flightBooking.passengers
        .filter(p => p.ticket?.seatNumber)
        .map(p => p.ticket.seatNumber)
        .join(', ') || 'Chưa chọn';

      return {
        flightNumber: flight.flightNumber,
        date: departureTime.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        departure: {
          code: flight.route.departure.airport.code.iata,
          name: flight.route.departure.airport.name.vi,
          time: departureTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        arrival: {
          code: flight.route.arrival.airport.code.iata,
          name: flight.route.arrival.airport.name.vi,
          time: arrivalTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        class: flightBooking.fareClass || 'Economy',
        duration: `${hours}h ${minutes}m`,
        seats: seats,
        baggage: flightBooking.baggage ? `${flightBooking.baggage.checked || 0}kg` : '7kg xách tay'
      };
    });

    // Format passenger data
    const passengers = [];
    let index = 1;
    booking.flights.forEach(flightBooking => {
      flightBooking.passengers.forEach(passenger => {
        passengers.push({
          index: index++,
          fullName: `${passenger.title} ${passenger.firstName} ${passenger.lastName}`.toUpperCase(),
          type: passenger.passengerType === 'adult' ? 'Người lớn' : 
                passenger.passengerType === 'child' ? 'Trẻ em' : 'Em bé',
          gender: passenger.gender === 'male' ? 'Nam' : 'Nữ',
          dateOfBirth: passenger.dateOfBirth ? 
            new Date(passenger.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A',
          seatNumber: passenger.ticket?.seatNumber || 'Chưa chọn'
        });
      });
    });

    // Format payment status
    const paymentStatusMap = {
      'pending': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'completed': 'Hoàn thành',
      'failed': 'Thất bại',
      'refunded': 'Đã hoàn tiền'
    };

    // Format địa chỉ từ object thành string
    let contactAddress = '';
    if (booking.contactInfo.address) {
      const addr = booking.contactInfo.address;
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.ward) parts.push(addr.ward);
      if (addr.district) parts.push(addr.district);
      if (addr.city) parts.push(addr.city);
      if (addr.province && addr.province !== addr.city) parts.push(addr.province);
      if (addr.country) parts.push(addr.country);
      contactAddress = parts.join(', ');
    }

    const breakdownData = {
      baseFare: (booking.payment.breakdown?.baseFare || 0).toLocaleString('vi-VN'),
      taxes: (booking.payment.breakdown?.taxes || 0).toLocaleString('vi-VN'),
      fees: (booking.payment.breakdown?.fees || 0).toLocaleString('vi-VN')
    };

    // Only add services if > 0
    if (booking.payment.breakdown?.services && booking.payment.breakdown.services > 0) {
      breakdownData.services = booking.payment.breakdown.services.toLocaleString('vi-VN');
    }

    // Only add discount if > 0
    if (booking.payment.breakdown?.discount && booking.payment.breakdown.discount > 0) {
      breakdownData.discount = booking.payment.breakdown.discount.toLocaleString('vi-VN');
    }

    return {
      bookingReference: booking.bookingReference,
      flights,
      passengers,
      contactEmail: booking.contactInfo.email,
      contactPhone: booking.contactInfo.phone,
      contactAddress: contactAddress,
      ...breakdownData,
      totalAmount: booking.payment.totalAmount.toLocaleString('vi-VN'),
      paymentStatus: paymentStatusMap[booking.payment.status] || booking.payment.status,
      paymentMethod: booking.payment.method || 'N/A',
      printDate: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  // Generate PDF từ booking
  async generateBookingPDF(booking) {
    try {
      // Load template
      const template = await this.loadTemplate('booking-ticket');
      
      // Format data
      const data = this.formatBookingData(booking);
      
      // Render HTML
      const html = template(data);

      // Khởi tạo browser
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set content và wait for load
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating booking PDF:', error);
      throw new Error('Failed to generate booking PDF');
    }
  }

  // Generate PDF và lưu file
  async generateAndSaveBookingPDF(booking, outputPath) {
    try {
      const pdfBuffer = await this.generateBookingPDF(booking);
      await fs.writeFile(outputPath, pdfBuffer);
      return outputPath;
    } catch (error) {
      console.error('Error saving booking PDF:', error);
      throw new Error('Failed to save booking PDF');
    }
  }
}

// Export singleton instance
module.exports = new PDFService();
