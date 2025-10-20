import { useState } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { MaskedEmail, MaskedPhone } from '../components/MaskedData';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, updateContactInfo, changePassword, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [personalData, setPersonalData] = useState({
    title: user?.personalInfo?.title || 'Mr',
    firstName: user?.personalInfo?.firstName || '',
    lastName: user?.personalInfo?.lastName || '',
    dateOfBirth: user?.personalInfo?.dateOfBirth?.split('T')[0] || '',
    gender: user?.personalInfo?.gender || 'male',
    nationality: user?.personalInfo?.nationality || 'Vietnam',
  });

  const [contactData, setContactData] = useState({
    email: user?.contactInfo?.email || '',
    phone: user?.contactInfo?.phone || '',
    alternatePhone: user?.contactInfo?.alternatePhone || '',
    street: user?.contactInfo?.address?.street || '',
    ward: user?.contactInfo?.address?.ward || '',
    district: user?.contactInfo?.address?.district || '',
    city: user?.contactInfo?.address?.city || '',
    province: user?.contactInfo?.address?.province || '',
    country: user?.contactInfo?.address?.country || 'Vietnam',
    zipCode: user?.contactInfo?.address?.zipCode || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePersonalChange = (e) => {
    setPersonalData({ ...personalData, [e.target.name]: e.target.value });
  };

  const handleContactChange = (e) => {
    setContactData({ ...contactData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile({ personalInfo: personalData });
      await refreshUser();
      setMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
    } catch (error) {
      // Handle validation errors from backend
      let errorMessage = 'Cập nhật thất bại';
      
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        email: contactData.email,
        phone: contactData.phone,
        alternatePhone: contactData.alternatePhone,
        address: {
          street: contactData.street,
          ward: contactData.ward,
          district: contactData.district,
          city: contactData.city,
          province: contactData.province,
          country: contactData.country,
          zipCode: contactData.zipCode,
        },
      };
      await updateContactInfo(payload);
      await refreshUser();
      setMessage({ type: 'success', text: 'Cập nhật thông tin liên hệ thành công!' });
    } catch (error) {
      // Handle validation errors from backend
      let errorMessage = 'Cập nhật thất bại';
      
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword, passwordData.confirmPassword);
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      // Handle validation errors from backend
      let errorMessage = 'Đổi mật khẩu thất bại';
      
      if (error.response?.data) {
        // Check if it's a validation error with multiple errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } 
        // Single error message
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.personalInfo?.firstName?.charAt(0)}{user?.personalInfo?.lastName?.charAt(0)}
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.personalInfo?.title} {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                  </h1>
                  <p className="text-gray-600">
                    <MaskedEmail email={user?.contactInfo?.email} showIcon={false} />
                  </p>
                  {user?.contactInfo?.phone && (
                    <p className="text-sm text-gray-500 mt-1">
                      <MaskedPhone phone={user?.contactInfo?.phone} showIcon={true} />
                    </p>
                  )}
                  <div className="mt-2">
                    {user?.account?.isEmailVerified ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Email đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Email chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'personal'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'contact'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Thông tin liên hệ
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === 'password'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Đổi mật khẩu
                </button>
                <button
                  onClick={() => setActiveTab('2fa')}
                  className={`px-6 py-4 text-sm font-medium ${
                    activeTab === '2fa'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Xác thực 2 yếu tố
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="px-6 py-8">
              {message.text && (
                <div className={`mb-6 px-4 py-3 rounded ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-400 text-green-700' 
                    : 'bg-red-50 border border-red-400 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <form onSubmit={handleUpdatePersonal} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Danh xưng</label>
                      <select
                        name="title"
                        value={personalData.title}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="Mr">Ông (Mr)</option>
                        <option value="Ms">Bà (Ms)</option>
                        <option value="Mrs">Cô (Mrs)</option>
                        <option value="Dr">Tiến sĩ (Dr)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                      <select
                        name="gender"
                        value={personalData.gender}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Họ</label>
                      <input
                        type="text"
                        name="lastName"
                        value={personalData.lastName}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                      <input
                        type="text"
                        name="firstName"
                        value={personalData.firstName}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={personalData.dateOfBirth}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quốc tịch</label>
                      <input
                        type="text"
                        name="nationality"
                        value={personalData.nationality}
                        onChange={handlePersonalChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              )}

              {/* Contact Info Tab */}
              {activeTab === 'contact' && (
                <form onSubmit={handleUpdateContact} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={contactData.email}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        value={contactData.phone}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại phụ</label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={contactData.alternatePhone}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                      <input
                        type="text"
                        name="street"
                        placeholder="Số nhà, tên đường"
                        value={contactData.street}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                      <input
                        type="text"
                        name="ward"
                        value={contactData.ward}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                      <input
                        type="text"
                        name="district"
                        value={contactData.district}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                      <input
                        type="text"
                        name="city"
                        value={contactData.city}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                      <input
                        type="text"
                        name="province"
                        value={contactData.province}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quốc gia</label>
                      <input
                        type="text"
                        name="country"
                        value={contactData.country}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mã bưu chính</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={contactData.zipCode}
                        onChange={handleContactChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              )}

              {/* Change Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              )}

              {/* Two-Factor Authentication Tab */}
              {activeTab === '2fa' && (
                <TwoFactorSettings />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
