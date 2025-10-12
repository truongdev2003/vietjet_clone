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
  getBookingByCode: async (bookingCode, email, lastName, documentNumber) => {
    try {
      const params = {};
      if (email) params.email = email;
      if (lastName) params.lastName = lastName;
      if (documentNumber) params.documentNumber = documentNumber;
      
      const response = await api.get(`/bookings/code/${bookingCode}`, { params });
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

  // Online check-in for booking
  onlineCheckin: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/checkin`);
      return response.data;
    } catch (error) {
      console.error('Error performing online check-in:', error);
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

  // Download booking PDF (for authenticated user)
  downloadBookingPDF: async (bookingReference) => {
    try {
      const response = await api.get(`/bookings/${bookingReference}/download-pdf`, {
        responseType: 'blob' // Important for binary data
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VietJet-${bookingReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading booking PDF:', error);
      throw error;
    }
  },

  // Download booking PDF for guest (requires email)
  downloadGuestBookingPDF: async (bookingReference, email) => {
    try {
      const response = await api.get(`/bookings/download/${bookingReference}/pdf`, {
        params: { email },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VietJet-${bookingReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading guest booking PDF:', error);
      throw error;
    }
  },

  // Resend booking confirmation email
  resendBookingConfirmation: async (bookingReference, email) => {
    try {
      const response = await api.post(`/bookings/${bookingReference}/resend-confirmation`, {
        email
      });
      return response.data;
    } catch (error) {
      console.error('Error resending booking confirmation:', error);
      throw error;
    }
  },

  // Retry payment for pending/failed booking
  retryPayment: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/retry-payment`);
      return response.data;
    } catch (error) {
      console.error('Error retrying payment:', error);
      throw error;
    }
  },
};

export default bookingService;
