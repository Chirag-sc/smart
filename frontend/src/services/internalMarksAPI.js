import api from './api';

const internalMarksAPI = {
  // Get internal marks for a specific student and course
  getStudentCourseMarks: async (studentId, courseId) => {
    try {
      const response = await api.get(`/internal-marks/student/${studentId}/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student course marks:', error);
      throw error;
    }
  },

  // Save internal marks for a student and course
  saveMarks: async (studentId, courseId, marks, subjectType) => {
    try {
      const response = await api.post('/internal-marks', {
        studentId,
        courseId,
        marks,
        subjectType
      });
      return response.data;
    } catch (error) {
      console.error('Error saving internal marks:', error);
      throw error;
    }
  },

  // Get all internal marks for a course
  getCourseMarks: async (courseId) => {
    try {
      const response = await api.get(`/internal-marks/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course marks:', error);
      throw error;
    }
  },

  // Update internal marks
  updateMarks: async (marksId, marks) => {
    try {
      const response = await api.put(`/internal-marks/${marksId}`, { marks });
      return response.data;
    } catch (error) {
      console.error('Error updating internal marks:', error);
      throw error;
    }
  },

  // Delete internal marks
  deleteMarks: async (marksId) => {
    try {
      const response = await api.delete(`/internal-marks/${marksId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting internal marks:', error);
      throw error;
    }
  },

  // Upload CIE marks from Excel file
  uploadCIEMarksExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/internal-marks/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading CIE marks Excel:', error);
      throw error;
    }
  },

  // Export CIE marks to Excel
  exportCIEMarksExcel: async (courseId) => {
    try {
      const response = await api.get(`/internal-marks/export-excel/${courseId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting CIE marks Excel:', error);
      throw error;
    }
  },

};

export default internalMarksAPI;
