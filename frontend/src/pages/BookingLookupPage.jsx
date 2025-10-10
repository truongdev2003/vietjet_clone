import { AlertCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import axiosInstance from '../config/axios';

const BookingLookupPage = () => {
  const navigate = useNavigate();
  const [searchMethod, setSearchMethod] = useState('reference'); // 'reference' or 'email'
  const [formData, setFormData] = useState({
    bookingReference: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (searchMethod === 'reference') {
      if (!formData.bookingReference) {
        newErrors.bookingReference = 'Vui lòng nhập mã đặt vé';
      } else if (!/^VJ[A-Z0-9]{6}$/.test(formData.bookingReference)) {
        newErrors.bookingReference = 'Mã đặt vé không đúng định dạng (VJ + 6 ký tự)';
      }
    } else {
      if (!formData.email && !formData.phone) {
        newErrors.email = 'Vui lòng nhập email hoặc số điện thoại';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }
      if (formData.phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSearching(true);
    setErrors({});

    try {
      let response;
      
      if (searchMethod === 'reference') {
        // Search by booking reference
        response = await axiosInstance.get(`/bookings/lookup/${formData.bookingReference}`);
      } else {
        // Search by email or phone
        const params = {};
        if (formData.email) params.email = formData.email;
        if (formData.phone) params.phone = formData.phone;
        
        response = await axiosInstance.get('/bookings/search', { params });
      }

      if (response.data.data) {
        // Navigate to booking detail page
        if (Array.isArray(response.data.data)) {
          // Multiple bookings found
          navigate('/my-bookings', { state: { bookings: response.data.data } });
        } else {
          // Single booking found
          navigate(`/booking/${response.data.data._id}`, { state: { booking: response.data.data } });
        }
      } else {
        setErrors({ general: 'Không tìm thấy booking nào' });
      }
    } catch (error) {
      console.error('Booking lookup error:', error);
      const errorMsg = error.response?.data?.error || 'Không tìm thấy booking. Vui lòng kiểm tra lại thông tin.';
      setErrors({ general: errorMsg });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Tra cứu booking
            </h1>
            <p className="text-gray-600">
              Nhập thông tin để tra cứu và quản lý booking của bạn
            </p>
          </div>

          {/* Search Method Tabs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSearchMethod('reference')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  searchMethod === 'reference'
                    ? 'bg-[#EE0033] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Mã đặt vé
              </button>
              <button
                onClick={() => setSearchMethod('email')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  searchMethod === 'email'
                    ? 'bg-[#EE0033] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Email/Số điện thoại
              </button>
            </div>

            <form onSubmit={handleSearch} className="p-6">
              {searchMethod === 'reference' ? (
                <>
                  {/* Booking Reference */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã đặt vé *
                    </label>
                    <input
                      type="text"
                      placeholder="VJ123456"
                      value={formData.bookingReference}
                      onChange={(e) =>
                        setFormData({ ...formData, bookingReference: e.target.value.toUpperCase() })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none focus:border-[#EE0033] ${
                        errors.bookingReference ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.bookingReference && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.bookingReference}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Mã đặt vé được gửi qua email sau khi đặt vé thành công
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none focus:border-[#EE0033] ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none focus:border-[#EE0033] ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.phone}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Nhập ít nhất một trong hai: Email hoặc Số điện thoại
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <span>{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-gradient-to-br from-[#EE0033] to-[#CC0000] text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Search size={20} />
                {isSearching ? 'Đang tìm kiếm...' : 'Tra cứu booking'}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Hướng dẫn tra cứu</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• <strong>Mã đặt vé:</strong> Tìm trong email xác nhận booking (định dạng: VJ + 6 ký tự)</li>
              <li>• <strong>Email/SĐT:</strong> Sử dụng thông tin đã nhập khi đặt vé</li>
              <li>• Nếu gặp khó khăn, vui lòng liên hệ hotline: <strong>1900 1886</strong></li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">Hoặc</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-[#EE0033] hover:text-[#EE0033] transition-colors"
              >
                Đặt vé mới
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-[#EE0033] hover:text-[#EE0033] transition-colors"
              >
                Booking của tôi
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingLookupPage;
