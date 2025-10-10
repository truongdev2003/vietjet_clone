import axios from 'axios';
import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Hook to fetch and maintain CSRF token
 * Automatically fetches CSRF token when component mounts
 */
const useCSRF = () => {
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        await axios.get(`${API_URL}/csrf-token`, {
          withCredentials: true
        });
        console.log('✅ CSRF token fetched successfully');
      } catch (error) {
        console.error('❌ Failed to fetch CSRF token:', error);
      }
    };

    // Fetch CSRF token on mount
    fetchCSRFToken();

    // Refresh CSRF token every 30 minutes
    const interval = setInterval(fetchCSRFToken, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};

export default useCSRF;
