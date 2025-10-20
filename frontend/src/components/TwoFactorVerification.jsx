import { Clock, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';
import twoFactorService from '../services/twoFactorService';
import Toast from './Toast';

const TwoFactorVerification = ({ userId, email, tempToken, expiresIn, onSuccess, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(expiresIn || 600); // Default 10 minutes
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time remaining
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP verification
  const handleVerify = async () => {
    const token = isBackupCode ? backupCode.replace(/\s+/g, '') : otp;
    
    if (!token) {
      setError(isBackupCode ? 'Vui lòng nhập mã backup' : 'Vui lòng nhập mã xác thực');
      return;
    }

    if (!isBackupCode && token.length !== 6) {
      setError('Mã xác thực phải có 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await twoFactorService.verify(userId, token, tempToken);
      
      // Show success message if backup code was used
      if (response.backupCodesRemaining !== undefined) {
        setToast({
          show: true,
          message: `Đăng nhập thành công! Còn ${response.backupCodesRemaining} mã backup.`,
          type: 'success'
        });
      }

      // Delay slightly to show success message
      setTimeout(() => {
        onSuccess(response.tokens, response.user);
      }, 500);
    } catch (err) {
      console.error('2FA verification error:', err);
      setError(err.response?.data?.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
      setOtp('');
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Xác Thực Hai Yếu Tố
          </h2>
          <p className="text-gray-600 text-sm">
            {email}
          </p>
        </div>

        {/* Timer */}
        {timeRemaining > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-600">
            <Clock size={16} />
            <span>Thời gian còn lại: {formatTime(timeRemaining)}</span>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setIsBackupCode(false);
              setError('');
              setBackupCode('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              !isBackupCode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mã Authenticator
          </button>
          <button
            onClick={() => {
              setIsBackupCode(true);
              setError('');
              setOtp('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isBackupCode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mã Backup
          </button>
        </div>

        {/* Input section */}
        <div className="mb-6">
          {!isBackupCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Nhập mã 6 chữ số từ ứng dụng Authenticator
              </label>
              <div className="flex justify-center">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderInput={(props) => <input {...props} />}
                  inputStyle={{
                    width: '3rem',
                    height: '3rem',
                    margin: '0 0.25rem',
                    fontSize: '1.5rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  focusStyle={{
                    border: '2px solid #3b82f6',
                  }}
                  shouldAutoFocus
                  inputType="tel"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập mã backup (định dạng: XXXX-XXXX-XXXX)
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center text-lg font-mono tracking-wider"
                disabled={loading}
                maxLength={14}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Mỗi mã backup chỉ sử dụng được một lần
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || timeRemaining === 0}
          >
            {loading ? 'Đang xác thực...' : 'Xác Thực'}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Không nhận được mã? Kiểm tra ứng dụng Authenticator hoặc sử dụng mã backup
          </p>
        </div>
      </div>

      {/* Toast notification */}
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

export default TwoFactorVerification;
