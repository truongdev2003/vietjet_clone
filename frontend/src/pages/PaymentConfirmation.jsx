import { Check, Download, Home, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import bookingService from '../services/bookingService';
import '../styles/PaymentConfirmation.css';

const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment info from URL params
        const transactionId = searchParams.get('transactionId');
        const bookingId = searchParams.get('bookingId');
        const paymentStatus = searchParams.get('status');

        if (!transactionId || !bookingId) {
          setStatus('failed');
          setError('Thông tin thanh toán không hợp lệ');
          return;
        }

        // Verify payment with backend
        // const response = await paymentService.verifyPayment(transactionId);
        
        // For now, use the status from URL
        if (paymentStatus === 'success') {
          // Fetch booking details
          const booking = await bookingService.getBookingById(bookingId);
          setBookingData(booking);
          setStatus('success');
        } else {
          setStatus('failed');
          setError('Thanh toán không thành công. Vui lòng thử lại.');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setError(err.message || 'Có lỗi xảy ra khi xác thực thanh toán');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    window.print();
  };

  const handleGoToBookings = () => {
    navigate('/my-bookings');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetryPayment = () => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      navigate(`/booking?id=${bookingId}`);
    } else {
      navigate('/');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang xác thực thanh toán...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {status === 'success' ? (
          <div className="payment-confirmation-success">
            {/* Success Icon */}
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <Check size={64} strokeWidth={3} />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-gray-800 mb-3 text-center">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 text-lg mb-8 text-center">
              Cảm ơn quý khách đã đặt vé. Vé điện tử đã được gửi đến email của bạn.
            </p>

            {/* Booking Information Card */}
            {bookingData && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-6">
                <div className="border-b pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Thông tin đặt chỗ
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Mã đặt chỗ:</span>
                    <span className="text-3xl font-bold text-red-600">
                      {bookingData.bookingCode || bookingData._id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Chuyến bay</p>
                      <p className="font-semibold text-lg">
                        {bookingData.flight?.flightNumber || 'VJ123'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày bay</p>
                      <p className="font-semibold text-lg">
                        {bookingData.flight?.departureTime 
                          ? new Date(bookingData.flight.departureTime).toLocaleDateString('vi-VN')
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Điểm đi</p>
                      <p className="font-semibold">
                        {bookingData.flight?.departure?.airport?.city || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Điểm đến</p>
                      <p className="font-semibold">
                        {bookingData.flight?.arrival?.airport?.city || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Hành khách</p>
                      <p className="font-semibold">
                        {bookingData.passengers?.length || 0} người
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                      <p className="font-semibold text-xl text-red-600">
                        {(bookingData.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadReceipt}
                className="btn-download"
              >
                <Download size={20} />
                Tải hóa đơn
              </button>
              <button
                onClick={handleGoToBookings}
                className="btn-primary"
              >
                Xem booking của tôi
              </button>
              <button
                onClick={handleGoHome}
                className="btn-secondary"
              >
                <Home size={20} />
                Về trang chủ
              </button>
            </div>

            {/* Important Notes */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                Lưu ý quan trọng
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Vui lòng kiểm tra email để nhận vé điện tử</li>
                <li>• Làm thủ tục check-in online từ 24h trước giờ bay</li>
                <li>• Có mặt tại sân bay trước giờ bay ít nhất 2 tiếng</li>
                <li>• Mang theo giấy tờ tùy thân hợp lệ khi làm thủ tục</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="payment-confirmation-failed">
            {/* Failed Icon */}
            <div className="failed-icon-wrapper">
              <div className="failed-icon">
                <X size={64} strokeWidth={3} />
              </div>
            </div>

            {/* Failed Message */}
            <h1 className="text-4xl font-bold text-gray-800 mb-3 text-center">
              Thanh toán không thành công
            </h1>
            <p className="text-gray-600 text-lg mb-8 text-center">
              {error || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
            </p>

            {/* Error Details */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6 max-w-md mx-auto">
              <h3 className="font-bold text-gray-800 mb-4">
                Có thể do các nguyên nhân sau:
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Thông tin thẻ không chính xác</li>
                <li>• Số dư tài khoản không đủ</li>
                <li>• Kết nối mạng bị gián đoạn</li>
                <li>• Thẻ đã hết hạn hoặc bị khóa</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetryPayment}
                className="btn-primary"
              >
                Thử lại
              </button>
              <button
                onClick={handleGoHome}
                className="btn-secondary"
              >
                <Home size={20} />
                Về trang chủ
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-bold text-yellow-900 mb-3">
                Cần hỗ trợ?
              </h3>
              <p className="text-yellow-800 text-sm mb-2">
                Liên hệ hotline: <strong>1900 1886</strong>
              </p>
              <p className="text-yellow-800 text-sm">
                Email: support@vietjetair.com
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PaymentConfirmation;
