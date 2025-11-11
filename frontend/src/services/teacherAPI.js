import api from './api';

const BACKEND_URL = 'http://localhost:5000';

// Teacher API
export const teacherAPI = {
  // Get teacher profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get teacher profile' };
    }
  },

  // Get all teachers (for students to view)
  getTeachers: async () => {
    try {
      const response = await api.get('/teachers');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get teachers' };
    }
  },

  // Update teacher profile
  updateProfile: async (teacherId, data) => {
    try {
      const response = await api.put(`/teachers/${teacherId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update teacher profile' };
    }
  },

  // Get all students
  getStudents: async () => {
    try {
      const response = await api.get('/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get students' };
    }
  },

  // Get student details
  getStudent: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get student details' };
    }
  },

  // Update student attendance
  updateAttendance: async (studentId, data) => {
    try {
      const response = await api.put(`/students/${studentId}/attendance`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update attendance' };
    }
  },

  // Get teacher's courses
  getCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get courses' };
    }
  },

  // Create a new course
  createCourse: async (data) => {
    try {
      const response = await api.post('/courses', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create course' };
    }
  },

  // Update a course
  updateCourse: async (courseId, data) => {
    try {
      const response = await api.put(`/courses/${courseId}`, data);
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

  // Create announcement
  createAnnouncement: async (data) => {
    try {
      const response = await api.post('/announcements', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create announcement' };
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

  // Get teacher's schedule
  getSchedule: async () => {
    try {
      const response = await api.get('/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get schedule' };
    }
  },

  // Upload marks Excel file
  uploadMarksFile: async (teacherId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/teachers/${teacherId}/upload-marks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload marks file' };
    }
  },

  // Upload attendance Excel file
  uploadAttendanceFile: async (teacherId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/teachers/${teacherId}/upload-attendance`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload attendance file' };
    }
  },

  // Delete attendance (optionally filter by semester/courseCode/subject)
  deleteAttendance: async (teacherId, { semester, courseCode, subject } = {}) => {
    try {
      const params = new URLSearchParams();
      if (semester) params.append('semester', String(semester));
      if (courseCode) params.append('courseCode', courseCode);
      if (subject) params.append('subject', subject);
      const qs = params.toString();
      const url = `/teachers/${teacherId}/attendance${qs ? `?${qs}` : ''}`;
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete attendance' };
    }
  },

  // Get marks data
  getMarksData: async (teacherId) => {
    // Adjust the endpoint as per your backend API
    return await fetch(`${BACKEND_URL}/api/marks/teacher/${teacherId}`)
      .then(res => res.json());
  },

  // Get marks data for a specific semester
  getSemesterMarks: async (semester) => {
    try {
      const response = await api.get(`/marks/semester/${semester}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get semester marks' };
    }
  },

  // Delete marks (optionally filter by semester/courseCode/subject)
  deleteMarks: async (teacherId, { semester, courseCode, subject } = {}) => {
    try {
      const params = new URLSearchParams();
      if (semester) params.append('semester', String(semester));
      if (courseCode) params.append('courseCode', courseCode);
      if (subject) params.append('subject', subject);
      const qs = params.toString();
      const url = `/teachers/${teacherId}/marks${qs ? `?${qs}` : ''}`;
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete marks' };
    }
  },
};

export default teacherAPI;