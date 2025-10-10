import { Check, FileText, Home, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';

const PaymentResultPage = () => {
  const navigate = useNavigate();
  const { result } = useParams(); // 'success' hoặc 'failed'
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('orderId');
  const txnRef = searchParams.get('txnRef');
  const message = searchParams.get('message');
  const amount = searchParams.get('amount');

  const isSuccess = result === 'success';

  useEffect(() => {
    // Fetch booking info nếu thanh toán thành công
    if (isSuccess && (orderId || txnRef)) {
      fetchBookingInfo();
    } else {
      setLoading(false);
    }
  }, [isSuccess, orderId, txnRef]);

  const fetchBookingInfo = async () => {
    try {
      // Có thể lấy booking từ payment transaction
      // Hoặc từ URL param nếu có
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Không thể tải thông tin booking');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-5 py-20 text-center">
          <div className="text-gray-600">Đang xử lý...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className={`bg-white rounded-xl shadow-lg p-8 text-center ${
          isSuccess ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'
        }`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={48} />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <X className="text-red-600" size={48} />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-bold mb-4 ${
            isSuccess ? 'text-green-700' : 'text-red-700'
          }`}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {isSuccess 
              ? 'Cảm ơn bạn đã tin tưởng VietJet Air. Vé điện tử đã được gửi đến email của bạn.'
              : message || 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.'
            }
          </p>

          {/* Transaction Info */}
          {(orderId || txnRef) && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Thông tin giao dịch</h3>
              <div className="space-y-2">
                {(orderId || txnRef) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-semibold">{orderId || txnRef}</span>
                  </div>
                )}
                {amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold">
                    {new Date().toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`font-semibold ${
                    isSuccess ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isSuccess ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home size={20} />
              Về trang chủ
            </button>
            
            {isSuccess && (
              <button
                onClick={() => navigate('/my-bookings')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <FileText size={20} />
                Xem booking của tôi
              </button>
            )}
            
            {!isSuccess && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Thử lại
              </button>
            )}
          </div>

          {/* Additional Info */}
          {isSuccess && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                📧 Email xác nhận đã được gửi đến hộp thư của bạn
              </p>
              <p className="text-sm text-gray-600 mt-2">
                📱 Vui lòng check-in online trước 24h để nhận boarding pass
              </p>
            </div>
          )}

          {!isSuccess && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                💡 Nếu cần hỗ trợ, vui lòng liên hệ hotline: <strong>1900 1886</strong>
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentResultPage;
