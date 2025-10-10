import axios from 'axios';
import { AlertCircle, Calendar, CheckCircle, Clock, Download, FileText, Filter, Plane, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/MyBookings.css';

const MyBookingsPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyBookings();
  }, [user, navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookings(response.data || []);
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
        filtered = bookings.filter(b => 
          new Date(b.flight?.departure?.time) > now && 
          b.status !== 'cancelled'
        );
        break;
      case 'completed':
        filtered = bookings.filter(b => 
          new Date(b.flight?.departure?.time) <= now || 
          b.status === 'checked_in'
        );
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
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingReference}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchMyBookings();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Có lỗi xảy ra khi hủy đặt vé');
    }
  };

  const handleDownload = (bookingReference) => {
    window.print();
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
    if (!booking.flight?.departure?.time) return false;
    const departureTime = new Date(booking.flight.departure.time);
    const now = new Date();
    const hoursDiff = (departureTime - now) / (1000 * 60 * 60);
    return booking.status === 'confirmed' && hoursDiff > 0 && hoursDiff <= 24;
  };

  const canCancel = (booking) => {
    if (!booking.flight?.departure?.time) return false;
    const departureTime = new Date(booking.flight.departure.time);
    const now = new Date();
    return booking.status === 'confirmed' && departureTime > now;
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
                Sắp bay ({bookings.filter(b => 
                  new Date(b.flight?.departure?.time) > new Date() && 
                  b.status !== 'cancelled'
                ).length})
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Đã bay ({bookings.filter(b => 
                  new Date(b.flight?.departure?.time) <= new Date() || 
                  b.status === 'checked_in'
                ).length})
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

                return (
                  <div key={booking._id} className="booking-card">
                    {/* Card Header */}
                    <div className="booking-card-header">
                      <div className="booking-reference">
                        <span className="reference-label">Mã đặt vé</span>
                        <span className="reference-value">{booking.bookingReference}</span>
                      </div>
                      <div className={`booking-status ${statusInfo.color}`}>
                        <StatusIcon size={16} />
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>

                    {/* Flight Info */}
                    <div className="flight-info">
                      <div className="route-section">
                        <div className="airport-info">
                          <div className="airport-code">
                            {booking.flight?.departure?.airport || 'N/A'}
                          </div>
                          <div className="time">{formatTime(booking.flight?.departure?.time)}</div>
                          <div className="date">{formatDate(booking.flight?.departure?.time)}</div>
                        </div>

                        <div className="route-divider">
                          <div className="plane-icon-wrapper">
                            <Plane size={24} />
                          </div>
                          <div className="flight-number">
                            {booking.flight?.flightNumber || 'N/A'}
                          </div>
                        </div>

                        <div className="airport-info">
                          <div className="airport-code">
                            {booking.flight?.arrival?.airport || 'N/A'}
                          </div>
                          <div className="time">{formatTime(booking.flight?.arrival?.time)}</div>
                          <div className="date">{formatDate(booking.flight?.arrival?.time)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="booking-details">
                      <div className="detail-row">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span className="detail-label">Ngày đặt:</span>
                          <span className="detail-value">{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="detail-item">
                          <FileText size={16} />
                          <span className="detail-label">Hành khách:</span>
                          <span className="detail-value">{booking.passengers?.length || 0} người</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <span className="detail-label">Tổng tiền:</span>
                          <span className="detail-value price">{formatPrice(booking.totalAmount)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Thanh toán:</span>
                          <span className={`payment-status ${booking.paymentStatus}`}>
                            {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                             booking.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="booking-actions">
                      <button 
                        className="btn-action btn-download"
                        onClick={() => handleDownload(booking.bookingReference)}
                      >
                        <Download size={16} />
                        Tải vé
                      </button>

                      {canCheckIn(booking) && (
                        <button 
                          className="btn-action btn-checkin"
                          onClick={() => handleCheckIn(booking.bookingReference)}
                        >
                          <CheckCircle size={16} />
                          Check-in
                        </button>
                      )}

                      {canCancel(booking) && (
                        <button 
                          className="btn-action btn-cancel"
                          onClick={() => handleCancel(booking.bookingReference)}
                        >
                          <XCircle size={16} />
                          Hủy vé
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyBookingsPage;
