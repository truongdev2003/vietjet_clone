// Check-in Service API
import api from '../config/axios';

const checkinService = {
  // Check booking eligibility for check-in
  checkEligibility: async (bookingReference, lastName) => {
    try {
      const response = await api.post('/checkin/eligibility', {
        bookingReference,
        lastName,
      });
      return response.data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  },

  // Perform check-in with seat selections
  performCheckin: async (bookingReference, passengers) => {
    try {
      const response = await api.post('/checkin/perform', {
        bookingReference,
        passengers, // Array of { passengerId, seatNumber }
      });
      return response.data;
    } catch (error) {
      console.error('Error performing check-in:', error);
      throw error;
    }
  },

  // Get check-in status
  getCheckinStatus: async (bookingReference) => {
    try {
      const response = await api.get(`/checkin/status/${bookingReference}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      throw error;
    }
  },

  // Get boarding pass
  getBoardingPass: async (bookingReference, passengerId) => {
    try {
      const response = await api.get(`/checkin/boarding-pass/${bookingReference}/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching boarding pass:', error);
      throw error;
    }
  },

  // Get mobile boarding pass
  getMobileBoardingPass: async (bookingReference, passengerId) => {
    try {
      const response = await api.get(`/checkin/mobile-boarding-pass/${bookingReference}/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mobile boarding pass:', error);
      throw error;
    }
  },

  // Download boarding pass (PDF)
  downloadBoardingPass: async (bookingReference, passengerId) => {
    try {
      const response = await api.get(
        `/checkin/boarding-pass/${bookingReference}/${passengerId}/download`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading boarding pass:', error);
      throw error;
    }
  },
};

export default checkinService;
