import api from './api';

const announcementAPI = {
  // Create a new announcement
  createAnnouncement: async (announcementData) => {
    try {
      const response = await api.post('/announcements', announcementData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create announcement' };
    }
  },

  // Get all announcements
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch announcements' };
    }
  },

  // Delete an announcement
  deleteAnnouncement: async (announcementId) => {
    try {
      const response = await api.delete(`/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete announcement' };
    }
  },

  // Update an announcement
  updateAnnouncement: async (announcementId, updateData) => {
    try {
      const response = await api.put(`/announcements/${announcementId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update announcement' };
    }
  }
};

export default announcementAPI; 