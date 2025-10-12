import axiosInstance from '../config/axios';

/**
 * Validate promo code
 * @param {string} code - Promo code
 * @param {number} amount - Total amount
 * @param {string} userId - Optional user ID
 * @param {string} routeId - Optional route ID
 * @param {string} airlineId - Optional airline ID
 * @returns {Promise<Object>}
 */
export const validatePromoCode = async (code, amount, userId = null, routeId = null, airlineId = null) => {
  try {
    // Chỉ gửi các field có giá trị hợp lệ
    const payload = {
      code,
      amount
    };
    
    // Chỉ thêm các field optional nếu có giá trị
    if (userId) payload.userId = userId;
    if (routeId) payload.routeId = routeId;
    if (airlineId) payload.airlineId = airlineId;
    
    const response = await axiosInstance.post('/promo/validate', payload);
    return response.data;
  } catch (error) {
    console.error('Validate promo code error:', error);
    throw error.response?.data || { message: 'Lỗi khi xác thực mã khuyến mãi' };
  }
};

/**
 * Get all public promo codes
 * @returns {Promise<Object>}
 */
export const getPublicPromoCodes = async () => {
  try {
    const response = await axiosInstance.get('/promo/public');
    return response.data;
  } catch (error) {
    console.error('Get public promo codes error:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách mã khuyến mãi' };
  }
};

/**
 * Apply promo code to booking
 * @param {string} code - Promo code
 * @param {string} bookingId - Booking ID
 * @param {string} userId - Optional user ID
 * @returns {Promise<Object>}
 */
export const applyPromoCode = async (code, bookingId, userId = null) => {
  try {
    const payload = {
      code,
      bookingId
    };
    
    // Chỉ thêm userId nếu có giá trị
    if (userId) payload.userId = userId;
    
    const response = await axiosInstance.post('/promo/apply', payload);
    return response.data;
  } catch (error) {
    console.error('Apply promo code error:', error);
    throw error.response?.data || { message: 'Lỗi khi áp dụng mã khuyến mãi' };
  }
};

// ========== ADMIN SERVICES ==========

/**
 * Get all promo codes (Admin)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export const getAllPromoCodes = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/promo/admin', { params });
    return response.data;
  } catch (error) {
    console.error('Get all promo codes error:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách mã khuyến mãi' };
  }
};

/**
 * Get promo code by ID (Admin)
 * @param {string} id - Promo code ID
 * @returns {Promise<Object>}
 */
export const getPromoCodeById = async (id) => {
  try {
    const response = await axiosInstance.get(`/promo/admin/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get promo code by ID error:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin mã khuyến mãi' };
  }
};

/**
 * Create promo code (Admin)
 * @param {Object} promoData - Promo code data
 * @returns {Promise<Object>}
 */
export const createPromoCode = async (promoData) => {
  try {
    const response = await axiosInstance.post('/promo/admin', promoData);
    return response.data;
  } catch (error) {
    console.error('Create promo code error:', error);
    throw error.response?.data || { message: 'Lỗi khi tạo mã khuyến mãi' };
  }
};

/**
 * Update promo code (Admin)
 * @param {string} id - Promo code ID
 * @param {Object} promoData - Updated data
 * @returns {Promise<Object>}
 */
export const updatePromoCode = async (id, promoData) => {
  try {
    const response = await axiosInstance.put(`/promo/admin/${id}`, promoData);
    return response.data;
  } catch (error) {
    console.error('Update promo code error:', error);
    throw error.response?.data || { message: 'Lỗi khi cập nhật mã khuyến mãi' };
  }
};

/**
 * Delete promo code (Admin)
 * @param {string} id - Promo code ID
 * @returns {Promise<Object>}
 */
export const deletePromoCode = async (id) => {
  try {
    const response = await axiosInstance.delete(`/promo/admin/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete promo code error:', error);
    throw error.response?.data || { message: 'Lỗi khi xóa mã khuyến mãi' };
  }
};

/**
 * Toggle promo code status (Admin)
 * @param {string} id - Promo code ID
 * @returns {Promise<Object>}
 */
export const togglePromoCodeStatus = async (id) => {
  try {
    const response = await axiosInstance.patch(`/promo/admin/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Toggle promo code status error:', error);
    throw error.response?.data || { message: 'Lỗi khi thay đổi trạng thái mã khuyến mãi' };
  }
};

/**
 * Get promo code statistics (Admin)
 * @returns {Promise<Object>}
 */
export const getPromoCodeStats = async () => {
  try {
    const response = await axiosInstance.get('/promo/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Get promo code stats error:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy thống kê mã khuyến mãi' };
  }
};
