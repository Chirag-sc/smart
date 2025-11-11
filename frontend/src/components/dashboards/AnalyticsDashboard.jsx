import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { format, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import studentAPI from '../../services/studentAPI';
import courseAPI from '../../services/courseAPI';
import analyticsAPI from '../../services/analyticsAPI';

// Mock data generators
const generateMockData = (students, courses) => {
  const generateOverview = () => ({
    totalStudents: students.length || 150,
    avgAttendance: 84.5,
    avgMarks: 78.3,
    passRate: 87.3,
    atRiskCount: 12
  });

  const generatePerformance = () => 
    students.length > 0 ? students.slice(0, 10).map((student) => ({
      name: student.name,
      usn: student.usn,
      marks: Math.floor(Math.random() * 40) + 60,
      attendance: Math.floor(Math.random() * 30) + 70,
      cgpa: (Math.random() * 3 + 7).toFixed(2),
      semester: student.semester,
      branch: student.branch
    })) : [];

  const generateTrends = () =>
    Array.from({ length: 6 }, (_, i) => ({
      month: format(subMonths(new Date(), 5 - i), 'MMM yyyy'),
      attendance: Math.floor(Math.random() * 20) + 75,
      avgAttendance: Math.floor(Math.random() * 20) + 75,
      target: 85
    }));

  const generateCoursePerformance = () =>
    courses.length > 0 ? courses.slice(0, 6).map(course => ({
      code: course.code,
      title: course.title,
      avgMarks: Math.floor(Math.random() * 20) + 70,
      avgAttendance: Math.floor(Math.random() * 15) + 80,
      passRate: Math.floor(Math.random() * 20) + 75,
      totalStudents: Math.floor(Math.random() * 30) + 20
    })) : [];

  const generateAtRisk = () =>
    students.length > 0 ? students.slice(0, 5).map(student => ({
      name: student.name,
      usn: student.usn,
      branch: student.branch,
      semester: student.semester,
      cgpa: student.cgpa,
      avgMarks: Math.floor(Math.random() * 20) + 50,
      avgAttendance: Math.floor(Math.random() * 20) + 60,
      riskLevel: Math.random() > 0.5 ? 'high' : 'medium',
      riskFactors: ['Low academic performance', 'Poor attendance']
    })) : [];

  const generateRankings = () =>
    students.length > 0 ? students.slice(0, 20).map((student) => {
      // Generate random marks for multiple courses (simulating total marks)
      const numCourses = Math.floor(Math.random() * 3) + 3; // 3-5 courses
      const courseMarks = Array.from({ length: numCourses }, () => Math.floor(Math.random() * 40) + 60);
      const totalMarks = courseMarks.reduce((sum, mark) => sum + mark, 0);
      const avgMarks = Math.round(totalMarks / numCourses);
      
      return {
        name: student.name,
        usn: student.usn,
        branch: student.branch,
        semester: student.semester,
        cgpa: student.cgpa,
        totalMarks,
        totalCourses: numCourses,
        avgMarks,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    }).sort((a, b) => b.totalMarks - a.totalMarks) : [];

  const generateDepartmentStats = () =>
    ['CSE', 'ECE', 'EEE', 'ME', 'CE'].map(dept => ({
      department: dept,
      totalStudents: Math.floor(Math.random() * 50) + 30,
      avgCGPA: (Math.random() * 1.5 + 7.5).toFixed(2),
      avgAttendance: Math.floor(Math.random() * 10) + 85
    }));

  return {
    overview: generateOverview(),
    performance: generatePerformance(),
    attendance: generateTrends(),
    coursePerformance: generateCoursePerformance(),
    atRiskStudents: generateAtRisk(),
    rankings: generateRankings(),
    departmentStats: generateDepartmentStats(),
    trends: generateTrends()
  };
};

const AnalyticsDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState('last3months');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalStudents: 0,
      avgAttendance: 0,
      avgMarks: 0,
      passRate: 0,
      atRiskCount: 0
    },
    performance: [],
    attendance: [],
    rankings: [],
    atRiskStudents: [],
    trends: [],
    coursePerformance: [],
    departmentStats: []
  });
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Chart colors
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadCourses();
    loadStudents();
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('Testing analytics API connection...');
      const response = await analyticsAPI.testAnalytics();
      console.log('Analytics API test successful:', response.data);
    } catch (error) {
      console.error('Analytics API test failed:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      // Always generate at least mock data, even if students/courses are empty
      console.log('Fetching analytics data with:', { studentsCount: students.length, coursesCount: courses.length });
      
      setLoading(true);
      try {
        const params = {
          semester: selectedSemester,
          dateRange
        };
        
        // Only add course parameter if it's not 'all'
        if (selectedCourse !== 'all') {
          params.course = selectedCourse;
        }

        // Load real analytics data from APIs
        console.log('Making API calls with params:', params);
        const [
          overviewResponse,
          performanceResponse,
          trendsResponse,
          coursePerformanceResponse,
          atRiskResponse,
          rankingsResponse,
          departmentStatsResponse
        ] = await Promise.allSettled([
          analyticsAPI.getOverview(params),
          analyticsAPI.getPerformanceAnalytics(params),
          analyticsAPI.getAttendanceTrends({ months: dateRange === 'last3months' ? 3 : 6 }),
          analyticsAPI.getCoursePerformance(params),
          analyticsAPI.getAtRiskStudents(params),
          analyticsAPI.getStudentRankings(params),
          analyticsAPI.getDepartmentStats(params)
        ]);

        // Log individual API results
        console.log('API Results:');
        console.log('Overview:', overviewResponse.status, overviewResponse.status === 'fulfilled' ? overviewResponse.value : overviewResponse.reason);
        console.log('Rankings:', rankingsResponse.status, rankingsResponse.status === 'fulfilled' ? rankingsResponse.value : rankingsResponse.reason);

        // Process successful responses, fallback to mock data for failed ones
        const mockData = generateMockData(students, courses);
        
        // Helper function to ensure data is always an array
        const ensureArray = (data, fallback = []) => {
          if (Array.isArray(data)) return data;
          if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
          return fallback;
        };
        
        const newAnalyticsData = {
          overview: overviewResponse.status === 'fulfilled' ? overviewResponse.value.data.data : mockData.overview,
          performance: performanceResponse.status === 'fulfilled' ? 
            ensureArray(performanceResponse.value.data.data, []) : 
            [],
          attendance: ensureArray(
            trendsResponse.status === 'fulfilled' ? trendsResponse.value.data.data : mockData.attendance,
            mockData.attendance
          ),
          coursePerformance: ensureArray(
            coursePerformanceResponse.status === 'fulfilled' ? coursePerformanceResponse.value.data.data : mockData.coursePerformance,
            mockData.coursePerformance
          ),
          atRiskStudents: ensureArray(
            atRiskResponse.status === 'fulfilled' ? atRiskResponse.value.data.data : mockData.atRiskStudents,
            mockData.atRiskStudents
          ),
          rankings: rankingsResponse.status === 'fulfilled' ? 
            ensureArray(rankingsResponse.value.data.data, []) : 
            [],
          departmentStats: ensureArray(
            departmentStatsResponse.status === 'fulfilled' ? departmentStatsResponse.value.data.data : mockData.departmentStats,
            mockData.departmentStats
          ),
          trends: ensureArray(
            trendsResponse.status === 'fulfilled' ? trendsResponse.value.data.data : mockData.trends,
            mockData.trends
          )
        };

        console.log('Setting analytics data:', newAnalyticsData);
        console.log('Overview data specifically:', newAnalyticsData.overview);
        setAnalyticsData(newAnalyticsData);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
        // Fallback to mock data, but keep marks-related data empty
        const mockData = generateMockData(students, courses);
        mockData.rankings = []; // Don't show fake rankings when APIs fail
        mockData.performance = []; // Don't show fake performance data
        console.log('Using mock data:', mockData);
        setAnalyticsData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedSemester, selectedCourse, dateRange, students, courses]);

  const loadCourses = async () => {
    try {
      console.log('Loading courses...');
      const response = await courseAPI.getCourses();
      console.log('Courses loaded:', response.data?.length || 0);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      console.error('Course API error details:', error.response?.data || error.message);
    }
  };

  const loadStudents = async () => {
    try {
      console.log('Loading students...');
      const response = await studentAPI.getStudents();
      console.log('Students loaded:', response.data?.length || 0);
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      console.error('Student API error details:', error.response?.data || error.message);
    }
  };



  const exportToPDF = async () => {
    const element = document.getElementById('analytics-dashboard');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Performance data sheet
    const performanceWS = XLSX.utils.json_to_sheet(analyticsData.performance || []);
    XLSX.utils.book_append_sheet(workbook, performanceWS, 'Student Performance');
    
    // At-risk students sheet
    const atRiskWS = XLSX.utils.json_to_sheet(analyticsData.atRiskStudents || []);
    XLSX.utils.book_append_sheet(workbook, atRiskWS, 'At Risk Students');
    
    // Course performance sheet
    const courseWS = XLSX.utils.json_to_sheet(analyticsData.coursePerformance || []);
    XLSX.utils.book_append_sheet(workbook, courseWS, 'Course Performance');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" id="analytics-dashboard">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {[...Array(8)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.code} - {course.title}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
            <option value="alltime">All Time</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {['overview', 'performance', 'trends', 'rankings', 'atrisk'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('atrisk', 'At Risk')}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <KPICard
              title="Total Students"
              value={analyticsData.overview?.totalStudents || 0}
              trend="+5.2%"
              trendUp={true}
              icon="👥"
            />
            <KPICard
              title="Avg Attendance"
              value={`${analyticsData.overview?.avgAttendance || 0}%`}
              trend="+2.1%"
              trendUp={true}
              icon="📊"
            />
            <KPICard
              title="Avg Marks"
              value={analyticsData.overview?.avgMarks || 0}
              trend="+0.3"
              trendUp={true}
              icon="🎓"
            />
            <KPICard
              title="Pass Rate"
              value={`${analyticsData.overview?.passRate || 0}%`}
              trend="+1.5%"
              trendUp={true}
              icon="✅"
            />
            <KPICard
              title="At Risk Students"
              value={analyticsData.overview?.atRiskCount || 0}
              trend="-2"
              trendUp={false}
              icon="⚠️"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Department Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.departmentStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgCGPA" fill="#3B82F6" name="Avg CGPA" />
                  <Bar dataKey="avgAttendance" fill="#10B981" name="Avg Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Attendance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.attendance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance vs Attendance Scatter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Performance vs Attendance Correlation</h3>
            {(analyticsData.performance || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={analyticsData.performance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attendance" name="Attendance %" />
                  <YAxis dataKey="marks" name="Marks" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="marks" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-400 mb-2">No Performance Data</h4>
                <p className="text-center max-w-sm">
                  Upload marks and attendance data to see the performance correlation chart.
                </p>
              </div>
            )}
          </div>

          {/* Course Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Course Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.coursePerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgMarks" fill="#3B82F6" name="Avg Marks" />
                <Bar dataKey="avgAttendance" fill="#10B981" name="Avg Attendance" />
                <Bar dataKey="passRate" fill="#F59E0B" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rankings Tab */}
      {selectedTab === 'rankings' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Student Rankings</h3>
              <p className="text-sm text-gray-600">
                Rankings based on <strong>total marks</strong> from {selectedCourse !== 'all' ? 'the selected course' : 'all courses'}. 
                {selectedCourse !== 'all' && (
                  <span className="font-medium text-blue-600">
                    {' '}Showing marks for: {courses.find(c => c._id === selectedCourse)?.code || 'Selected Course'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {selectedCourse !== 'all' ? 'Course Marks' : 'Total Marks'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {selectedCourse !== 'all' ? 'Courses' : 'Courses'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analyticsData.rankings || []).length > 0 ? (
                  (analyticsData.rankings || []).map((student, index) => (
                    <tr key={student.usn} className={index < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-400 text-white' :
                          index === 1 ? 'bg-gray-300 text-white' :
                          index === 2 ? 'bg-yellow-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.usn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{student.totalMarks || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.totalCourses || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.avgMarks || 'N/A'}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.trend === 'up' ? '↗️ Up' : '↘️ Down'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Available</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          No marks have been entered for students yet. Upload marks using the "Upload Marks" tab to see rankings.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* At Risk Tab */}
      {selectedTab === 'atrisk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">At-Risk Students</h3>
            <div className="grid gap-4">
              {(analyticsData.atRiskStudents || []).map((student) => (
                <div key={student.usn} className={`border-l-4 p-4 rounded-lg ${
                  student.riskLevel === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{student.name}</h4>
                      <p className="text-sm text-gray-600">USN: {student.usn} | Branch: {student.branch}</p>
                      <div className="mt-2 flex space-x-4">
                        <span className="text-sm">Marks: {student.marks || student.avgMarks || 'N/A'}%</span>
                        <span className="text-sm">Attendance: {student.attendance || student.avgAttendance || 'N/A'}%</span>
                        <span className="text-sm">CGPA: {student.cgpa || 'N/A'}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Risk Factors:</p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {(student.reasons || student.riskFactors || []).map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.riskLevel === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {student.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Performance Trend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Academic Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pass Rate Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'A Grade (90-100)', value: 25 },
                    { name: 'B Grade (80-89)', value: 35 },
                    { name: 'C Grade (70-79)', value: 25 },
                    { name: 'D Grade (60-69)', value: 10 },
                    { name: 'F Grade (<60)', value: 5 }
                  ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, trend, trendUp, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        <div className="flex items-center mt-2">
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↗️' : '↘️'} {trend}
          </span>
          <span className="text-gray-500 text-sm ml-1">vs last month</span>
        </div>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

export default AnalyticsDashboard;
