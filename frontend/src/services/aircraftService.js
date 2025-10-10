import api from '../config/axios';

const API_BASE = '/admin/aircraft';

const aircraftService = {
  // Lấy danh sách tất cả máy bay
  getAllAircraft: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách máy bay có sẵn (cho dropdown)
  getAvailableAircraft: async () => {
    try {
      const response = await api.get(`${API_BASE}/available`);
       return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết máy bay
  getAircraftById: async (id) => {
    try {
      const response = await api.get(`${API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo máy bay mới
  createAircraft: async (aircraftData) => {
    try {
      const response = await api.post(API_BASE, aircraftData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật máy bay
  updateAircraft: async (id, aircraftData) => {
    try {
      const response = await api.put(`${API_BASE}/${id}`, aircraftData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái máy bay
  updateAircraftStatus: async (id, statusData) => {
    try {
      const response = await api.patch(`${API_BASE}/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa máy bay
  deleteAircraft: async (id) => {
    try {
      const response = await api.delete(`${API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thống kê máy bay
  getAircraftStats: async () => {
    try {
      const response = await api.get(`${API_BASE}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default aircraftService;
