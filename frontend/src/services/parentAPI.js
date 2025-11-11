import api from './api';

// Parent API
export const parentAPI = {
  // Get parent profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get parent profile' };
    }
  },

  // Update parent profile
  updateProfile: async (parentId, data) => {
    try {
      const response = await api.put(`/parents/${parentId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update parent profile' };
    }
  },

  // Get children information
  getChildren: async (parentId) => {
    try {
      // Fetch the parent and return the children array
      const response = await api.get(`/parents/${parentId}`);
      // The children are in response.data.data.children
      return { data: response.data.data.children };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get children information' };
    }
  },

  // Get child's attendance
  getChildAttendance: async (childId) => {
    try {
      const response = await api.get(`/students/${childId}/attendance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get child attendance' };
    }
  },

  // Get child's academic performance
  getChildPerformance: async (childId) => {
    try {
      const response = await api.get(`/students/${childId}/performance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get child performance' };
    }
  },

  // Get announcements
  getAnnouncements: async () => {
    try {
      const response = await api.get('/announcements');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get announcements' };
    }
  },

  // Get fee information
  getFeeInfo: async (childId) => {
    try {
      const response = await api.get(`/students/${childId}/fees`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get fee information' };
    }
  },

  // Get child's marks
  getChildMarks: async (childId) => {
    try {
      const response = await api.get(`/students/${childId}/marks`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get child marks' };
    }
  },
};

export default parentAPI; 