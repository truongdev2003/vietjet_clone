import api from '../config/axios';
import { AUTH_ENDPOINTS } from '../constants/apiEndpoints';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
    if (response.data.tokens) {
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Login user
  login: async (email, password, rememberMe = false) => {
    const response = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password, rememberMe });
    if (response.data.data.tokens) {
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  // Logout user
  logout: async () => {
    try {
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get(AUTH_ENDPOINTS.PROFILE);
     if (response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put(AUTH_ENDPOINTS.PROFILE, profileData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Update contact info
  updateContactInfo: async (contactData) => {
    const response = await api.put(AUTH_ENDPOINTS.CONTACT_INFO, contactData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`${AUTH_ENDPOINTS.VERIFY_EMAIL}/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (email) => {
    const response = await api.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
    return response.data;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

export default authService;
