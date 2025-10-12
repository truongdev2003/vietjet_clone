import { Check, Tag, X } from 'lucide-react';
import { useState } from 'react';
import paymentService from '../services/paymentService';

const PaymentCodeInput = ({ totalAmount, bookingId, onApplyCode }) => {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCode, setAppliedCode] = useState(null);
  const [error, setError] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã thanh toán');
      return;
    }

    setIsApplying(true);
    setError('');

    try {
      const response = await paymentService.validatePaymentCode(
        code.trim().toUpperCase(),
        totalAmount,
        bookingId
      );

      if (response.success && response.data) {
        setAppliedCode(response.data.code);
        setDiscountInfo(response.data);
        
        // Gọi callback để cập nhật discount ở component cha
        if (onApplyCode) {
          onApplyCode(response.data.discountAmount, response.data);
        }
        
        setError('');
      } else {
        setError('Mã thanh toán không hợp lệ');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mã thanh toán không hợp lệ');
      setAppliedCode(null);
      setDiscountInfo(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCode = () => {
    setCode('');
    setAppliedCode(null);
    setDiscountInfo(null);
    setError('');
    
    // Reset discount ở component cha
    if (onApplyCode) {
      onApplyCode(0, null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="text-red-600" size={20} />
        <h3 className="font-semibold text-gray-900">Mã thanh toán</h3>
      </div>

      {!appliedCode ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyCode();
                }
              }}
              placeholder="Nhập mã thanh toán"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono uppercase"
              disabled={isApplying}
            />
            <button
              onClick={handleApplyCode}
              disabled={isApplying || !code.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Đang kiểm tra...
                </>
              ) : (
                'Áp dụng'
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <X className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <span className="font-semibold text-green-700">Đã áp dụng mã:</span>
              <span className="font-mono font-bold text-green-900">{appliedCode}</span>
            </div>
            <button
              onClick={handleRemoveCode}
              className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
            >
              <X size={16} />
              Hủy
            </button>
          </div>

          {discountInfo && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{discountInfo.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Loại giảm giá:</span>
                <span className="font-medium text-gray-900">
                  {discountInfo.discountType === 'percentage' 
                    ? `${discountInfo.discountValue}%` 
                    : formatCurrency(discountInfo.discountValue)
                  }
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-green-200">
                <span className="font-semibold text-gray-700">Số tiền được giảm:</span>
                <span className="font-bold text-green-600 text-lg">
                  -{formatCurrency(discountInfo.discountAmount)}
                </span>
              </div>

              {discountInfo.expiryDate && (
                <div className="text-xs text-gray-500 pt-1">
                  Hết hạn: {new Date(discountInfo.expiryDate).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        * Mã thanh toán sẽ được áp dụng khi thanh toán và không thể kết hợp với các mã khuyến mãi khác
      </p>
    </div>
  );
};

export default PaymentCodeInput;
