import { AlertCircle, Check, CheckCircle, Clock, MapPin, Plane, Printer, User } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import bookingService from '../services/bookingService';
import checkinService from '../services/checkinService';
import '../styles/CheckIn.css';

const CheckInPage = () => {
  const [step, setStep] = useState(1); // 1: Search, 2: Select Seat, 3: Boarding Pass
  const [searchData, setSearchData] = useState({
    bookingReference: '',
    documentNumber: '' // CCCD/Passport thay vì lastName
  });
  const [booking, setBooking] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [boardingPasses, setBoardingPasses] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get booking by code using bookingService with documentNumber verification
      const bookingResponse = await bookingService.getBookingByCode(
        searchData.bookingReference,
        null, // email
        null, // lastName
        searchData.documentNumber // CCCD/Passport for verification
      );
      
      const bookingData = bookingResponse.data || bookingResponse;
      
      // Backend already verified lastName, no need to check again

      // Check if already checked in
      if (bookingData.status === 'checked_in') {
        setError('Booking này đã được check-in rồi');
        setBooking(null);
        return;
      }

      // Check if booking is confirmed
      if (bookingData.status !== 'confirmed') {
        setError('Booking phải được xác nhận trước khi check-in');
        setBooking(null);
        return;
      }

      setBooking(bookingData);
      setStep(2);
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 404) {
        setError('Không tìm thấy mã đặt vé');
      } else {
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi tìm kiếm');
      }
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelection = (passengerId, seat) => {
    setSelectedSeats(prev => ({
      ...prev,
      [passengerId]: seat
    }));
  };

  const handleCompleteCheckIn = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare seat selections
      const seatSelections = booking.passengers.map(passenger => ({
        passengerId: passenger._id,
        seatNumber: selectedSeats[passenger._id] || null
      }));

      // Perform check-in using checkinService
      const response = await checkinService.performCheckin(
        booking.bookingReference,
        seatSelections
      );

      setBoardingPasses(response.data?.boardingPasses || response.boardingPasses || []);
      setStep(3);
    } catch (error) {
      console.error('Check-in error:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi check-in');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Generate available seats (mock data - should come from API)
  const generateSeats = () => {
    const seats = [];
    const rows = 30;
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    for (let row = 1; row <= rows; row++) {
      for (let col of columns) {
        const seatNumber = `${row}${col}`;
        const isOccupied = Math.random() > 0.7; // Random occupied seats
        const isExit = row === 10 || row === 20;
        
        seats.push({
          number: seatNumber,
          row: row,
          column: col,
          isOccupied: isOccupied,
          isExit: isExit,
          type: row <= 3 ? 'business' : 'economy'
        });
      }
    }
    
    return seats;
  };

  const seats = generateSeats();

  return (
    <div className="checkin-page">
      <Header />
      
      <div className="checkin-container">
        {/* Progress Steps */}
        <div className="checkin-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">{step > 1 ? <Check size={20} /> : '1'}</div>
            <div className="step-label">Tra cứu booking</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">{step > 2 ? <Check size={20} /> : '2'}</div>
            <div className="step-label">Chọn ghế</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Thẻ lên máy bay</div>
          </div>
        </div>

        {/* Step 1: Search Booking */}
        {step === 1 && (
          <div className="checkin-step-content">
            <div className="search-section">
              <div className="section-icon">
                <Plane size={48} />
              </div>
              <h1>Check-in Online</h1>
              <p className="section-description">
                Nhập mã đặt vé và họ của hành khách để bắt đầu check-in
              </p>

              <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Mã đặt vé
                  </label>
                  <input
                    type="text"
                    value={searchData.bookingReference}
                    onChange={(e) => setSearchData({ ...searchData, bookingReference: e.target.value.toUpperCase() })}
                    placeholder="VD: VJ123456"
                    required
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <User size={18} />
                    Số CCCD/Passport
                  </label>
                  <input
                    type="text"
                    value={searchData.documentNumber}
                    onChange={(e) => setSearchData({ ...searchData, documentNumber: e.target.value })}
                    placeholder="VD: 001234567890"
                    required
                    className="input-field"
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                </button>
              </form>

              <div className="checkin-info">
                <h3><Clock size={20} /> Thời gian check-in</h3>
                <ul>
                  <li>Check-in online mở từ 24 giờ đến 1 giờ trước giờ khởi hành</li>
                  <li>Vui lòng có mặt tại cổng ít nhất 40 phút trước giờ bay</li>
                  <li>Đối với chuyến bay quốc tế: 60 phút trước giờ bay</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Seat Selection */}
        {step === 2 && booking && (
          <div className="checkin-step-content">
            <div className="flight-info-card">
              <h2>Thông tin chuyến bay</h2>
              <div className="flight-route">
                <div className="route-point">
                  <div className="airport-code">{booking.flight?.route?.departure?.airport?.code?.iata}</div>
                  <div className="airport-name">{booking.flight?.route?.departure?.airport?.name?.vi}</div>
                  <div className="flight-time">
                    {formatTime(booking.flight?.route?.departure?.time)}
                    <span className="flight-date">{formatDate(booking.flight?.route?.departure?.time)}</span>
                  </div>
                </div>
                
                <div className="route-line">
                  <Plane size={24} />
                </div>
                
                <div className="route-point">
                  <div className="airport-code">{booking.flight?.route?.arrival?.airport?.code?.iata}</div>
                  <div className="airport-name">{booking.flight?.route?.arrival?.airport?.name?.vi}</div>
                  <div className="flight-time">
                    {formatTime(booking.flight?.route?.arrival?.time)}
                    <span className="flight-date">{formatDate(booking.flight?.route?.arrival?.time)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flight-number">
                Chuyến bay: {booking.flight?.flightNumber}
              </div>
            </div>

            <div className="passengers-section">
              <h2>Chọn ghế cho hành khách</h2>
              <div className="passengers-list">
                {booking.passengers.map((passenger, index) => (
                  <div key={index} className="passenger-card">
                    <div className="passenger-info">
                      <User size={20} />
                      <span>{passenger.title} {passenger.firstName} {passenger.lastName}</span>
                    </div>
                    <div className="seat-selector">
                      <label>Ghế đã chọn:</label>
                      <input
                        type="text"
                        value={selectedSeats[passenger._id] || ''}
                        onChange={(e) => handleSeatSelection(passenger._id, e.target.value)}
                        placeholder="VD: 12A"
                        className="seat-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="seat-map-section">
              <h3>Sơ đồ ghế ngồi</h3>
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="seat-demo available"></div>
                  <span>Còn trống</span>
                </div>
                <div className="legend-item">
                  <div className="seat-demo occupied"></div>
                  <span>Đã đặt</span>
                </div>
                <div className="legend-item">
                  <div className="seat-demo selected"></div>
                  <span>Bạn đã chọn</span>
                </div>
                <div className="legend-item">
                  <div className="seat-demo exit"></div>
                  <span>Lối thoát</span>
                </div>
              </div>

              <div className="seat-map">
                <div className="cockpit">Buồng lái</div>
                <div className="seat-grid">
                  {seats.reduce((rows, seat) => {
                    const rowIndex = seat.row - 1;
                    if (!rows[rowIndex]) rows[rowIndex] = [];
                    rows[rowIndex].push(seat);
                    return rows;
                  }, []).map((rowSeats, rowIndex) => (
                    <div key={rowIndex} className="seat-row">
                      <div className="row-number">{rowSeats[0].row}</div>
                      {rowSeats.map((seat, seatIndex) => (
                        <button
                          key={seatIndex}
                          className={`seat ${seat.isOccupied ? 'occupied' : 'available'} ${
                            seat.isExit ? 'exit' : ''
                          } ${
                            Object.values(selectedSeats).includes(seat.number) ? 'selected' : ''
                          }`}
                          onClick={() => {
                            if (!seat.isOccupied && booking.passengers.length > 0) {
                              handleSeatSelection(booking.passengers[0]._id, seat.number);
                            }
                          }}
                          disabled={seat.isOccupied}
                        >
                          {seat.column}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                Quay lại
              </button>
              <button
                className="btn-primary"
                onClick={handleCompleteCheckIn}
                disabled={loading || booking.passengers.some(p => !selectedSeats[p._id])}
              >
                {loading ? 'Đang xử lý...' : 'Hoàn tất check-in'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Boarding Pass */}
        {step === 3 && (
          <div className="checkin-step-content boarding-pass-section">
            <div className="success-message">
              <CheckCircle size={48} />
              <h1>Check-in thành công!</h1>
              <p>Thẻ lên máy bay của bạn đã sẵn sàng</p>
            </div>

            <div className="boarding-passes">
              {booking.passengers.map((passenger, index) => (
                <div key={index} className="boarding-pass">
                  <div className="boarding-pass-header">
                    <div className="airline-logo">
                      <span className="logo-text">Vietjet Air</span>
                    </div>
                    <div className="pass-title">BOARDING PASS</div>
                  </div>

                  <div className="boarding-pass-body">
                    <div className="passenger-details">
                      <div className="detail-group">
                        <label>Passenger Name</label>
                        <div className="value large">{passenger.title} {passenger.firstName} {passenger.lastName}</div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-group">
                          <label>From</label>
                          <div className="value">{booking.flight?.route?.departure?.airport?.code?.iata}</div>
                        </div>
                        <div className="detail-group">
                          <label>To</label>
                          <div className="value">{booking.flight?.route?.arrival?.airport?.code?.iata}</div>
                        </div>
                        <div className="detail-group">
                          <label>Flight</label>
                          <div className="value">{booking.flight?.flightNumber}</div>
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-group">
                          <label>Date</label>
                          <div className="value">{formatDate(booking.flight?.route?.departure?.time)}</div>
                        </div>
                        <div className="detail-group">
                          <label>Boarding Time</label>
                          <div className="value">{formatTime(booking.flight?.route?.departure?.time)}</div>
                        </div>
                        <div className="detail-group">
                          <label>Seat</label>
                          <div className="value large">{selectedSeats[passenger._id]}</div>
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-group">
                          <label>Booking Reference</label>
                          <div className="value">{booking.bookingReference}</div>
                        </div>
                        <div className="detail-group">
                          <label>Gate</label>
                          <div className="value">{booking.flight?.route?.departure?.gate || 'TBA'}</div>
                        </div>
                        <div className="detail-group">
                          <label>Class</label>
                          <div className="value">{passenger.seatClass?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="barcode-section">
                      <div className="barcode">
                        <div className="barcode-lines">
                          {[...Array(30)].map((_, i) => (
                            <div key={i} className="barcode-line"></div>
                          ))}
                        </div>
                      </div>
                      <div className="barcode-text">{booking.bookingReference}-{index + 1}</div>
                    </div>
                  </div>

                  <div className="boarding-pass-footer">
                    <div className="footer-notice">
                      <MapPin size={16} />
                      <span>Please arrive at the gate 30 minutes before departure</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => window.location.href = '/'}>
                Về trang chủ
              </button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={20} />
                In thẻ lên máy bay
              </button>
            </div>

            <div className="checkin-info">
              <h3>Lưu ý quan trọng</h3>
              <ul>
                <li>Vui lòng mang theo thẻ căn cước/hộ chiếu khi đến sân bay</li>
                <li>Có mặt tại cổng lên máy bay trước 30 phút so với giờ khởi hành</li>
                <li>Hành lý xách tay không quá 7kg</li>
                <li>Lưu lại hoặc in thẻ lên máy bay này</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CheckInPage;
