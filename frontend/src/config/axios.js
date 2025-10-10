import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Enable cookies for CSRF
});

// Function to get CSRF token from cookie
const getCSRFTokenFromCookie = () => {
  const name = 'csrf-token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  console.log('🔍 Searching for CSRF token in cookies:', decodedCookie);
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      const token = cookie.substring(name.length);
      console.log('✅ Found CSRF token in cookie:', token.substring(0, 10) + '...');
      return token;
    }
  }
  
  console.log('⚠️ CSRF token not found in cookies');
  return null;
};

// Function to fetch CSRF token from server
const fetchCSRFToken = async () => {
  try {
    console.log('🔄 Fetching CSRF token from server...');
    const response = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true
    });
    const token = response.data.csrfToken;
    console.log('✅ CSRF token fetched successfully:', token.substring(0, 10) + '...');
    console.log('🍪 Cookie should be set by server');
    return token;
  } catch (error) {
    console.error('❌ Failed to fetch CSRF token:', error.response || error.message);
    return null;
  }
};

// Request interceptor - Add authentication token and CSRF token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add JWT token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for non-GET requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      let csrfToken = getCSRFTokenFromCookie();
      
      // If no CSRF token in cookie, fetch it
      if (!csrfToken) {
        console.log('⚠️ No CSRF token in cookie, fetching new one...');
        csrfToken = await fetchCSRFToken();
      }
      
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        console.log('✅ CSRF token added to request:', csrfToken.substring(0, 10) + '...');
      } else {
        console.error('❌ Failed to get CSRF token!');
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle CSRF token errors (403)
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error;
      
      // Check if it's a CSRF error
      if (errorCode?.includes('CSRF') || 
          errorCode?.includes('INVALID_CSRF') ||
          errorMessage?.toLowerCase().includes('csrf') ||
          errorMessage?.toLowerCase().includes('token bảo mật')) {
        
        console.log('🔄 CSRF token error, fetching new token...');
        
        // Fetch new CSRF token
        const csrfToken = await fetchCSRFToken();
        
        if (csrfToken && !originalRequest._csrfRetry) {
          originalRequest._csrfRetry = true;
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
          console.log('✅ Retrying request with new CSRF token');
          return axiosInstance(originalRequest);
        } else {
          console.error('❌ Failed to retry with new CSRF token');
        }
      }
    }

    // If token expired (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Update tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_URL };

