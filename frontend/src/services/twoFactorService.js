import api from '../config/axios';

const twoFactorService = {
  // Setup 2FA - Generate QR code and secret
  setup: async () => {
    const response = await api.post('/2fa/setup');
    return response.data.data;
  },

  // Verify setup and enable 2FA
  verifySetup: async (token) => {
    const response = await api.post('/2fa/verify-setup', { token });
    return response.data.data;
  },

  // Verify 2FA token during login
  verify: async (userId, token, tempToken) => {
    const response = await api.post('/2fa/verify', {
      userId,
      token,
      tempToken
    });
    
    // Save tokens to localStorage if successful
    if (response.data.data.tokens) {
      localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data.data;
  },

  // Disable 2FA
  disable: async (password) => {
    const response = await api.post('/2fa/disable', { password });
    return response.data;
  },

  // Get 2FA status
  getStatus: async () => {
    const response = await api.get('/2fa/status');
    return response.data.data;
  },

  // Regenerate backup codes
  regenerateBackupCodes: async () => {
    const response = await api.post('/2fa/regenerate-backup-codes');
    return response.data.data;
  }
};

export default twoFactorService;
