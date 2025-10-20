import { Lock, Mail, Shield, User } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { MaskedEmail, MaskedPhone } from '../../components/MaskedData';
import Toast from '../../components/Toast';
import TwoFactorSettings from '../../components/TwoFactorSettings';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
  const { user, changePassword, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, security, 2fa
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Profile form
  const [profileData, setProfileData] = useState({
    firstName: user?.personalInfo?.firstName || '',
    lastName: user?.personalInfo?.lastName || '',
    email: user?.contactInfo?.email || '',
    phone: user?.contactInfo?.phone || ''
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        personalInfo: {
          firstName: profileData.firstName,
          lastName: profileData.lastName
        },
        contactInfo: {
          phone: profileData.phone
        }
      });

      setToast({
        show: true,
        message: 'Cập nhật thông tin thành công!',
        type: 'success'
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || 'Cập nhật thất bại',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({
        show: true,
        message: 'Mật khẩu xác nhận không khớp',
        type: 'error'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setToast({
        show: true,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      await changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      setToast({
        show: true,
        message: 'Đổi mật khẩu thành công!',
        type: 'success'
      });

      // Clear form
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cài Đặt Tài Khoản</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin và bảo mật tài khoản của bạn</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User size={20} />
              Thông Tin Cá Nhân
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'security'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Lock size={20} />
              Đổi Mật Khẩu
            </button>
            <button
              onClick={() => setActiveTab('2fa')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === '2fa'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Shield size={20} />
              Xác Thực Hai Yếu Tố
            </button>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Thông Tin Cá Nhân
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ *
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên *
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline mr-1" size={16} />
                      Email
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <MaskedEmail email={profileData.email} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Điện Thoại
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <MaskedPhone phone={profileData.phone} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Để thay đổi số điện thoại, vui lòng liên hệ quản trị viên hệ thống
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập Nhật'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Đổi Mật Khẩu
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật Khẩu Hiện Tại *
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật Khẩu Mới *
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác Nhận Mật Khẩu Mới *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={8}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                  </button>
                </form>
              </div>
            )}

            {/* 2FA Tab */}
            {activeTab === '2fa' && (
              <div>
                <TwoFactorSettings />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </AdminLayout>
  );
};

export default AdminProfile;
