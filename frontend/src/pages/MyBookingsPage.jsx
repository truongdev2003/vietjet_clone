import { AlertCircle, Calendar, CheckCircle, ChevronDown, ChevronUp, Clock, CreditCard, Download, FileText, Filter, Plane, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import bookingService from '../services/bookingService';
import '../styles/MyBookings.css';
import '../styles/MyBookingsAccordion.css';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [downloadingBookings, setDownloadingBookings] = useState(new Set()); // Track which bookings are being downloaded
  const [retryingPayment, setRetryingPayment] = useState(new Set()); // Track which bookings are retrying payment
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyBookings();
  }, [user, navigate, pagination.currentPage]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getMyBookings({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      });
      console.log('Fetched bookings:', response);
      // Response structure: { success, message, data: { bookings, pagination } }
      setBookings(response.data?.bookings || []);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
      setError('Không thể tải danh sách đặt vé');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        filtered = bookings.filter(b => {
          const firstFlight = b.flights?.[0]?.flight;
          const departureTime = firstFlight?.route?.departure?.time;
          return departureTime && 
                 new Date(departureTime) > now && 
                 b.status !== 'cancelled';
        });
        break;
      case 'completed':
        filtered = bookings.filter(b => {
          const firstFlight = b.flights?.[0]?.flight;
          const departureTime = firstFlight?.route?.departure?.time;
          return (departureTime && new Date(departureTime) <= now) || 
                 b.status === 'checked_in';
        });
        break;
      case 'cancelled':
        filtered = bookings.filter(b => b.status === 'cancelled');
        break;
      default:
        filtered = bookings;
    }

    setFilteredBookings(filtered);
  };

  const handleCheckIn = async (bookingReference) => {
    navigate('/checkin');
  };

  const handleCancel = async (bookingReference) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt vé này?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingReference);
      fetchMyBookings();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Có lỗi xảy ra khi hủy đặt vé');
    }
  };

  const handleRetryPayment = async (bookingId, bookingReference) => {
    if (!window.confirm('Bạn có muốn thanh toán lại cho booking này?')) {
      return;
    }

    try {
      setRetryingPayment(prev => new Set([...prev, bookingId]));
      
      const response = await bookingService.retryPayment(bookingId);
      
      // Redirect to payment URL
      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        alert('Không thể tạo link thanh toán. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Retry payment error:', err);
      alert('Không thể thanh toán lại: ' + (err.response?.data?.message || err.message || 'Lỗi không xác định'));
    } finally {
      setRetryingPayment(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const handleDownload = async (bookingReference) => {
    if (!bookingReference) return;
    
    try {
      // Add to downloading set
      setDownloadingBookings(prev => new Set(prev).add(bookingReference));
      
      await bookingService.downloadBookingPDF(bookingReference);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(err.response?.data?.error || 'Không thể tải vé điện tử. Vui lòng thử lại sau.');
    } finally {
      // Remove from downloading set
      setDownloadingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingReference);
        return newSet;
      });
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Đã xác nhận', color: 'status-confirmed', icon: CheckCircle };
      case 'checked_in':
        return { text: 'Đã check-in', color: 'status-checked-in', icon: CheckCircle };
      case 'cancelled':
        return { text: 'Đã hủy', color: 'status-cancelled', icon: XCircle };
      default:
        return { text: status, color: 'status-default', icon: Clock };
    }
  };

  const canCheckIn = (booking) => {
    const firstFlight = booking.flights?.[0]?.flight;
    const departureTime = firstFlight?.route?.departure?.time;
    if (!departureTime) return false;
    
    const departureDate = new Date(departureTime);
    const now = new Date();
    const hoursDiff = (departureDate - now) / (1000 * 60 * 60);
    return booking.status === 'confirmed' && hoursDiff > 0 && hoursDiff <= 24;
  };

  const canCancel = (booking) => {
    const firstFlight = booking.flights?.[0]?.flight;
    const departureTime = firstFlight?.route?.departure?.time;
    if (!departureTime) return false;
    
    const departureDate = new Date(departureTime);
    const now = new Date();
    return booking.status === 'confirmed' && departureDate > now;
  };

  const toggleBooking = (bookingId) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  return (
    <>
      <Header />
      <div className="my-bookings-page">
        {/* Hero Section */}
        <div className="bookings-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <FileText size={48} strokeWidth={2} />
            </div>
            <h1>Chuyến bay của tôi</h1>
            <p>Quản lý tất cả các chuyến bay đã đặt</p>
          </div>
        </div>

        <div className="bookings-container">
          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-header">
              <Filter size={20} />
              <span>Lọc theo</span>
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                Tất cả ({bookings.length})
              </button>
              <button
                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilter('upcoming')}
              >
                Sắp bay ({bookings.filter(b => {
                  const firstFlight = b.flights?.[0]?.flight;
                  const departureTime = firstFlight?.route?.departure?.time;
                  return departureTime && new Date(departureTime) > new Date() && b.status !== 'cancelled';
                }).length})
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Đã bay ({bookings.filter(b => {
                  const firstFlight = b.flights?.[0]?.flight;
                  const departureTime = firstFlight?.route?.departure?.time;
                  return (departureTime && new Date(departureTime) <= new Date()) || b.status === 'checked_in';
                }).length})
              </button>
              <button
                className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilter('cancelled')}
              >
                Đã hủy ({bookings.filter(b => b.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách đặt vé...</p>
            </div>
          ) : error ? (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="no-bookings">
              <FileText size={64} />
              <h3>Không có chuyến bay nào</h3>
              <p>
                {filter === 'all' 
                  ? 'Bạn chưa có đặt vé nào. Hãy đặt chuyến bay đầu tiên!'
                  : `Không có chuyến bay ${
                      filter === 'upcoming' ? 'sắp tới' : 
                      filter === 'completed' ? 'đã hoàn thành' : 'đã hủy'
                    }`
                }
              </p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/')}
              >
                Đặt vé ngay
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                const StatusIcon = statusInfo.icon;
                const firstFlight = booking.flights?.[0]?.flight;
                const isExpanded = expandedBookings.has(booking._id);

                return (
                  <div key={booking._id} className={`booking-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    {/* Compact Header - Always visible */}
                    <div className="booking-card-compact" onClick={() => toggleBooking(booking._id)}>
                      <div className="compact-left">
                        <div className="booking-ref-compact">
                          <span className="ref-label">Mã vé:</span>
                          <span className="ref-value">{booking.bookingReference}</span>
                        </div>
                        <div className="route-compact">
                          <span className="airport-code-small">
                            {firstFlight?.route?.departure?.airport?.code?.iata}
                          </span>
                          <Plane size={14} className="plane-small" />
                          <span className="airport-code-small">
                            {firstFlight?.route?.arrival?.airport?.code?.iata}
                          </span>
                          <span className="flight-time-compact">
                            {formatDate(firstFlight?.route?.departure?.time)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="compact-right">
                        <div className={`status-badge ${statusInfo.color}`}>
                          <StatusIcon size={14} />
                          <span>{statusInfo.text}</span>
                        </div>
                        <div className="price-compact">
                          {formatPrice(booking.payment?.totalAmount || 0)}
                        </div>
                        <button className="expand-btn">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="booking-card-expanded">
                        {/* Flight Details */}
                        <div className="flight-details-section">
                          <h4 className="section-title">
                            <Plane size={16} />
                            Thông tin chuyến bay
                          </h4>
                          <div className="flight-route">
                            <div className="route-point">
                              <div className="airport-code-large">
                                {firstFlight?.route?.departure?.airport?.code?.iata}
                              </div>
                              <div className="airport-name-small">
                                {firstFlight?.route?.departure?.airport?.name?.vi}
                              </div>
                              <div className="time-large">
                                {formatTime(firstFlight?.route?.departure?.time)}
                              </div>
                              <div className="date-small">
                                {formatDate(firstFlight?.route?.departure?.time)}
                              </div>
                              {firstFlight?.route?.departure?.terminal && (
                                <div className="terminal-badge">
                                  Terminal {firstFlight.route.departure.terminal}
                                </div>
                              )}
                            </div>

                            <div className="route-middle">
                              <div className="flight-line"></div>
                              <div className="flight-info-middle">
                                <div className="flight-number-badge">
                                  {firstFlight?.flightNumber}
                                </div>
                                {firstFlight?.route?.duration?.scheduled && (
                                  <div className="duration-text">
                                    {Math.floor(firstFlight.route.duration.scheduled / 60)}h{' '}
                                    {firstFlight.route.duration.scheduled % 60}m
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="route-point">
                              <div className="airport-code-large">
                                {firstFlight?.route?.arrival?.airport?.code?.iata}
                              </div>
                              <div className="airport-name-small">
                                {firstFlight?.route?.arrival?.airport?.name?.vi}
                              </div>
                              <div className="time-large">
                                {formatTime(firstFlight?.route?.arrival?.time)}
                              </div>
                              <div className="date-small">
                                {formatDate(firstFlight?.route?.arrival?.time)}
                              </div>
                              {firstFlight?.route?.arrival?.terminal && (
                                <div className="terminal-badge">
                                  Terminal {firstFlight.route.arrival.terminal}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Passengers */}
                        <div className="passengers-section">
                          <h4 className="section-title">
                            <User size={16} />
                            Hành khách ({booking.flights?.[0]?.passengers?.length || 0})
                          </h4>
                          <div className="passengers-list">
                            {booking.flights?.[0]?.passengers?.map((passenger, idx) => (
                              <div key={passenger._id || idx} className="passenger-item">
                                <div className="passenger-name">
                                  {passenger.title} {passenger.firstName} {passenger.lastName}
                                </div>
                                <div className="passenger-details">
                                  <span className="passenger-type">{passenger.passengerType}</span>
                                  {passenger.ticket?.seatNumber && (
                                    <span className="seat-number">Ghế: {passenger.ticket.seatNumber}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="payment-section">
                          <h4 className="section-title">
                            <Calendar size={16} />
                            Thông tin thanh toán
                          </h4>
                          <div className="payment-grid">
                            <div className="payment-item">
                              <span className="label">Ngày đặt:</span>
                              <span className="value">{formatDate(booking.createdAt)}</span>
                            </div>
                            <div className="payment-item">
                              <span className="label">Phương thức:</span>
                              <span className="value">
                                {booking.payment?.method === 'momo' ? 'MoMo' :
                                 booking.payment?.method === 'bank_transfer' ? 'Chuyển khoản' :
                                 booking.payment?.method === 'credit_card' ? 'Thẻ tín dụng' : 'N/A'}
                              </span>
                            </div>
                            <div className="payment-item">
                              <span className="label">Trạng thái:</span>
                              <span className={`value status-${booking.payment?.status}`}>
                                {booking.payment?.status === 'paid' ? 'Đã thanh toán' :
                                 booking.payment?.status === 'pending' ? 'Chờ thanh toán' :
                                 booking.payment?.status === 'refunded' ? 'Đã hoàn tiền' : 'N/A'}
                              </span>
                            </div>
                            <div className="payment-item">
                              <span className="label">Tổng tiền:</span>
                              <span className="value price-highlight">
                                {formatPrice(booking.payment?.totalAmount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="booking-actions-expanded">
                          {/* Nút Thanh toán lại cho booking pending/failed */}
                          {(booking.status === 'pending' || booking.status === 'failed') && 
                           booking.payment?.status !== 'paid' && (
                            <button
                              className="btn-action btn-retry-payment"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetryPayment(booking._id, booking.bookingReference);
                              }}
                              disabled={retryingPayment.has(booking._id)}
                              style={{
                                opacity: retryingPayment.has(booking._id) ? 0.6 : 1,
                                cursor: retryingPayment.has(booking._id) ? 'not-allowed' : 'pointer',
                                background: '#FF6B00',
                                color: 'white'
                              }}
                            >
                              <CreditCard size={16} />
                              {retryingPayment.has(booking._id) ? 'Đang xử lý...' : 'Thanh toán lại'}
                            </button>
                          )}

                          <button
                            className="btn-action btn-download"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(booking.bookingReference);
                            }}
                            disabled={downloadingBookings.has(booking.bookingReference)}
                            style={{
                              opacity: downloadingBookings.has(booking.bookingReference) ? 0.6 : 1,
                              cursor: downloadingBookings.has(booking.bookingReference) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Download size={16} />
                            {downloadingBookings.has(booking.bookingReference) ? 'Đang tải...' : 'Tải vé'}
                          </button>

                          {canCheckIn(booking) && (
                            <button
                              className="btn-action btn-checkin"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckIn(booking.bookingReference);
                              }}
                            >
                              <CheckCircle size={16} />
                              Check-in
                            </button>
                          )}

                          {canCancel(booking) && (
                            <button
                              className="btn-action btn-cancel"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(booking.bookingReference);
                              }}
                            >
                              <XCircle size={16} />
                              Hủy vé
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && filteredBookings.length > 0 && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                « Trước
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-page ${page === pagination.currentPage ? 'active' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                Sau »
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyBookingsPage;
