import api from '../config/axios';

class BannerService {
  // Public APIs
  async getActiveBanners() {
    const response = await api.get('/banners');
    return response.data;
  }

  async trackView(bannerId) {
    const response = await api.post(`/banners/${bannerId}/view`);
    return response.data;
  }

  async trackClick(bannerId) {
    const response = await api.post(`/banners/${bannerId}/click`);
    return response.data;
  }

  // Admin APIs
  async getAllBanners(params = {}) {
    const response = await api.get('/admin/banners', { params });
    return response.data;
  }

  async getBannerById(id) {
    const response = await api.get(`/admin/banners/${id}`);
    return response.data;
  }

  async getBannerStats() {
    const response = await api.get('/admin/banners/stats');
    return response.data;
  }

  async createBanner(bannerData) {
    const response = await api.post('/admin/banners', bannerData);
    return response.data;
  }

  async updateBanner(id, bannerData) {
    const response = await api.put(`/admin/banners/${id}`, bannerData);
    return response.data;
  }

  async deleteBanner(id) {
    const response = await api.delete(`/admin/banners/${id}`);
    return response.data;
  }

  async toggleBannerStatus(id) {
    const response = await api.patch(`/admin/banners/${id}/toggle`);
    return response.data;
  }

  async updateBannersOrder(banners) {
    const response = await api.post('/admin/banners/reorder', { banners });
    return response.data;
  }
}

export default new BannerService();
