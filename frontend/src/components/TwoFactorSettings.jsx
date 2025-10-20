import { AlertCircle, Check, Key, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import twoFactorService from '../services/twoFactorService';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';
import TwoFactorSetup from './TwoFactorSetup';

const TwoFactorSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [password, setPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load 2FA status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await twoFactorService.getStatus();
      setIsEnabled(data.isEnabled);
    } catch (err) {
      console.error('Error loading 2FA status:', err);
      setToast({
        show: true,
        message: 'Không thể tải trạng thái 2FA',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle enable 2FA
  const handleEnable = () => {
    setShowSetup(true);
  };

  // Handle setup success
  const handleSetupSuccess = () => {
    setIsEnabled(true);
    setShowSetup(false);
    setToast({
      show: true,
      message: 'Xác thực hai yếu tố đã được kích hoạt thành công!',
      type: 'success'
    });
  };

  // Handle disable 2FA
  const handleDisable = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await twoFactorService.disable(password);
      setIsEnabled(false);
      setShowDisableModal(false);
      setPassword('');
      setToast({
        show: true,
        message: 'Xác thực hai yếu tố đã được tắt',
        type: 'success'
      });
    } catch (err) {
      console.error('Disable error:', err);
      setError(err.response?.data?.message || 'Không thể tắt 2FA. Vui lòng kiểm tra mật khẩu.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const data = await twoFactorService.regenerateBackupCodes();
      setNewBackupCodes(data.backupCodes);
      setPassword('');
      setToast({
        show: true,
        message: 'Đã tạo mã backup mới thành công!',
        type: 'success'
      });
    } catch (err) {
      console.error('Regenerate error:', err);
      setError(err.response?.data?.message || 'Không thể tạo mã backup mới.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download backup codes
  const handleDownloadCodes = () => {
    const text = newBackupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vietjet-backup-codes-new.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy backup codes
  const handleCopyCodes = () => {
    const text = newBackupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setToast({
      show: true,
      message: 'Đã sao chép mã backup',
      type: 'success'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Xác Thực Hai Yếu Tố (2FA)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tăng cường bảo mật tài khoản của bạn với xác thực hai yếu tố. 
            Bạn sẽ cần nhập mã từ ứng dụng Authenticator mỗi khi đăng nhập.
          </p>

          {/* Status */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              isEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isEnabled ? (
                <>
                  <Check size={14} />
                  Đã Bật
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  Chưa Bật
                </>
              )}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!isEnabled ? (
              <button
                onClick={handleEnable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Shield size={18} />
                Bật Xác Thực Hai Yếu Tố
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Key size={18} />
                  Tạo Mã Backup Mới
                </button>
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Tắt 2FA
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <TwoFactorSetup
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onSuccess={handleSetupSuccess}
        />
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Tắt Xác Thực Hai Yếu Tố
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <p className="text-sm text-yellow-800">
                  Tắt 2FA sẽ giảm bảo mật tài khoản của bạn. Nhập mật khẩu để xác nhận.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu của bạn"
                disabled={actionLoading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleDisable}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Tắt 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Tạo Mã Backup Mới
            </h3>

            {newBackupCodes.length === 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Tạo 10 mã backup mới. Các mã cũ sẽ không còn sử dụng được.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu của bạn"
                    disabled={actionLoading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRegenerateModal(false);
                      setPassword('');
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={actionLoading}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleRegenerateBackupCodes}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Đang tạo...' : 'Tạo Mã Mới'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                    <p className="text-sm text-yellow-800">
                      Lưu các mã này ngay! Chúng sẽ không hiển thị lại.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {newBackupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="bg-white px-3 py-2 rounded border border-gray-300 text-center font-mono text-sm"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleDownloadCodes}
                    className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Tải Xuống
                  </button>
                  <button
                    onClick={handleCopyCodes}
                    className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Sao Chép
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowRegenerateModal(false);
                    setNewBackupCodes([]);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default TwoFactorSettings;
