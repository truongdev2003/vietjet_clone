import { CheckCircle, CreditCard, Search, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import bookingService from '../services/bookingService';

const ManageBooking = () => {
  const [searchData, setSearchData] = useState({
    bookingReference: '',
    email: ''
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Use bookingService to get booking by code
      const response = await bookingService.getBookingByCode(
        searchData.bookingReference,
        searchData.email
      );
      
      // Handle nested response structure from backend
      const bookingData = response.data?.booking || response.booking || response.data || response;
      
      // Verify email match (use contact or contactInfo)
      const bookingEmail = bookingData.contact?.email || bookingData.contactInfo?.email;
      if (!bookingEmail || bookingEmail.toLowerCase() !== searchData.email.toLowerCase()) {
        setError('Email không khớp với thông tin đặt vé');
        setBooking(null);
        return;
      }
      
      setBooking(bookingData);
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

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Use bookingService for online check-in
      const response = await bookingService.onlineCheckin(booking._id);
      
      setBooking(response.data?.booking || response.booking);
      setSuccessMessage('Check-in thành công!');
    } catch (error) {
      console.error('Check-in error:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt vé này?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Use bookingService to cancel booking
      const response = await bookingService.cancelBooking(booking._id, 'Khách hàng yêu cầu hủy');
      
      setBooking(response.data?.booking || response.booking);
      setSuccessMessage('Hủy đặt vé thành công!');
    } catch (error) {
      console.error('Cancel error:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đặt vé');
    } finally {
      setLoading(false);
    }
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'checked_in': return 'Đã check-in';
      default: return status;
    }
  };

  const canCheckIn = booking && booking.status === 'confirmed' && !booking.checkedIn;
  const canCancel = booking && booking.status === 'confirmed';

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-5 py-5">
        {/* Search Section */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h2 className="text-gray-800 mb-5 flex items-center gap-2 text-xl font-semibold">
            <Search size={24} />
            Quản lý đặt vé
          </h2>
        
        <form onSubmit={handleSearch} className="flex gap-4 items-end flex-col md:flex-row">
          <div className="flex flex-col flex-1 w-full">
            <label className="text-sm text-gray-500 mb-1.5 font-medium">Mã đặt vé</label>
            <input
              type="text"
              value={searchData.bookingReference}
              onChange={(e) => handleInputChange('bookingReference', e.target.value.toUpperCase())}
              placeholder="VD: VJ123ABC"
              required
              className="px-3 py-3 border-2 border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div className="flex flex-col flex-1 w-full">
            <label className="text-sm text-gray-500 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={searchData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              required
              className="px-3 py-3 border-2 border-gray-300 rounded-md text-base transition-colors focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none px-6 py-3 rounded-md text-base font-semibold cursor-pointer flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none w-full md:w-auto"
          >
            <Search size={16} />
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-4 rounded-lg mb-5 flex items-center gap-2">
          <XCircle size={20} />
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-4 rounded-lg mb-5 flex items-center gap-2">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* Booking Result */}
      {booking && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          {/* Booking Header */}
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
            <h3 className="text-primary-500 text-2xl m-0 font-bold">{booking.bookingReference}</h3>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' : ''
            }`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          {/* Flight Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              {booking.flight.departure.airport.city} → {booking.flight.arrival.airport.city}
            </div>
            <div className="text-gray-500 text-sm">
              {booking.flight.flightNumber} • {formatDate(booking.flight.departure.time)} • 
              {formatTime(booking.flight.departure.time)} - {formatTime(booking.flight.arrival.time)}
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-gray-800 mb-3 flex items-center gap-2 font-semibold">
                <User size={16} />
                Thông tin liên hệ
              </h4>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="text-gray-800 font-medium">{booking.contactInfo.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">Điện thoại</span>
                <span className="text-gray-800 font-medium">{booking.contactInfo.phone}</span>
              </div>
            </div>

            <div>
              <h4 className="text-gray-800 mb-3 flex items-center gap-2 font-semibold">
                <CreditCard size={16} />
                Thanh toán
              </h4>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Tổng tiền</span>
                <span className="text-gray-800 font-medium">{formatPrice(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">Trạng thái</span>
                <span className="text-gray-800 font-medium">
                  {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 
                   booking.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>

          {/* Passengers List */}
          <h4 className="text-gray-800 mb-3 flex items-center gap-2 font-semibold">
            <User size={16} />
            Hành khách ({booking.passengers.length})
          </h4>
          <div className="mt-4">
            {booking.passengers.map((passenger, index) => (
              <div key={index} className="bg-gray-50 rounded-md p-3 mb-2">
                <div className="font-semibold text-gray-800 mb-1">
                  {passenger.title} {passenger.firstName} {passenger.lastName}
                </div>
                <div className="text-gray-500 text-xs">
                  {passenger.seatNumber && `Ghế: ${passenger.seatNumber} • `}
                  Hạng: {passenger.seatClass === 'economy' ? 'Phổ thông' : 'Thương gia'}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 flex-col md:flex-row">
            {canCheckIn && (
              <button 
                onClick={handleCheckIn}
                disabled={loading}
                className="px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-all bg-gradient-to-br from-red-500 to-red-600 text-white border-none hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Check-in trực tuyến
              </button>
            )}
            
            <button 
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-all bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-600"
            >
              In vé
            </button>
            
            {canCancel && (
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-all bg-white text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Hủy đặt vé
              </button>
            )}
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
};

export default ManageBooking;
