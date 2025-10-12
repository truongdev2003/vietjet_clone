import api from '../config/axios';
import { FLIGHT_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Flight Service
 * Handles all flight-related API calls
 */
const flightService = {
  /**
   * Search for flights
   * @param {object} searchParams - Search parameters
   * @param {string} searchParams.from - Departure airport code
   * @param {string} searchParams.to - Arrival airport code
   * @param {string} searchParams.departDate - Departure date (YYYY-MM-DD)
   * @param {string} searchParams.returnDate - Return date (optional)
   * @param {number} searchParams.adults - Number of adults
   * @param {number} searchParams.children - Number of children
   * @param {number} searchParams.infants - Number of infants
   */
  searchFlights: async (searchParams) => {
    const response = await api.get(FLIGHT_ENDPOINTS.SEARCH, {
      params: searchParams,
    });
    return response.data;
  },

  /**
   * Get flight details by ID
   * @param {string} flightId - Flight ID
   */
  getFlightDetail: async (flightId) => {
    const response = await api.get(`${FLIGHT_ENDPOINTS.DETAIL}/${flightId}`);
    return response.data;
  },

  /**
   * Get flight schedules
   * @param {object} params - Query parameters
   */
  getFlightSchedules: async (params = {}) => {
    const response = await api.get(FLIGHT_ENDPOINTS.SCHEDULES, {
      params,
    });
    return response.data;
  },

  /**
   * Get flight status by flight number
   * @param {string} flightNumber - Flight number (e.g., VJ123)
   * @param {string} date - Flight date (YYYY-MM-DD)
   */
  getFlightStatusByNumber: async (flightNumber, date) => {
    const response = await api.get(FLIGHT_ENDPOINTS.STATUS, {
      params: {
        flightNumber,
        date,
      },
    });
    return response.data;
  },

  /**
   * Get flight status by route
   * @param {string} from - Departure airport code/city
   * @param {string} to - Arrival airport code/city
   * @param {string} departureDate - Departure date (YYYY-MM-DD)
   */
  getFlightStatusByRoute: async (from, to, departureDate) => {
    const response = await api.get(FLIGHT_ENDPOINTS.SEARCH, {
      params: {
        from,
        to,
        departureDate,
      },
    });
    return response.data;
  },
};

export default flightService;
