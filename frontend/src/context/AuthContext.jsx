import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.isAuthenticated()) {
          // Verify token is still valid by fetching profile
          const userData = await authService.getProfile();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      setError(errorMessage);
      throw error;
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setError(null);
      const data = await authService.login(email, password, rememberMe);
      console.log('Login response:', data);
      setUser(data.user);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const userData = await authService.updateProfile(profileData);
      setUser(userData);
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thất bại';
      setError(errorMessage);
      throw error;
    }
  };

  const updateContactInfo = async (contactData) => {
    try {
      setError(null);
      const userData = await authService.updateContactInfo(contactData);
      setUser(userData);
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thất bại';
      setError(errorMessage);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      setError(null);
      const data = await authService.changePassword(oldPassword, newPassword, confirmPassword);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updateContactInfo,
    changePassword,
    refreshUser,
    isAuthenticated: !!user,
    isEmailVerified: user?.account?.isEmailVerified || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
