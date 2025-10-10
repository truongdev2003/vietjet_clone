import api from '../config/axios';

const API_BASE = '/admin/airports';

const airportService = {
  // Lấy danh sách tất cả sân bay
  getAllAirports: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết sân bay
  getAirportById: async (id) => {
    try {
      const response = await api.get(`${API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tìm kiếm sân bay
  searchAirports: async (query, limit = 10) => {
    try {
      const response = await api.get(`/api/airports/search?q=${query}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo sân bay mới
  createAirport: async (airportData) => {
    try {
      const response = await api.post(API_BASE, airportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật sân bay
  updateAirport: async (id, airportData) => {
    try {
      const response = await api.put(`${API_BASE}/${id}`, airportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa sân bay
  deleteAirport: async (id) => {
    try {
      const response = await api.delete(`${API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thống kê sân bay
  getAirportStats: async (id, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_BASE}/${id}/stats?${queryString}` : `${API_BASE}/${id}/stats`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default airportService;
