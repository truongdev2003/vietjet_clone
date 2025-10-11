// Seat Service API
import api from '../config/axios';

const seatService = {
  // Get seats for a specific flight
  getSeatsByFlight: async (flightId) => {
    try {
      const response = await api.get(`/seats/flight/${flightId}/map`);
      return response.data.data?.seats || response.data.seats;
    } catch (error) {
      console.error('Error fetching seats:', error);
      throw error;
    }
  },

  // Get seat details
  getSeatById: async (seatId) => {
    try {
      const response = await api.get(`/seats/${seatId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seat:', error);
      throw error;
    }
  },

  // Reserve seats
  reserveSeats: async (reservationData) => {
    try {
      const response = await api.post('/seats/reserve', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error reserving seats:', error);
      throw error;
    }
  },

  // Release reserved seats
  releaseSeats: async (seatIds) => {
    try {
      const response = await api.post('/seats/release', { seatIds });
      return response.data;
    } catch (error) {
      console.error('Error releasing seats:', error);
      throw error;
    }
  },
};

export default seatService;
