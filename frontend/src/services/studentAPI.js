import api, { cachedApi } from './api';

// Student API
const studentAPI = {
  // Get all students
  getStudents: async () => {
    try {
      const response = await api.get('/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch students' };
    }
  },

  // Get a single student
  getStudent: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch student' };
    }
  },

  // Create a new student
  createStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create student' };
    }
  },

  // Update a student
  updateStudent: async (studentId, studentData) => {
    try {
      const response = await api.put(`/students/${studentId}`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update student' };
    }
  },

  // Delete a student
  deleteStudent: async (studentId) => {
    try {
      const response = await api.delete(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete student' };
    }
  },

  // Import students from CSV/Excel
  importStudents: async (formData) => {
    try {
      const response = await api.post('/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to import students' };
    }
  },

  // Get student attendance
  getStudentAttendance: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/attendance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch student attendance' };
    }
  },

  // Get student's attendance for a semester
  getSemesterAttendance: async (studentId, semester) => {
    try {
      const response = await api.get(`/students/${studentId}/attendance/semester/${semester}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch semester attendance' };
    }
  },

  // Get all marks for a student
  getStudentMarks: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/marks`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch student marks' };
    }
  },

  // Update student attendance
  updateStudentAttendance: async (studentId, attendanceData) => {
    try {
      const response = await api.put(`/students/${studentId}/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update student attendance' };
    }
  },

  // Get student profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get student profile' };
    }
  },

  // Update student profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/profile', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update student profile' };
    }
  },

  // Get student courses
  getCourses: async () => {
    try {
      const response = await cachedApi.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get courses' };
    }
  },

  // Get student announcements
  getAnnouncements: async () => {
    try {
      const response = await cachedApi.get('/announcements');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get announcements' };
    }
  },

  // Get student schedule
  getSchedule: async () => {
    try {
      const response = await api.get('/schedule');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get schedule' };
    }
  },

  // Get student's own attendance (student-specific route)
  getMyAttendance: async (semester) => {
    try {
      const response = await api.get(`/student/attendance/semester/${semester}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendance' };
    }
  },

  // Get student's own marks (student-specific route)
  getMyMarks: async () => {
    try {
      const response = await api.get('/student/marks');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch marks' };
    }
  }
};

export default studentAPI; 