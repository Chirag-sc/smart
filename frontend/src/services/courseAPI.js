import api, { } from './api';

const courseAPI = {
  // Get all courses
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch courses' };
    }
  },

  // Get a single course
  getCourse: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch course' };
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create course' };
    }
  },

  // Update a course
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await api.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update course' };
    }
  },

  // Delete a course
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete course' };
    }
  },

  // Study Material APIs
  uploadMaterial: async (courseId, formData) => {
    try {
      const response = await api.post(`/courses/${courseId}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload material' };
    }
  },
  getMaterials: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/materials`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch materials' };
    }
  },
  deleteMaterial: async (courseId, materialId) => {
    try {
      const response = await api.delete(`/courses/${courseId}/materials/${materialId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete material' };
    }
  }
};

export default courseAPI; 