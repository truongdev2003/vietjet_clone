import { AlertCircle, Check, Copy, Download, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';
import twoFactorService from '../services/twoFactorService';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

const TwoFactorSetup = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load QR code on mount
  useEffect(() => {
    if (isOpen && step === 1) {
      loadSetup();
    }
  }, [isOpen]);

  const loadSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await twoFactorService.setup();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setManualEntryKey(data.manualEntryKey);
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.response?.data?.message || 'Không thể tạo mã QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Copy secret to clipboard
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setToast({
      show: true,
      message: 'Đã sao chép mã bí mật',
      type: 'success'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Verify OTP and enable 2FA
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Mã xác thực phải có 6 chữ số');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await twoFactorService.verifySetup(otp);
      setBackupCodes(data.backupCodes);
      setStep(3);
      setToast({
        show: true,
        message: 'Xác thực hai yếu tố đã được kích hoạt!',
        type: 'success'
      });
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const handleDownloadCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vietjet-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToast({
      show: true,
      message: 'Đã tải xuống mã backup',
      type: 'success'
    });
  };

  // Copy all backup codes
  const handleCopyAllCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setToast({
      show: true,
      message: 'Đã sao chép tất cả mã backup',
      type: 'success'
    });
  };

  // Complete setup
  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  // Reset and close
  const handleClose = () => {
    setStep(1);
    setQrCode('');
    setSecret('');
    setOtp('');
    setBackupCodes([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
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
            Thiết Lập Xác Thực Hai Yếu Tố
          </h2>
          <p className="text-gray-600 text-sm">
            Bảo vệ tài khoản của bạn với xác thực hai yếu tố
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Scan QR Code */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                Bước 1: Quét Mã QR
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-6">
                <li>Tải ứng dụng Authenticator (Google Authenticator, Microsoft Authenticator, Authy)</li>
                <li>Mở ứng dụng và chọn "Thêm tài khoản"</li>
                <li>Quét mã QR bên dưới</li>
              </ol>

              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>

                  {/* Manual entry option */}
                  <div className="w-full">
                    <button
                      onClick={() => setError(error ? '' : 'show-manual')}
                      className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                    >
                      Không thể quét mã? Nhập thủ công
                    </button>
                    
                    {error === 'show-manual' && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Nhập mã này vào ứng dụng Authenticator:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm">
                            {manualEntryKey}
                          </code>
                          <button
                            onClick={handleCopySecret}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Sao chép"
                          >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
                  <p className="text-red-600">Không thể tải mã QR</p>
                  <button
                    onClick={loadSetup}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            {error && error !== 'show-manual' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading || !qrCode}
              >
                Tiếp Theo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                Bước 2: Xác Thực
              </h3>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Nhập mã 6 chữ số từ ứng dụng Authenticator để xác nhận
              </p>

              <div className="flex justify-center mb-6">
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtp('');
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Quay Lại
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Đang xác thực...' : 'Xác Thực'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                Bước 3: Lưu Mã Backup
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      Quan trọng: Lưu giữ các mã này cẩn thận!
                    </p>
                    <p className="text-xs text-yellow-700">
                      Mỗi mã chỉ sử dụng được một lần. Bạn sẽ cần chúng nếu mất quyền truy cập vào ứng dụng Authenticator.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-white px-3 py-2 rounded border border-gray-300 text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleDownloadCodes}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  <Download size={18} />
                  Tải Xuống
                </button>
                <button
                  onClick={handleCopyAllCodes}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  <Copy size={18} />
                  Sao Chép
                </button>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Hoàn Thành
            </button>
          </div>
        )}
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

export default TwoFactorSetup;
