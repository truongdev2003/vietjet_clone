import { AlertCircle, ArrowLeft, Check, Clock, Download, Mail, Phone, Plane, Printer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import axiosInstance from '../config/axios';
import bookingService from '../services/bookingService';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Get guest email from navigation state (when coming from lookup page)
  const guestEmail = location.state?.guestEmail;

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/bookings/${id}`);
      setBooking(response.data.data);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError(err.response?.data?.error || 'Không thể tải thông tin booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      await axiosInstance.post(`/bookings/${id}/cancel`);
      
      // Refresh booking data
      await fetchBookingDetail();
      setShowCancelModal(false);
      
      alert('Đã hủy booking thành công!');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.error || 'Không thể hủy booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!booking?.bookingReference) return;
    
    try {
      setDownloading(true);
      
      // Use guest download if email is available (from lookup page)
      if (guestEmail) {
        await bookingService.downloadGuestBookingPDF(booking.bookingReference, guestEmail);
      } else {
        // Use authenticated download for logged-in users
        await bookingService.downloadBookingPDF(booking.bookingReference);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(err.response?.data?.error || 'Không thể tải vé điện tử. Vui lòng thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        icon: Clock, 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: 'Chờ thanh toán',
        description: 'Vui lòng hoàn tất thanh toán để xác nhận booking'
      },
      confirmed: { 
        icon: Check, 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: 'Đã xác nhận',
        description: 'Booking đã được xác nhận và thanh toán thành công'
      },
      cancelled: { 
        icon: X, 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: 'Đã hủy',
        description: 'Booking đã bị hủy'
      },
      completed: { 
        icon: Check, 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        label: 'Hoàn thành',
        description: 'Chuyến bay đã hoàn thành'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-5 py-20 text-center">
          <div className="text-gray-600">Đang tải...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-5 py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Không tìm thấy booking</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="bg-[#EE0033] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Quay lại danh sách booking
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-5">
          {/* Back Button */}
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#EE0033] mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách booking
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Chi tiết booking
                </h1>
                <div className="text-gray-600">
                  Mã booking: <span className="font-semibold text-gray-800">{booking.bookingReference}</span>
                </div>
              </div>
              <div className={`${statusConfig.bg} ${statusConfig.text} px-4 py-2 rounded-lg flex items-center gap-2`}>
                <StatusIcon size={20} />
                <span className="font-semibold">{statusConfig.label}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">{statusConfig.description}</p>
            </div>
          </div>

          {/* Flight Details */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Plane size={24} />
              Thông tin chuyến bay
            </h2>

            {booking.flights?.map((flightBooking, index) => {
              const flight = flightBooking.flight;
              if (!flight) return null;

              return (
                <div key={index} className={`${index > 0 ? 'mt-4 pt-4 border-t border-gray-200' : ''}`}>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {/* Route */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <div className="text-3xl font-bold text-gray-800">
                          {formatTime(flight.route?.departure?.time)}
                        </div>
                        <div className="text-lg font-semibold text-gray-700 mt-1">
                          {flight.route?.departure?.airport?.location?.city?.vi || flight.route?.departure?.airport?.name?.vi}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(flight.route?.departure?.time)}
                        </div>
                      </div>

                      <div className="flex-1 text-center px-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="h-px bg-gray-400 flex-1"></div>
                          <Plane size={24} className="text-gray-400" />
                          <div className="h-px bg-gray-400 flex-1"></div>
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                          {flight.flightNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {flightBooking.type || 'Economy'}
                        </div>
                      </div>

                      <div className="flex-1 text-right">
                        <div className="text-3xl font-bold text-gray-800">
                          {formatTime(flight.route?.arrival?.time)}
                        </div>
                        <div className="text-lg font-semibold text-gray-700 mt-1">
                          {flight.route?.arrival?.airport?.location?.city?.vi || flight.route?.arrival?.airport?.name?.vi}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(flight.route?.arrival?.time)}
                        </div>
                      </div>
                    </div>

                    {/* Passengers */}
                    <div className="border-t border-gray-300 pt-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Hành khách</h3>
                      <div className="grid gap-3">
                        {flightBooking.passengers?.map((passenger, pIndex) => (
                          <div key={pIndex} className="bg-white rounded-lg p-3 flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#EE0033] rounded-full flex items-center justify-center text-white font-semibold">
                              {pIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                {passenger.title} {passenger.firstName} {passenger.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {passenger.document?.type === 'passport' ? 'Hộ chiếu' : 'CCCD/CMND'}: {passenger.document?.number}
                              </div>
                            </div>
                            {passenger.seatNumber && (
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Ghế</div>
                                <div className="font-semibold text-gray-800">{passenger.seatNumber}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin liên hệ</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="text-gray-400" size={20} />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-semibold text-gray-800">{booking.contactInfo?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400" size={20} />
                <div>
                  <div className="text-sm text-gray-500">Số điện thoại</div>
                  <div className="font-semibold text-gray-800">{booking.contactInfo?.phone}</div>
                </div>
              </div>
            </div>
            
            {/* Email Confirmation Status */}
            {booking.notifications?.bookingConfirmation?.sent && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-green-600">
                  <Check size={18} className="flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Email xác nhận đã được gửi</span>
                    {booking.notifications.bookingConfirmation.sentAt && (
                      <span className="text-gray-500 ml-2">
                        lúc {new Date(booking.notifications.bookingConfirmation.sentAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin thanh toán</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Giá vé cơ bản</span>
                <span className="font-semibold">{formatPrice(booking.payment?.breakdown?.baseFare || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Thuế</span>
                <span className="font-semibold">{formatPrice(booking.payment?.breakdown?.taxes || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Phí dịch vụ</span>
                <span className="font-semibold">{formatPrice(booking.payment?.breakdown?.fees || 0)}</span>
              </div>
              
              {booking.payment?.breakdown?.services > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dịch vụ bổ sung</span>
                  <span className="font-semibold">{formatPrice(booking.payment?.breakdown?.services || 0)}</span>
                </div>
              )}
              
              {booking.payment?.breakdown?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold">-{formatPrice(booking.payment?.breakdown?.discount || 0)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-600">Trạng thái</span>
                <span className={`font-semibold ${
                  booking.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {booking.payment?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>

              {booking.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày thanh toán</span>
                  <span className="font-semibold">{formatDate(booking.payment.paidAt)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-800">Tổng cộng</span>
                  <span className="font-bold text-[#EE0033]">
                    {formatPrice(booking.payment?.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadTicket}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Download size={20} />
                {downloading ? 'Đang tải...' : 'Tải vé điện tử (PDF)'}
              </button>
              
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                <Printer size={20} />
                In vé
              </button>

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="md:col-span-2 flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                >
                  <X size={20} />
                  Hủy booking
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận hủy booking</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy booking <strong>{booking.bookingReference}</strong>?
              {booking.payment?.status === 'paid' && (
                <span className="block mt-2 text-yellow-700">
                  ⚠️ Số tiền sẽ được hoàn lại trong vòng 7-10 ngày làm việc.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Không
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400"
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default BookingDetailPage;
