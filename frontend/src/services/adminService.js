import api from '../config/axios';
import { ADMIN_ENDPOINTS, AIRPORT_ENDPOINTS, FARE_ENDPOINTS, FLIGHT_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Admin Service
 * Handles all admin-related API calls
 */
const adminService = {
  // ==================== DASHBOARD ====================
  /**
   * Get dashboard statistics
   */
  getDashboard: async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.DASHBOARD, { params });
    return response.data;
  },

  // ==================== USER MANAGEMENT ====================
  /**
   * Get all users with pagination and filters
   * @param {object} params - Query parameters
   */
  getUsers: async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.USERS, { params });
    return response.data;
  },

  /**
   * Get user detail by ID
   * @param {string} userId - User ID
   */
  getUserDetail: async (userId) => {
    const response = await api.get(`${ADMIN_ENDPOINTS.USERS}/${userId}`);
    return response.data;
  },

  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status (active, inactive, suspended)
   */
  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`${ADMIN_ENDPOINTS.USERS}/${userId}/status`, { status });
    return response.data;
  },

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role (user, admin, superadmin)
   */
  updateUserRole: async (userId, role) => {
    const response = await api.patch(`${ADMIN_ENDPOINTS.USERS}/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`${ADMIN_ENDPOINTS.USERS}/${userId}`);
    return response.data;
  },

  // ==================== BOOKING MANAGEMENT ====================
  /**
   * Get all bookings with pagination and filters
   */
  getBookings: async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.BOOKINGS, { params });
    return response.data;
  },

  /**
   * Get booking detail by ID
   * @param {string} bookingId - Booking ID
   */
  getBookingDetail: async (bookingId) => {
    const response = await api.get(`${ADMIN_ENDPOINTS.BOOKINGS}/${bookingId}`);
    return response.data;
  },

  /**
   * Cancel booking (admin)
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   */
  cancelBooking: async (bookingId, reason) => {
    const response = await api.patch(`${ADMIN_ENDPOINTS.BOOKINGS}/${bookingId}/cancel`, { reason });
    return response.data;
  },

  // ==================== FLIGHT MANAGEMENT ====================
  /**
   * Get all flights with pagination (sử dụng /flights route với admin auth)
   */
  getFlights: async (params = {}) => {
    const response = await api.get(FLIGHT_ENDPOINTS.DETAIL, { params });
    return response.data;
  },

  /**
   * Create new flight
   */
  createFlight: async (flightData) => {
    const response = await api.post(FLIGHT_ENDPOINTS.DETAIL, flightData);
    return response.data;
  },

  /**
   * Update flight
   */
  updateFlight: async (flightId, flightData) => {
    const response = await api.put(`${FLIGHT_ENDPOINTS.DETAIL}/${flightId}`, flightData);
    return response.data;
  },

  /**
   * Delete flight
   */
  deleteFlight: async (flightId) => {
    const response = await api.delete(`${FLIGHT_ENDPOINTS.DETAIL}/${flightId}`);
    return response.data;
  },

  /**
   * Update flight status
   */
  updateFlightStatus: async (flightId, status) => {
    const response = await api.patch(`${FLIGHT_ENDPOINTS.DETAIL}/${flightId}/status`, { status });
    return response.data;
  },

  // ==================== FARE MANAGEMENT ====================
  /**
   * Get all fares
   */
  getFares: async (params = {}) => {
    const response = await api.get(FARE_ENDPOINTS.LIST, { params });
    return response.data;
  },

  /**
   * Create new fare
   */
  createFare: async (fareData) => {
    const response = await api.post(FARE_ENDPOINTS.LIST, fareData);
    return response.data;
  },

  /**
   * Update fare
   */
  updateFare: async (fareId, fareData) => {
    const response = await api.put(`${FARE_ENDPOINTS.DETAIL}/${fareId}`, fareData);
    return response.data;
  },

  /**
   * Delete fare
   */
  deleteFare: async (fareId) => {
    const response = await api.delete(`${FARE_ENDPOINTS.DETAIL}/${fareId}`);
    return response.data;
  },

  // ==================== AIRPORT MANAGEMENT ====================
  /**
   * Get all airports
   */
  getAirports: async (params = {}) => {
    const response = await api.get(AIRPORT_ENDPOINTS.LIST, { params });
    return response.data;
  },

  /**
   * Create new airport
   */
  createAirport: async (airportData) => {
    const response = await api.post(AIRPORT_ENDPOINTS.LIST, airportData);
    return response.data;
  },

  /**
   * Update airport
   */
  updateAirport: async (airportId, airportData) => {
    const response = await api.put(`${AIRPORT_ENDPOINTS.LIST}/${airportId}`, airportData);
    return response.data;
  },

  /**
   * Delete airport
   */
  deleteAirport: async (airportId) => {
    const response = await api.delete(`${AIRPORT_ENDPOINTS.LIST}/${airportId}`);
    return response.data;
  },

  // ==================== ROUTE MANAGEMENT ====================
  /**
   * Get all routes
   */
  getRoutes: async (params = {}) => {
    const response = await api.get('/admin/routes', { params });
    return response.data;
  },

  /**
   * Get route by ID
   */
  getRouteById: async (routeId) => {
    const response = await api.get(`/admin/routes/${routeId}`);
    return response.data;
  },

  /**
   * Find route by origin and destination
   */
  findRoute: async (params = {}) => {
    const response = await api.get('/admin/routes/find', { params });
    return response.data;
  },

  /**
   * Create new route
   */
  createRoute: async (data) => {
    const response = await api.post('/admin/routes', data);
    return response.data;
  },

  /**
   * Update route
   */
  updateRoute: async (routeId, data) => {
    const response = await api.put(`/admin/routes/${routeId}`, data);
    return response.data;
  },

  /**
   * Update route status
   */
  updateRouteStatus: async (routeId, status) => {
    const response = await api.patch(`/admin/routes/${routeId}/status`, { status });
    return response.data;
  },

  /**
   * Delete route
   */
  deleteRoute: async (routeId) => {
    const response = await api.delete(`/admin/routes/${routeId}`);
    return response.data;
  },

  /**
   * Get route statistics
   */
  getRouteStats: async (routeId) => {
    const response = await api.get(`/admin/routes/stats/${routeId}`);
    return response.data;
  },

  // Note: Airline management không có API backend, dùng hardcoded data trong frontend

  // ==================== REPORTS ====================
  /**
   * Get reports
   */
  getReports: async (params = {}) => {
    const response = await api.get(ADMIN_ENDPOINTS.REPORTS, { params });
    return response.data;
  },

  // ==================== NOTIFICATIONS ====================
  /**
   * Send flight update notification
   */
  sendFlightUpdate: async (data) => {
    const response = await api.post(ADMIN_ENDPOINTS.FLIGHT_UPDATES, data);
    return response.data;
  },

  /**
   * Get all notifications (Admin)
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  /**
   * Create notification
   */
  createNotification: async (data) => {
    const response = await api.post('/notifications', data);
    return response.data;
  },

  /**
   * Send promotional notification
   */
  sendPromotionalNotification: async (data) => {
    const response = await api.post('/notifications/promotional', data);
    return response.data;
  },

  // ==================== PAYMENT MANAGEMENT ====================
  /**
   * Get all payments (Admin)
   */
  getPayments: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  /**
   * Get payment detail by ID
   */
  getPaymentDetail: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Refund payment
   */
  refundPayment: async (paymentId, data) => {
    const response = await api.post(`/payments/${paymentId}/refund`, data);
    return response.data;
  },

  // ==================== CHECK-IN MANAGEMENT ====================
  /**
   * Get all check-ins (Admin)
   */
  getCheckins: async (params = {}) => {
    const response = await api.get('/admin/checkins', { params });
    return response.data;
  },

  /**
   * Perform check-in (manual by staff)
   */
  performCheckin: async (data) => {
    const response = await api.post('/checkin/perform', data);
    return response.data;
  },

  /**
   * Get boarding pass
   */
  getBoardingPass: async (bookingRef, passengerId) => {
    const response = await api.get(`/checkin/boarding-pass/${bookingRef}/${passengerId}`);
    return response.data;
  },

  // ==================== SEAT MANAGEMENT ====================
  /**
   * Get seat map for a flight
   */
  getSeatMap: async (flightId) => {
    const response = await api.get(`/seats/flight/${flightId}/map`);
    return response.data;
  },

  /**
   * Update seat configuration (Admin)
   */
  updateSeatConfig: async (flightId, seatNumber, config) => {
    const response = await api.patch(`/seats/flight/${flightId}/seat/${seatNumber}`, config);
    return response.data;
  },

  /**
   * Toggle seat block status (Admin)
   */
  toggleSeatBlock: async (flightId, seatNumber, isBlocked) => {
    const response = await api.patch(`/seats/flight/${flightId}/seat/${seatNumber}/block`, { isBlocked });
    return response.data;
  },

  // ==================== PAYMENT CODE MANAGEMENT ====================
  /**
   * Get payment code statistics
   */
  getPaymentCodeStats: async () => {
    const response = await api.get('/admin/payment-codes/stats');
    return response.data;
  },

  /**
   * Get all payment codes
   */
  getPaymentCodes: async (params = {}) => {
    const response = await api.get('/admin/payment-codes', { params });
    return response.data;
  },

  /**
   * Get payment code detail by ID
   */
  getPaymentCodeById: async (id) => {
    const response = await api.get(`/admin/payment-codes/${id}`);
    return response.data;
  },

  /**
   * Create new payment code
   */
  createPaymentCode: async (data) => {
    const response = await api.post('/admin/payment-codes', data);
    return response.data;
  },

  /**
   * Update payment code
   */
  updatePaymentCode: async (id, data) => {
    const response = await api.put(`/admin/payment-codes/${id}`, data);
    return response.data;
  },

  /**
   * Delete payment code
   */
  deletePaymentCode: async (id) => {
    const response = await api.delete(`/admin/payment-codes/${id}`);
    return response.data;
  },

  /**
   * Toggle payment code status
   */
  togglePaymentCodeStatus: async (id) => {
    const response = await api.patch(`/admin/payment-codes/${id}/toggle`);
    return response.data;
  },
};

export default adminService;

