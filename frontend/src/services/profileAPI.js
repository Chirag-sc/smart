import api from './api';

const profileAPI = {
  // Upload profile picture
  uploadProfilePicture: async (formData) => {
    try {
      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload profile picture' };
    }
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    try {
      const response = await api.delete('/profile/picture');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete profile picture' };
    }
  },

  // Get user preferences
  getUserPreferences: async () => {
    try {
      console.log('Fetching user preferences...');
      const response = await api.get('/profile/preferences');
      console.log('User preferences response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error.response?.data || { message: 'Failed to fetch preferences' };
    }
  },

  // Update user preferences
  updateUserPreferences: async (preferences) => {
    try {
      const response = await api.put('/profile/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update preferences' };
    }
  },

  // Update theme preference
  updateTheme: async (theme) => {
    try {
      const response = await api.put('/profile/preferences', {
        preferences: { theme }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update theme' };
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (notificationPreferences) => {
    try {
      const response = await api.put('/profile/preferences', {
        notificationPreferences
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update notification preferences' };
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings) => {
    try {
      const response = await api.put('/profile/preferences', {
        privacySettings
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update privacy settings' };
    }
  },

  // Update personal information
  updatePersonalInfo: async (personalInfo) => {
    try {
      const response = await api.put('/profile/preferences', {
        personalInfo
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update personal information' };
    }
  },

  // Export user data
  exportUserData: async () => {
    try {
      const response = await api.get('/profile/export');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export data' };
    }
  },

  // Deactivate account
  deactivateAccount: async () => {
    try {
      const response = await api.put('/profile/deactivate');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to deactivate account' };
    }
  },

  // Delete account
  deleteAccount: async () => {
    try {
      const response = await api.delete('/profile/account');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  }
};

export default profileAPI;
