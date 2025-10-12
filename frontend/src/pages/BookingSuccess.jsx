import { Check, Download, Home, Mail, Plane, Printer, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import bookingService from '../services/bookingService';
import '../styles/BookingSuccess.css';

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        if (!bookingId) {
          setError('Không tìm thấy thông tin booking');
          setLoading(false);
          return;
        }

        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'Không thể tải thông tin booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadETicket = async () => {
    try {
      setDownloading(true);
      const bookingRef = booking.bookingReference || booking.bookingCode || booking._id;
      await bookingService.downloadBookingPDF(bookingRef);
    } catch (err) {
      console.error('Error downloading ticket:', err);
      alert(err.response?.data?.error || 'Không thể tải vé điện tử. Vui lòng thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setResendSuccess(false);
      const bookingRef = booking.bookingReference || booking.bookingCode || booking._id;
      const email = booking.contactInfo?.email || booking.passengers?.[0]?.email;
      
      await bookingService.resendBookingConfirmation(bookingRef, email);
      setResendSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error('Error resending email:', err);
      const errorMsg = err.response?.data?.error || 'Không thể gửi lại email. Vui lòng thử lại sau.';
      alert(errorMsg);
    } finally {
      setResending(false);
    }
  };

  const handleCheckIn = () => {
    navigate(`/checkin?booking=${booking.bookingCode || bookingId}`);
  };

  const handleViewBookings = () => {
    navigate('/my-bookings');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải thông tin booking...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Không tìm thấy booking
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              <Home size={20} />
              Về trang chủ
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {/* Success Header */}
        <div className="booking-success-header">
          <div className="success-icon">
            <Check size={48} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Đặt vé thành công!
          </h1>
          <p className="text-gray-600 text-lg">
            Vé điện tử đã được gửi đến email của bạn
          </p>
        </div>

        {/* Booking Code Card */}
        <div className="booking-code-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-600 mb-2">Mã đặt chỗ của bạn</p>
              <h2 className="booking-code">
                {booking.bookingCode || booking._id?.slice(-8).toUpperCase()}
              </h2>
              
              {/* Email sent status */}
              {booking.notifications?.bookingConfirmation?.sent && (
                <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                  <Check size={16} />
                  <span>Email xác nhận đã gửi</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handlePrint} className="btn-icon" title="In">
                <Printer size={20} />
              </button>
              <button 
                onClick={handleDownloadETicket} 
                className="btn-icon" 
                title={downloading ? "Đang tải..." : "Tải xuống vé điện tử"}
                disabled={downloading}
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Flight Information */}
        <div className="booking-details-card">
          <h3 className="section-title">
            <Plane size={24} />
            Thông tin chuyến bay
          </h3>

          <div className="flight-route">
            <div className="route-point">
              <div className="route-city">
                {booking.flight?.departure?.airport?.city || 'N/A'}
              </div>
              <div className="route-code">
                {booking.flight?.departure?.airport?.code?.iata || 
                 booking.flight?.departure?.airport?.code || 'N/A'}
              </div>
              <div className="route-time">
                {formatTime(booking.flight?.departureTime)}
              </div>
            </div>

            <div className="route-arrow">
              <div className="arrow-line"></div>
              <Plane size={24} className="arrow-icon" />
            </div>

            <div className="route-point">
              <div className="route-city">
                {booking.flight?.arrival?.airport?.city || 'N/A'}
              </div>
              <div className="route-code">
                {booking.flight?.arrival?.airport?.code?.iata || 
                 booking.flight?.arrival?.airport?.code || 'N/A'}
              </div>
              <div className="route-time">
                {formatTime(booking.flight?.arrivalTime)}
              </div>
            </div>
          </div>

          <div className="flight-details-grid">
            <div className="detail-item">
              <span className="detail-label">Số hiệu chuyến bay</span>
              <span className="detail-value">{booking.flight?.flightNumber || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày bay</span>
              <span className="detail-value">{formatDate(booking.flight?.departureTime)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hạng vé</span>
              <span className="detail-value">
                {booking.passengers?.[0]?.class === 'economy' ? 'Phổ thông' : 'Thương gia'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trạng thái</span>
              <span className="status-badge status-confirmed">
                {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Passenger Information */}
        <div className="booking-details-card">
          <h3 className="section-title">
            👥 Thông tin hành khách
          </h3>
          <div className="passengers-list">
            {booking.passengers?.map((passenger, index) => (
              <div key={index} className="passenger-item">
                <div className="passenger-number">#{index + 1}</div>
                <div className="passenger-info">
                  <div className="passenger-name">
                    {passenger.title} {passenger.firstName} {passenger.lastName}
                  </div>
                  <div className="passenger-details">
                    <span>📧 {passenger.email || 'N/A'}</span>
                    <span>📱 {passenger.phone || 'N/A'}</span>
                    {passenger.seatNumber && (
                      <span>💺 Ghế {passenger.seatNumber}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="booking-details-card">
          <h3 className="section-title">
            💰 Tổng chi phí
          </h3>
          <div className="payment-summary">
            <div className="payment-row">
              <span>Giá vé cơ bản</span>
              <span>{(booking.payment?.breakdown?.baseFare || 0).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="payment-row">
              <span>Thuế</span>
              <span>{(booking.payment?.breakdown?.taxes || 0).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="payment-row">
              <span>Phí dịch vụ</span>
              <span>{(booking.payment?.breakdown?.fees || 0).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            {booking.payment?.breakdown?.services > 0 && (
              <div className="payment-row">
                <span>Dịch vụ bổ sung (chọn ghế, hành lý...)</span>
                <span>{(booking.payment?.breakdown?.services || 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            {booking.payment?.breakdown?.discount > 0 && (
              <div className="payment-row" style={{ color: '#059669' }}>
                <span>Giảm giá</span>
                <span>-{(booking.payment?.breakdown?.discount || 0).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
            <div className="payment-row payment-total">
              <span>Tổng cộng</span>
              <span>{(booking.payment?.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleCheckIn} className="btn-primary btn-large">
            Làm thủ tục online
          </button>
          <button onClick={handleViewBookings} className="btn-secondary btn-large">
            Xem tất cả booking
          </button>
          <button onClick={() => navigate('/')} className="btn-outline btn-large">
            <Home size={20} />
            Về trang chủ
          </button>
        </div>

        {/* Important Information */}
        <div className="info-card info-warning">
          <h4 className="info-title">
            <Mail size={20} />
            Kiểm tra email của bạn
          </h4>
          <p className="info-text">
            Chúng tôi đã gửi vé điện tử và xác nhận booking đến email{' '}
            <strong>{booking.contactInfo?.email || booking.passengers?.[0]?.email || 'của bạn'}</strong>.
            Vui lòng kiểm tra cả hộp thư spam nếu không thấy email.
          </p>
          
          {resendSuccess && (
            <div style={{
              marginTop: '12px',
              padding: '10px 15px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              ✓ Email xác nhận đã được gửi lại thành công!
            </div>
          )}
          
          <button
            onClick={handleResendEmail}
            disabled={resending}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              backgroundColor: resending ? '#ccc' : '#fff',
              color: resending ? '#666' : '#dc143c',
              border: '2px solid #dc143c',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: resending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!resending) {
                e.currentTarget.style.backgroundColor = '#dc143c';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!resending) {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#dc143c';
              }
            }}
          >
            <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
          </button>
        </div>

        <div className="info-card info-tips">
          <h4 className="info-title">💡 Lưu ý quan trọng</h4>
          <ul className="info-list">
            <li>Làm thủ tục check-in online từ 24 giờ đến 1 giờ trước giờ bay</li>
            <li>Có mặt tại sân bay trước giờ bay ít nhất 2 tiếng (bay nội địa) hoặc 3 tiếng (bay quốc tế)</li>
            <li>Mang theo giấy tờ tùy thân hợp lệ (CMND/CCCD hoặc Hộ chiếu)</li>
            <li>Kiểm tra kỹ hành lý xách tay và ký gửi theo quy định</li>
            <li>Lưu lại mã booking để tra cứu và quản lý chuyến bay</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingSuccess;
