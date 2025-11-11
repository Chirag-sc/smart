import api from './api';

const analyticsAPI = {
  // Get analytics overview
  getOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/overview?${queryString}`);
  },

  // Get performance analytics
  getPerformanceAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/performance?${queryString}`);
  },

  // Get attendance trends
  getAttendanceTrends: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/attendance-trends?${queryString}`);
  },

  // Get course performance comparison
  getCoursePerformance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/course-performance?${queryString}`);
  },

  // Get at-risk students
  getAtRiskStudents: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/at-risk-students?${queryString}`);
  },

  // Get student rankings
  getStudentRankings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/rankings?${queryString}`);
  },

  // Get department statistics
  getDepartmentStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/analytics/department-stats?${queryString}`);
  },

  // Test analytics endpoint
  testAnalytics: () => {
    return api.get('/analytics/test');
  }
};

export default analyticsAPI;
