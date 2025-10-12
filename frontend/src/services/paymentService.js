// Payment Service API
import api from '../config/axios';

const paymentService = {
  // Create payment for booking
  createPayment: async (bookingId, paymentData) => {
    try {
      const response = await api.post(`/payments/booking/${bookingId}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Get all payments for booking
  getPaymentsByBooking: async (bookingId) => {
    try {
      const response = await api.get(`/payments/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Process payment
  processPayment: async (paymentId, paymentData) => {
    try {
      const response = await api.post(`/payments/${paymentId}/process`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Verify payment status
  verifyPayment: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  // Refund payment
  refundPayment: async (paymentId, refundData) => {
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, refundData);
      return response.data;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    try {
      const response = await api.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    try {
      const response = await api.post(`/payments/${paymentId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling payment:', error);
      throw error;
    }
  },

  // Validate payment code
  validatePaymentCode: async (code, amount, bookingId = null) => {
    try {
      const response = await api.post('/payments/validate-code', {
        code,
        amount,
        bookingId
      });
      return response.data;
    } catch (error) {
      console.error('Error validating payment code:', error);
      throw error;
    }
  }
};

export default paymentService;

