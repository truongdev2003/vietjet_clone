// Booking Service API
import api from '../config/axios';

const bookingService = {
  // Get all bookings for current user
  getMyBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/my-bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Get booking by booking code
  getBookingByCode: async (bookingCode) => {
    try {
      const response = await api.get(`/bookings/code/${bookingCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking by code:', error);
      throw error;
    }
  },

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Update booking
  updateBooking: async (bookingId, bookingData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw error;
    }
  },

  // Get booking statistics
  getBookingStats: async () => {
    try {
      const response = await api.get('/bookings/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  },

  // Add passenger to booking
  addPassenger: async (bookingId, passengerData) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/passengers`, passengerData);
      return response.data;
    } catch (error) {
      console.error('Error adding passenger:', error);
      throw error;
    }
  },

  // Update passenger
  updatePassenger: async (bookingId, passengerId, passengerData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/passengers/${passengerId}`, passengerData);
      return response.data;
    } catch (error) {
      console.error('Error updating passenger:', error);
      throw error;
    }
  },

  // Remove passenger
  removePassenger: async (bookingId, passengerId) => {
    try {
      const response = await api.delete(`/bookings/${bookingId}/passengers/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing passenger:', error);
      throw error;
    }
  },
};

export default bookingService;
