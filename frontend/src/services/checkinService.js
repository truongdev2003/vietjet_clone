// Check-in Service API
import api from '../config/axios';

const checkinService = {
  // Check booking eligibility for check-in
  checkEligibility: async (bookingCode, lastName) => {
    try {
      const response = await api.post('/checkin/eligibility', {
        bookingCode,
        lastName,
      });
      return response.data;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  },

  // Start check-in process
  startCheckin: async (bookingId, passengerIds) => {
    try {
      const response = await api.post('/checkin/start', {
        bookingId,
        passengerIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting check-in:', error);
      throw error;
    }
  },

  // Complete check-in
  completeCheckin: async (checkinId, checkinData) => {
    try {
      const response = await api.post(`/checkin/${checkinId}/complete`, checkinData);
      return response.data;
    } catch (error) {
      console.error('Error completing check-in:', error);
      throw error;
    }
  },

  // Get check-in status
  getCheckinStatus: async (bookingId) => {
    try {
      const response = await api.get(`/checkin/status/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      throw error;
    }
  },

  // Get boarding pass
  getBoardingPass: async (bookingId, passengerId) => {
    try {
      const response = await api.get(`/checkin/boarding-pass/${bookingId}/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching boarding pass:', error);
      throw error;
    }
  },

  // Download boarding pass (PDF)
  downloadBoardingPass: async (bookingId, passengerId) => {
    try {
      const response = await api.get(
        `/checkin/boarding-pass/${bookingId}/${passengerId}/download`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading boarding pass:', error);
      throw error;
    }
  },

  // Cancel check-in
  cancelCheckin: async (checkinId) => {
    try {
      const response = await api.post(`/checkin/${checkinId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling check-in:', error);
      throw error;
    }
  },

  // Select seat during check-in
  selectSeat: async (checkinId, passengerId, seatNumber) => {
    try {
      const response = await api.post(`/checkin/${checkinId}/select-seat`, {
        passengerId,
        seatNumber,
      });
      return response.data;
    } catch (error) {
      console.error('Error selecting seat:', error);
      throw error;
    }
  },
};

export default checkinService;
