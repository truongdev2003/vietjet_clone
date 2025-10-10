import { AlertCircle, Check, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPublicPromoCodes, validatePromoCode } from '../services/promoService';

const PromoCodeInput = ({ totalAmount, onPromoApplied, onPromoRemoved, routeId = null, airlineId = null }) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);

  // Load available promo codes on mount
  useEffect(() => {
    fetchAvailablePromos();
  }, []);

  const fetchAvailablePromos = async () => {
    setLoadingPromos(true);
    try {
      const response = await getPublicPromoCodes();
      setAvailablePromos(response.data.promoCodes || []);
    } catch (err) {
      console.error('Failed to fetch promo codes:', err);
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const response = await validatePromoCode(
        promoCode.toUpperCase(),
        totalAmount,
        null, // userId - will be added when user is logged in
        routeId,
        airlineId
      );

      if (response.success && response.data.valid) {
        const promoData = response.data.promoCode;
        setAppliedPromo(promoData);
        onPromoApplied(promoData);
        setPromoCode('');
      } else {
        setError(response.message || 'Mã khuyến mãi không hợp lệ');
      }
    } catch (err) {
      console.error('Promo validation error:', err);
      setError(err.message || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
    } finally {
      setValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setError('');
    onPromoRemoved();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDiscount = (promo) => {
    if (promo.type === 'percentage') {
      return `Giảm ${promo.value}%${promo.maxDiscount ? ` (tối đa ${formatPrice(promo.maxDiscount)})` : ''}`;
    }
    return `Giảm ${formatPrice(promo.value)}`;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={20} className="text-[#EE0033]" />
        <h3 className="font-semibold text-gray-800">Mã khuyến mãi</h3>
      </div>

      {!appliedPromo ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Nhập mã khuyến mãi"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyPromo();
                }
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EE0033] uppercase"
              disabled={validating}
            />
            <button
              onClick={handleApplyPromo}
              disabled={validating || !promoCode.trim()}
              className="px-6 py-2 bg-[#EE0033] text-white rounded-lg font-semibold hover:bg-[#CC0000] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {validating ? 'Đang kiểm tra...' : 'Áp dụng'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            💡 Nhập mã để nhận ưu đãi đặc biệt
          </div>
        </>
      ) : (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-green-700">
              <Check size={20} />
              <span className="font-semibold">Mã {appliedPromo.code} đã được áp dụng</span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-green-700 hover:text-green-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-green-800">
              {appliedPromo.description}
            </div>
            <div className="text-lg font-bold text-green-700">
              Giảm giá: -{formatPrice(appliedPromo.discount)}
            </div>
            {appliedPromo.finalAmount && (
              <div className="text-sm text-green-600">
                Tổng tiền sau giảm: {formatPrice(appliedPromo.finalAmount)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Promos */}
      {!appliedPromo && availablePromos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Mã khuyến mãi có sẵn:</div>
          <div className="space-y-2">
            {availablePromos.slice(0, 3).map((promo) => (
              <button
                key={promo._id}
                onClick={() => setPromoCode(promo.code)}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-[#EE0033] text-sm group-hover:underline">
                      {promo.code}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {promo.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDiscount(promo)}
                      {promo.minAmount > 0 && ` • Đơn tối thiểu ${formatPrice(promo.minAmount)}`}
                    </div>
                  </div>
                  <Tag size={16} className="text-gray-400 group-hover:text-[#EE0033]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingPromos && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-center text-sm text-gray-500">
          Đang tải mã khuyến mãi...
        </div>
      )}
    </div>
  );
};

export default PromoCodeInput;
