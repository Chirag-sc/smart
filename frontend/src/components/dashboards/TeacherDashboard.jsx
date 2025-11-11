import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import announcementAPI from '../../services/announcementAPI';
import studentAPI from '../../services/studentAPI';
import courseAPI from '../../services/courseAPI';
import teacherAPI from '../../services/teacherAPI';
import AnalyticsDashboard from './AnalyticsDashboard';
import ProfileSettings from '../ProfileSettings';
import CGPACalculator from '../CGPACalculator';
import CIECalculator from '../CIECalculator';
// import IntegrationManager from '../IntegrationManager';

const BACKEND_URL = 'http://localhost:5000';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Student management states
  const [students, setStudents] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    password: '',
    usn: '',
    branch: '',
    semester: '',
    cgpa: '',
    attendance: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // Bulk operations states
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Favorites states
  const [favoriteStudents, setFavoriteStudents] = useState([]);
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  
  // Import/Export states
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Course management states
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    title: '',
    description: '',
    credits: 1,
    department: '',
    semester: 1,
    subjectType: 'theory'
  });

  // Study material states
  const [materialModalCourse, setMaterialModalCourse] = useState(null);
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null });
  const [materialUploadLoading, setMaterialUploadLoading] = useState(false);
  const [materialError, setMaterialError] = useState(null);
  const [materials, setMaterials] = useState({}); // courseId -> materials array

  // Marks upload file state
  const [marksUploadFile, setMarksUploadFile] = useState(null);

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  
  // Profile settings state
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  
  // Integration manager state
  // const [showIntegrationManager, setShowIntegrationManager] = useState(false);

  // Attendance states
  const [attendanceSemester, setAttendanceSemester] = useState(1);
  const [attendanceData, setAttendanceData] = useState([]); // {subjectName, course, student, attendedClasses, totalClasses, percentage}
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceUploadFile, setAttendanceUploadFile] = useState(null);
  const [attendanceUploadMessage, setAttendanceUploadMessage] = useState(null);
  const [attendanceUploadError, setAttendanceUploadError] = useState(null);
  const [semesterCourses, setSemesterCourses] = useState([]); // courses in selected semester
  const [expandedCourses, setExpandedCourses] = useState({}); // code -> boolean

  // Attendance filter states
  const [attendanceFilterUSN, setAttendanceFilterUSN] = useState('');
  const [attendanceSort, setAttendanceSort] = useState('none'); // 'none', 'highest', 'lowest'

  // Marks states - mirroring attendance system
  const [marksSemester, setMarksSemester] = useState(1);
  const [marksData, setMarksData] = useState([]); // {subjectName, course, student, score, grade, percentage}
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState(null);
  const [marksUploadMessage, setMarksUploadMessage] = useState(null);
  const [marksUploadError, setMarksUploadError] = useState(null);
  const [marksSemesterCourses, setMarksSemesterCourses] = useState([]); // courses in selected semester
  const [expandedMarksCourses, setExpandedMarksCourses] = useState({}); // code -> boolean

  // Marks filter states
  const [marksFilterUSN, setMarksFilterUSN] = useState('');
  const [marksSort, setMarksSort] = useState('none'); // 'none', 'highest', 'lowest'

  // Derived data
  const averageAttendance = students.length > 0 
    ? Math.round(students.reduce((sum, student) => sum + (student.attendance || 0), 0) / students.length) + '%'
    : '0%';

  const recentAnnouncements = announcements.slice(0, 3);

  // Fetch data on component mount
  useEffect(() => {
    fetchAnnouncements();
    fetchStudents();
    fetchCourses();
  }, []);

  // Fetch students when the students tab is active
  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  // Fetch courses when the courses tab is active
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab]);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAnnouncements();
      setAnnouncements(response.data || []);
    } catch {
      setError('Failed to load announcements');
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getStudents();
      const sortedStudents = (response.data || []).sort((a, b) => {
        if (!a.usn) return 1;
        if (!b.usn) return -1;
        return a.usn.localeCompare(b.usn);
      });
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch {
      setError('Failed to load students');
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getCourses();
      setCourses(response.data || []);
    } catch {
      setError('Failed to load courses');
    }
  };

  // Fetch study materials for a course
  const fetchMaterials = async (courseId) => {
    try {
      const response = await courseAPI.getMaterials(courseId);
      setMaterials(prev => ({ ...prev, [courseId]: response.materials || [] }));
    } catch {
      setMaterials(prev => ({ ...prev, [courseId]: [] }));
    }
  };

  // Attendance functions
  const loadAttendanceForSemester = async (semester) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      // Ensure we have students
      const stuResp = students.length ? { data: students } : await studentAPI.getStudents();
      const allStudents = stuResp.data || [];

      // Load courses for the semester to build toggles
      const allCoursesResp = await courseAPI.getCourses();
      const semCourses = (allCoursesResp.data || []).filter(c => Number(c.semester) === Number(semester));
      setSemesterCourses(semCourses);
      // Reset expanded (collapsed by default)
      const initExpanded = {};
      for (const c of semCourses) initExpanded[c.code] = false;
      setExpandedCourses(initExpanded);

      // Fetch each student's attendance for the semester
      const results = await Promise.all(
        allStudents.map(async (stu) => {
          try {
            const resp = await studentAPI.getSemesterAttendance(stu._id, semester);
            const items = (resp.data || []).map((rec) => ({
              subjectName: rec.subjectName,
              course: rec.course,
              totalClasses: rec.totalClasses,
              attendedClasses: rec.attendedClasses,
              percentage: rec.percentage,
              student: { _id: stu._id, name: stu.name, usn: stu.usn },
            }));
            return items;
          } catch {
            return [];
          }
        })
      );

      const flat = results.flat();
      setAttendanceData(flat);
    } catch (e) {
      setAttendanceError(e.message || 'Failed to load attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceUpload = async () => {
    if (!attendanceUploadFile) {
      setAttendanceUploadError('Please select an Excel file');
      return;
    }
    setAttendanceUploadError(null);
    setAttendanceUploadMessage(null);
    setAttendanceLoading(true);
    try {
      const resp = await teacherAPI.uploadAttendanceFile(user.id || user._id, attendanceUploadFile);
      setAttendanceUploadMessage(resp.message || 'Attendance uploaded successfully');
      // Reload current semester attendance
      await loadAttendanceForSemester(attendanceSemester);
      setAttendanceUploadFile(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload attendance';
      const detailedErrors = err.response?.data?.errors;
      if (detailedErrors && detailedErrors.length > 0) {
        setAttendanceUploadError(`${errorMessage}:\n- ${detailedErrors.join('\n- ')}`);
      } else {
        setAttendanceUploadError(errorMessage);
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Add the teacher's ID to the announcement
      const announcementData = {
        ...newAnnouncement,
        teacherId: user._id
      };
      
      await announcementAPI.createAnnouncement(announcementData);
      
      // Reset form and close modal
      setNewAnnouncement({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAnnouncementModal(false);
      
      // Refresh announcements
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      date: new Date(announcement.date).toISOString().split('T')[0]
    });
    setShowAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      setLoading(true);
      await announcementAPI.deleteAnnouncement(announcementId);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError(err.message || 'Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await announcementAPI.updateAnnouncement(editingAnnouncement._id, newAnnouncement);
      
      // Reset form and close modal
      setNewAnnouncement({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingAnnouncement(null);
      setShowAnnouncementModal(false);
      
      // Refresh announcements
      fetchAnnouncements();
    } catch (err) {
      console.error('Error updating announcement:', err);
      setError(err.message || 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  // Student management functions
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setStudentFormData({
      name: '',
      email: '',
      password: '',
      usn: '',
      branch: '',
      semester: '',
      cgpa: '',
      attendance: ''
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setStudentFormData({
      name: student.name,
      email: student.email,
      password: '', // Don't pre-fill password for security
      usn: student.usn || '',
      branch: student.branch || '',
      semester: student.semester || '',
      cgpa: student.cgpa || '',
      attendance: student.attendance || ''
    });
    setShowStudentModal(true);
  };

  const handleViewStudent = async (student) => {
    try {
      setLoading(true);
      const response = await studentAPI.getStudent(student._id);
      setSelectedStudent(response.data);
      setShowStudentModal(true);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (selectedStudent) {
        // Update existing student
        await studentAPI.updateStudent(selectedStudent._id, studentFormData);
      } else {
        // Create new student
        await studentAPI.createStudent({
          ...studentFormData,
          role: 'student'
        });
      }
      
      // Reset form and close modal
      setStudentFormData({
        name: '',
        email: '',
        password: '',
        usn: '',
        branch: '',
        semester: '',
        cgpa: '',
        attendance: ''
      });
      setShowStudentModal(false);
      
      // Refresh students
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      setError(err.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        setLoading(true);
        await studentAPI.deleteStudent(studentId);
        fetchStudents();
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || JSON.stringify(err);
        console.error('Error deleting student:', errorMessage);
        setError(errorMessage || 'Failed to delete student');
      } finally {
        setLoading(false);
      }
    }
  };

  // Bulk operations functions
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select students first');
      return;
    }

    if (!bulkAction) {
      setError('Please select an action');
      return;
    }

    setBulkLoading(true);
    try {
      switch (bulkAction) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
            await Promise.all(selectedStudents.map(id => studentAPI.deleteStudent(id)));
            setSelectedStudents([]);
            fetchStudents();
          }
          break;
        case 'export':
          exportStudentsToCSV(selectedStudents);
          break;
        case 'print':
          handlePrintStudents();
          break;
        case 'favorite':
          setFavoriteStudents(prev => [...prev, ...selectedStudents.filter(id => !prev.includes(id))]);
          setSelectedStudents([]);
          break;
        case 'unfavorite':
          setFavoriteStudents(prev => prev.filter(id => !selectedStudents.includes(id)));
          setSelectedStudents([]);
          break;
        default:
          setError('Invalid action selected');
      }
    } catch (err) {
      setError(err.message || 'Bulk operation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportStudentsToCSV = (studentIds = null) => {
    const studentsToExport = studentIds 
      ? students.filter(s => studentIds.includes(s._id))
      : students;
    
    const csvContent = [
      ['Name', 'Email', 'USN', 'Branch', 'Semester', 'CGPA', 'Attendance'],
      ...studentsToExport.map(student => [
        student.name,
        student.email,
        student.usn || '',
        student.branch || '',
        student.semester || '',
        student.cgpa || '',
        student.attendance || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportStudents = async () => {
    if (!importFile) {
      setError('Please select a file');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      await studentAPI.importStudents(formData);
      setImportFile(null);
      setShowImportModal(false);
      fetchStudents();
      setError(null);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const toggleFavoriteStudent = (studentId) => {
    setFavoriteStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleFavoriteCourse = (courseId) => {
    setFavoriteCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Print functionality
  const handlePrintStudents = () => {
    const printWindow = window.open('', '_blank');
    const studentsToPrint = selectedStudents.length > 0 
      ? students.filter(s => selectedStudents.includes(s._id))
      : students;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1e40af; margin-bottom: 10px; }
            .header p { color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Total Students: ${studentsToPrint.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>USN</th>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>CGPA</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${studentsToPrint.map(student => `
                <tr>
                  <td>${student.usn || 'N/A'}</td>
                  <td>${student.name}</td>
                  <td>${student.email}</td>
                  <td>${student.branch || 'N/A'}</td>
                  <td>${student.semester || 'N/A'}</td>
                  <td>${student.cgpa || 'N/A'}</td>
                  <td>${student.attendance || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>ACAD-SYNC Education Management System</p>
            <p>This report was generated automatically</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Course management functions
  const handleAddCourse = () => {
    setSelectedCourse(null);
    setCourseFormData({ code: '', title: '', description: '', credits: 1, department: '', semester: 1, subjectType: 'theory' });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseFormData({
      code: course.code || '',
      title: course.title || '',
      description: course.description || '',
      credits: course.credits || 1,
      department: course.department || '',
      semester: course.semester || 1,
      subjectType: course.subjectType || 'theory'
    });
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        setLoading(true);
        await courseAPI.deleteCourse(courseId);
        fetchCourses();
      } catch {
        setError('Failed to delete course');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (selectedCourse) {
        await courseAPI.updateCourse(selectedCourse._id, courseFormData);
      } else {
        await courseAPI.createCourse(courseFormData);
      }
      setShowCourseModal(false);
      fetchCourses();
    } catch {
      setError('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  // Study material functions
  const handleOpenMaterialModal = (course) => {
    setMaterialModalCourse(course);
    setMaterialForm({ title: '', description: '', file: null });
    setMaterialError(null);
    // Only fetch if not already loaded
    if (!materials[course._id]) {
      fetchMaterials(course._id);
    }
  };

  const handleMaterialInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setMaterialForm(prev => ({ ...prev, file: files[0] }));
    } else {
      setMaterialForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!materialForm.file) {
      setMaterialError('Please select a file');
      return;
    }
    setMaterialUploadLoading(true);
    setMaterialError(null);
    try {
      const formData = new FormData();
      formData.append('title', materialForm.title);
      formData.append('description', materialForm.description);
      formData.append('file', materialForm.file);
      await courseAPI.uploadMaterial(materialModalCourse._id, formData);
      setMaterialForm({ title: '', description: '', file: null });
      fetchMaterials(materialModalCourse._id);
    } catch (err) {
      setMaterialError(err.message || 'Failed to upload material');
    } finally {
      setMaterialUploadLoading(false);
    }
  };

  const handleDeleteMaterial = async (courseId, materialId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      setLoading(true);
      await courseAPI.deleteMaterial(courseId, materialId);
      fetchMaterials(courseId);
    } catch (err) {
      console.error('Error deleting material:', err);
      setError(err.message || 'Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  // Marks functions - mirroring attendance system
  const loadMarksForSemester = async (semester) => {
    try {
      setMarksLoading(true);
      setMarksError(null);
      
      // Load courses for the semester to build toggles
      const allCoursesResp = await courseAPI.getCourses();
      const semCourses = (allCoursesResp.data || []).filter(c => Number(c.semester) === Number(semester));
      setMarksSemesterCourses(semCourses);
      // Reset expanded (collapsed by default)
      const initExpanded = {};
      for (const c of semCourses) initExpanded[c.code] = false;
      setExpandedMarksCourses(initExpanded);

      // Fetch marks for the semester
      const resp = await teacherAPI.getSemesterMarks(semester);
      const marksWithStudentInfo = (resp.data || []).map((mark) => ({
        subjectName: mark.subjectName,
        course: mark.course,
        score: mark.score,
        grade: mark.grade,
        percentage: Math.round((mark.score / 100) * 100), // Assuming score is out of 100
        student: { _id: mark.student._id, name: mark.student.name, usn: mark.student.usn },
      }));
      
      setMarksData(marksWithStudentInfo);
    } catch (e) {
      setMarksError(e.message || 'Failed to load marks');
    } finally {
      setMarksLoading(false);
    }
  };

  const handleMarksUpload = async (e) => {
    e.preventDefault();
    if (!marksUploadFile) {
      setMarksUploadError('Please select a file');
      return;
    }
    setMarksUploadError(null);
    setMarksUploadMessage(null);
    setMarksLoading(true);
    try {
      const resp = await teacherAPI.uploadMarksFile(user.id || user._id, marksUploadFile);
      setMarksUploadMessage(resp.message || 'Marks uploaded successfully');
      // Reload current semester marks
      await loadMarksForSemester(marksSemester);
      setMarksUploadFile(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload marks';
      const detailedErrors = err.response?.data?.errors;
      if (detailedErrors && detailedErrors.length > 0) {
        setMarksUploadError(`${errorMessage}:\n- ${detailedErrors.join('\n- ')}`);
      } else {
        setMarksUploadError(errorMessage);
      }
    } finally {
      setMarksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'upload-marks') {
      loadMarksForSemester(marksSemester);
    }
  }, [activeTab, marksSemester]);


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed z-40 inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <span className="text-xl font-bold text-blue-800">ACAD-SYNC</span>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <SidebarLink label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} />
            <SidebarLink label="Students" active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setSidebarOpen(false); }} />
            <SidebarLink label="Courses" active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setSidebarOpen(false); }} />
            <SidebarLink label="Upload Marks" active={activeTab === 'upload-marks'} onClick={() => { setActiveTab('upload-marks'); setSidebarOpen(false); }} />
            <SidebarLink label="Attendance" active={activeTab === 'attendance'} onClick={() => { setActiveTab('attendance'); setSidebarOpen(false); }} />
            <SidebarLink label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }} />
            {/* <SidebarLink label="Integrations" active={activeTab === 'integrations'} onClick={() => { setActiveTab('integrations'); setSidebarOpen(false); }} /> */}
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded hover:bg-blue-50 transition font-medium ${toolsDropdownOpen ? 'bg-blue-50' : ''}`}
                onClick={() => setToolsDropdownOpen((open) => !open)}
              >
                <span>Tools</span>
                <svg className={`h-4 w-4 ml-2 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {toolsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-lg z-10">
                  <button 
                    onClick={() => { setActiveTab('cgpa-calculator'); setToolsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                  >
                    CGPA Calculator
                  </button>
                  <button 
                    onClick={() => { setActiveTab('cie-calculator'); setToolsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                  >
                    CIE Calculator
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">Grade Converter</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">Attendance Tracker</button>
                </div>
              )}
            </div>
          </nav>
          <div className="px-6 py-4 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">{user?.name || 'Admin'}</span>
              <button 
                onClick={logout}
                className="bg-blue-700 px-3 py-1 rounded text-white hover:bg-blue-600 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      {/* Main Content */}
      <div className="flex-1 md:ml-5">
        {/* Topbar for mobile */}
        <header className="bg-blue-800 text-white py-4 md:hidden">
          <div className="w-full px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">ACAD-SYNC</h1>
            <button onClick={() => setSidebarOpen(true)}>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>
        <div className="py-8 w-full px-4 md:px-5">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h2>
            <div className="flex space-x-3">
              <button 
                onClick={toggleTheme}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {theme === 'light' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  )}
                </svg>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button 
                onClick={() => setShowProfileSettings(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profile Settings
              </button>
              <button 
                onClick={() => setShowAnnouncementModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create Announcement
              </button>
            </div>
          </div>
          
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard title="Total Students" value={students.length} />
                <DashboardCard title="Courses" value={courses.length} />
                <DashboardCard title="Average Attendance" value={averageAttendance} />
                <DashboardCard title="Upcoming Exams" value="2" />
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Recent Announcements</h3>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading announcements...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4 text-red-500">{error}</div>
                    ) : recentAnnouncements.length > 0 ? (
                      recentAnnouncements.map(announcement => (
                        <AnnouncementItem 
                          key={announcement._id}
                          title={announcement.title} 
                          date={new Date(announcement.date).toLocaleDateString()}
                          content={announcement.content}
                          onEdit={() => handleEditAnnouncement(announcement)}
                          onDelete={() => handleDeleteAnnouncement(announcement._id)}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No announcements yet</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Today's Schedule</h3>
                  <div className="space-y-3">
                    <ClassItem subject="Data Structures" time="10:00 AM - 11:00 AM" room="CS-201" />
                    <ClassItem subject="Computer Networks" time="11:15 AM - 12:15 PM" room="CS-202" />
                    <ClassItem subject="Database Systems" time="2:00 PM - 3:00 PM" room="CS-101" />
                    <ClassItem subject="Software Engineering" time="3:15 PM - 4:15 PM" room="CS-301" />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Students Tab Content */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Student Management</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowImportModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Import Students
                  </button>
                  <button 
                    onClick={() => exportStudentsToCSV()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Export All
                  </button>
                  <button 
                    onClick={handlePrintStudents}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                  >
                    Print All
                  </button>
                  <button 
                    onClick={handleAddStudent}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Student
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Bulk Actions */}
              {selectedStudents.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">
                      {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-2">
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1"
                      >
                        <option value="">Select Action</option>
                        <option value="export">Export Selected</option>
                        <option value="print">Print Selected</option>
                        <option value="favorite">Add to Favorites</option>
                        <option value="unfavorite">Remove from Favorites</option>
                        <option value="delete">Delete Selected</option>
                      </select>
                      <button
                        onClick={handleBulkAction}
                        disabled={!bulkAction || bulkLoading}
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {bulkLoading ? 'Processing...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setSelectedStudents([])}
                        className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading students...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                              onChange={handleSelectAllStudents}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(student => (
                            <tr key={student._id} className={selectedStudents.includes(student._id) ? 'bg-blue-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student._id)}
                                  onChange={() => handleSelectStudent(student._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.usn || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                <span>{student.name}</span>
                                <button
                                  onClick={() => toggleFavoriteStudent(student._id)}
                                  className="ml-2 text-yellow-400 hover:text-yellow-500"
                                >
                                  {favoriteStudents.includes(student._id) ? '★' : '☆'}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.branch || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.semester || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cgpa || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.attendance || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleViewStudent(student)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    View
                                  </button>
                                  <button 
                                    onClick={() => handleEditStudent(student)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteStudent(student._id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                              No students found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Courses Tab Content */}
          {activeTab === 'courses' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Course Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportStudentsToCSV()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Export Courses
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    onClick={handleAddCourse}
                  >
                    Add Course
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <div key={course._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{course.code}</h3>
                        <button
                          onClick={() => toggleFavoriteCourse(course._id)}
                          className="text-yellow-400 hover:text-yellow-500 text-xl"
                        >
                          {favoriteCourses.includes(course._id) ? '★' : '☆'}
                        </button>
                      </div>
                      <p className="text-gray-600 font-bold mb-2">{course.title}</p>
                      <p className="text-gray-500 mb-1">{course.description}</p>
                      <div className="text-sm text-gray-500 mb-1">Credits: {course.credits}</div>
                      <div className="text-sm text-gray-500 mb-1">Department: {course.department}</div>
                      <div className="text-sm text-gray-500 mb-1">Semester: {course.semester}</div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <button onClick={() => handleEditCourse(course)} className="text-blue-600 hover:text-blue-800">Edit</button>
                      <button onClick={() => handleDeleteCourse(course._id)} className="text-red-600 hover:text-red-800">Delete</button>
                      <button onClick={() => handleOpenMaterialModal(course)} className="text-green-600 hover:text-green-800">Study Material</button>
                    </div>
                    {/* Study Material List */}
                    {materials[course._id] && materials[course._id].length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Study Materials</h4>
                        <ul className="space-y-2">
                          {materials[course._id].map(mat => (
                            <li key={mat._id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <div>
                                <div className="font-medium text-blue-800">{mat.title}</div>
                                <div className="text-xs text-gray-500">{mat.description}</div>
                                <a href={`${BACKEND_URL}${mat.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">{mat.filename}</a>
                              </div>
                              <button onClick={() => handleDeleteMaterial(course._id, mat._id)} className="text-red-500 text-xs ml-2">Delete</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-gray-500 col-span-full text-center py-8">No courses found</div>
                )}
              </div>
              {/* Study Material Modal */}
              {materialModalCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Upload Study Material for {materialModalCourse.title}</h3>
                      <button onClick={() => setMaterialModalCourse(null)} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {materialError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{materialError}</div>}
                    <form onSubmit={handleMaterialUpload}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={materialForm.title}
                          onChange={handleMaterialInputChange}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                        <textarea
                          name="description"
                          value={materialForm.description}
                          onChange={handleMaterialInputChange}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          required
                          rows="2"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">File</label>
                        <input
                          type="file"
                          name="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.zip,.rar,.xls,.xlsx"
                          onChange={handleMaterialInputChange}
                          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <button type="button" onClick={() => setMaterialModalCourse(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={materialUploadLoading}>
                          {materialUploadLoading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </form>
                    {/* List uploaded materials in modal as well */}
                    {materials[materialModalCourse._id] && materials[materialModalCourse._id].length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 mb-2">Uploaded Materials</h4>
                        <ul className="space-y-2">
                          {materials[materialModalCourse._id].map(mat => (
                            <li key={mat._id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                              <div>
                                <div className="font-medium text-blue-800">{mat.title}</div>
                                <div className="text-xs text-gray-500">{mat.description}</div>
                                <a href={`${BACKEND_URL}${mat.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">{mat.filename}</a>
                              </div>
                              <button onClick={() => handleDeleteMaterial(materialModalCourse._id, mat._id)} className="text-red-500 text-xs ml-2">Delete</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload-marks' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">Student Marks</h3>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <select
                      value={marksSemester}
                      onChange={(e) => {
                        const sem = Number(e.target.value);
                        setMarksSemester(sem);
                        loadMarksForSemester(sem);
                      }}
                      className="mt-1 block w-48 border border-gray-300 rounded-md px-3 py-2"
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  {/* Marks Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Filter by USN</label>
                    <input
                      type="text"
                      value={marksFilterUSN}
                      onChange={e => setMarksFilterUSN(e.target.value)}
                      placeholder="Enter USN"
                      className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sort by %</label>
                    <select
                      value={marksSort}
                      onChange={e => setMarksSort(e.target.value)}
                      className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="none">None</option>
                      <option value="highest">Highest %</option>
                      <option value="lowest">Lowest %</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Excel</label>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setMarksUploadFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-64 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <button
                    onClick={handleMarksUpload}
                    disabled={!marksUploadFile || marksLoading}
                    className={`h-10 px-4 rounded-md ${!marksUploadFile || marksLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {marksLoading ? 'Uploading...' : 'Upload Marks'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('This will delete marks records for the selected semester. Continue?')) return;
                      try {
                        setMarksLoading(true);
                        setMarksError(null);
                        await teacherAPI.deleteMarks(user.id || user._id, { semester: marksSemester });
                        await loadMarksForSemester(marksSemester);
                      } catch (err) {
                        setMarksError(err.message || 'Failed to clear marks');
                      } finally {
                        setMarksLoading(false);
                      }
                    }}
                    className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Clear Marks
                  </button>
                </div>
              </div>

              {/* Course toggles for the selected semester */}
              {marksSemesterCourses.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {marksSemesterCourses.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setExpandedMarksCourses(prev => ({ ...prev, [c.code]: !prev[c.code] }))}
                      className={`px-3 py-1 rounded border ${expandedMarksCourses[c.code] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-600'}`}
                      title={expandedMarksCourses[c.code] ? 'Collapse' : 'Expand'}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}

              {marksUploadMessage && (
                <p className="mb-4 text-green-600">{marksUploadMessage}</p>
              )}
              {marksUploadError && (
                <p className="mb-4 text-red-600">{marksUploadError}</p>
              )}

              {marksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading marks...</p>
                </div>
              ) : marksError ? (
                <div className="text-center py-8 text-red-500">{marksError}</div>
              ) : marksData.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No marks records found for this semester.</div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Filter and sort marksData
                    let filtered = marksData;
                    if (marksFilterUSN) {
                      filtered = filtered.filter(row => row.student?.usn?.toLowerCase().includes(marksFilterUSN.toLowerCase()));
                    }
                    if (marksSort === 'highest') {
                      filtered = [...filtered].sort((a, b) => b.percentage - a.percentage);
                    } else if (marksSort === 'lowest') {
                      filtered = [...filtered].sort((a, b) => a.percentage - b.percentage);
                    }
                    // Group by course code as in attendance
                    const groups = {};
                    for (const rec of filtered) {
                      const code = rec.course?.code || 'UNKNOWN';
                      if (!groups[code]) groups[code] = [];
                      groups[code].push(rec);
                    }
                    const codes = Object.keys(groups);
                    if (codes.length === 0) return <div className="text-gray-500 text-center py-8">No marks records to display.</div>;
                    return codes.map((code) => (
                      <div key={code}>
                        {/* Section header with inline toggle (mirrors attendance) */}
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{code}</h4>
                          <button
                            onClick={() => setExpandedMarksCourses(prev => ({ ...prev, [code]: !prev[code] }))}
                            className={`px-3 py-1 rounded border ${expandedMarksCourses[code] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-600'}`}
                          >
                            {expandedMarksCourses[code] ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                        {expandedMarksCourses[code] && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {groups[code].map((row, idx) => (
                                  <tr key={`${code}-${idx}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.student?.usn || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.student?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.course?.code} - {row.course?.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.subjectName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.score}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.grade}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.percentage}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white rounded-lg shadow-md p-6">
               
               <h3 className="text-xl font-semibold mb-4">Attendance </h3>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                 
                 
                </div>
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <select
                      value={attendanceSemester}
                      onChange={(e) => {
                        const sem = Number(e.target.value);
                        setAttendanceSemester(sem);
                        loadAttendanceForSemester(sem);
                      }}
                      className="mt-1 block w-48 border border-gray-300 rounded-md px-3 py-2"
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  {/* Attendance Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Filter by USN</label>
                    <input
                      type="text"
                      value={attendanceFilterUSN}
                      onChange={e => setAttendanceFilterUSN(e.target.value)}
                      placeholder="Enter USN"
                      className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sort by %</label>
                    <select
                      value={attendanceSort}
                      onChange={e => setAttendanceSort(e.target.value)}
                      className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="none">None</option>
                      <option value="highest">Highest %</option>
                      <option value="lowest">Lowest %</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Excel</label>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setAttendanceUploadFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-64 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <button
                    onClick={handleAttendanceUpload}
                    disabled={!attendanceUploadFile || attendanceLoading}
                    className={`h-10 px-4 rounded-md ${!attendanceUploadFile || attendanceLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {attendanceLoading ? 'Uploading...' : 'Upload Attendance'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('This will delete attendance records for the selected semester. Continue?')) return;
                      try {
                        setAttendanceLoading(true);
                        setAttendanceError(null);
                        await teacherAPI.deleteAttendance(user.id || user._id, { semester: attendanceSemester });
                        await loadAttendanceForSemester(attendanceSemester);
                      } catch (err) {
                        setAttendanceError(err.message || 'Failed to clear attendance');
                      } finally {
                        setAttendanceLoading(false);
                      }
                    }}
                    className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Clear Attendance
                  </button>
                </div>
              </div>

              {/* Course toggles for the selected semester */}
              {semesterCourses.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {semesterCourses.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setExpandedCourses(prev => ({ ...prev, [c.code]: !prev[c.code] }))}
                      className={`px-3 py-1 rounded border ${expandedCourses[c.code] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-600'}`}
                      title={expandedCourses[c.code] ? 'Collapse' : 'Expand'}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}

              {attendanceUploadMessage && (
                <p className="mb-4 text-green-600">{attendanceUploadMessage}</p>
              )}
              {attendanceUploadError && (
                <p className="mb-4 text-red-600">{attendanceUploadError}</p>
              )}

              {attendanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading attendance...</p>
                </div>
              ) : attendanceError ? (
                <div className="text-center py-8 text-red-500">{attendanceError}</div>
              ) : attendanceData.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No attendance records found for this semester.</div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Filter and sort attendanceData
                    let filtered = attendanceData;
                    if (attendanceFilterUSN) {
                      filtered = filtered.filter(row => row.student?.usn?.toLowerCase().includes(attendanceFilterUSN.toLowerCase()));
                    }
                    if (attendanceSort === 'highest') {
                      filtered = [...filtered].sort((a, b) => b.percentage - a.percentage);
                    } else if (attendanceSort === 'lowest') {
                      filtered = [...filtered].sort((a, b) => a.percentage - b.percentage);
                    }
                    // Group by course code as before
                    const groups = {};
                    for (const rec of filtered) {
                      const code = rec.course?.code || 'UNKNOWN';
                      if (!groups[code]) groups[code] = [];
                      groups[code].push(rec);
                    }
                    const codes = Object.keys(groups);
                    if (codes.length === 0) return <div className="text-gray-500 text-center py-8">No attendance records to display.</div>;
                    return codes.map((code) => (
                      <div key={code}>
                        {/* Section header with inline toggle (mirrors top buttons) */}
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{code}</h4>
                          <button
                            onClick={() => setExpandedCourses(prev => ({ ...prev, [code]: !prev[code] }))}
                            className={`px-3 py-1 rounded border ${expandedCourses[code] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-600'}`}
                          >
                            {expandedCourses[code] ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                        {expandedCourses[code] && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USN</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {groups[code].map((row, idx) => (
                                  <tr key={`${code}-${idx}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.student?.usn || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.student?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.course?.code} - {row.course?.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.subjectName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.attendedClasses}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.totalClasses}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.percentage}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {/* Integrations Tab Content
          {activeTab === 'integrations' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Integration Manager</h3>
                <button
                  onClick={() => setShowIntegrationManager(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Manage Integrations
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                Google Classroom
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📚</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">Google Classroom</h4>
                      <p className="text-sm text-gray-500">Sync courses & assignments</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not Connected
                    </span>
                    <button
                      onClick={() => setShowIntegrationManager(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Setup →
                    </button>
                  </div>
                </div> */}

                {/* Zoom
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">🎥</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">Zoom</h4>
                      <p className="text-sm text-gray-500">Virtual meetings & classes</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not Connected
                    </span>
                    <button
                      onClick={() => setShowIntegrationManager(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Setup →
                    </button>
                  </div>
                </div> */}

                {/* SMS
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📱</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">SMS/WhatsApp</h4>
                      <p className="text-sm text-gray-500">Notifications & alerts</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not Connected
                    </span>
                    <button
                      onClick={() => setShowIntegrationManager(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Setup →
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Benefits of Integrations</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Automatically sync courses and students from Google Classroom</li>
                  <li>• Create and manage virtual classes with Zoom</li>
                  <li>• Send instant SMS notifications to students and parents</li>
                  <li>• Streamline your workflow with seamless data synchronization</li>
                </ul>
              </div>
            </div>
          )}
 */}

          {/* CGPA Calculator Tab Content */}
          {activeTab === 'cgpa-calculator' && (
            <CGPACalculator />
          )}

          {/* CIE Calculator Tab Content */}
          {activeTab === 'cie-calculator' && (
            <CIECalculator />
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</h3>
              <button 
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setEditingAnnouncement(null);
                  setNewAnnouncement({
                    title: '',
                    content: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={newAnnouncement.date}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                  Content
                </label>
                <textarea
                  id="content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  required
                ></textarea>
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingAnnouncement ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {selectedStudent ? (selectedStudent._id ? 'Edit Student' : 'View Student') : 'Add Student'}
              </h3>
              <button 
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {selectedStudent && selectedStudent._id && !studentFormData.name ? (
              // View mode
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                  <p className="text-gray-800">{selectedStudent.name}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <p className="text-gray-800">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">USN</label>
                  <p className="text-gray-800">{selectedStudent.usn || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Branch</label>
                  <p className="text-gray-800">{selectedStudent.branch || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                  <p className="text-gray-800">{selectedStudent.semester || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">CGPA</label>
                  <p className="text-gray-800">{selectedStudent.cgpa || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Attendance</label>
                  <p className="text-gray-800">{selectedStudent.attendance || 'N/A'}</p>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowStudentModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Add/Edit mode
              <form onSubmit={handleStudentSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentName">
                    Name
                  </label>
                  <input
                    id="studentName"
                    type="text"
                    value={studentFormData.name}
                    onChange={(e) => setStudentFormData({...studentFormData, name: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentEmail">
                    Email
                  </label>
                  <input
                    id="studentEmail"
                    type="email"
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({...studentFormData, email: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentPassword">
                    Password {selectedStudent && <span className="text-gray-500">(leave blank to keep current)</span>}
                  </label>
                  <input
                    id="studentPassword"
                    type="password"
                    value={studentFormData.password}
                    onChange={(e) => setStudentFormData({...studentFormData, password: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required={!selectedStudent}
                    autoComplete="current-password"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentUSN">
                    USN
                  </label>
                  <input
                    id="studentUSN"
                    type="text"
                    value={studentFormData.usn}
                    onChange={(e) => setStudentFormData({...studentFormData, usn: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentBranch">
                    Branch
                  </label>
                  <input
                    id="studentBranch"
                    type="text"
                    value={studentFormData.branch}
                    onChange={(e) => setStudentFormData({...studentFormData, branch: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentSemester">
                    Semester
                  </label>
                  <input
                    id="studentSemester"
                    type="text"
                    value={studentFormData.semester}
                    onChange={(e) => setStudentFormData({...studentFormData, semester: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentCGPA">
                    CGPA
                  </label>
                  <input
                    id="studentCGPA"
                    type="text"
                    value={studentFormData.cgpa}
                    onChange={(e) => setStudentFormData({...studentFormData, cgpa: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentAttendance">
                    Attendance
                  </label>
                  <input
                    id="studentAttendance"
                    type="text"
                    value={studentFormData.attendance}
                    onChange={(e) => setStudentFormData({...studentFormData, attendance: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStudentModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {selectedStudent ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : selectedStudent ? 'Update Student' : 'Add Student'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{selectedCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleCourseSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Code</label>
                <input
                  type="text"
                  value={courseFormData.code}
                  onChange={e => setCourseFormData({ ...courseFormData, code: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={e => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea
                  value={courseFormData.description}
                  onChange={e => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={courseFormData.credits}
                  onChange={e => setCourseFormData({ ...courseFormData, credits: Number(e.target.value) })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Department</label>
                <select
                  value={courseFormData.department}
                  onChange={e => setCourseFormData({ ...courseFormData, department: e.target.value })}
                                   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="IT">IT</option>
                  <option value="HUMANITIES">HUMANITIES</option>
                  <option value="SCIENCE">SCIENCE</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                <select
                  value={courseFormData.semester}
                  onChange={e => setCourseFormData({ ...courseFormData, semester: Number(e.target.value) })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Subject Type</label>
                <select
                  value={courseFormData.subjectType}
                  onChange={e => setCourseFormData({ ...courseFormData, subjectType: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="theory">Theory Only (e.g., Cloud, BA)</option>
                  <option value="theoryLab">Theory + Lab (e.g., SML, IPCC)</option>
                  <option value="lab">Lab Only (e.g., PPCL)</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <button type="button" onClick={() => setShowCourseModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={loading}>
                  {loading ? (selectedCourse ? 'Updating...' : 'Creating...') : (selectedCourse ? 'Update Course' : 'Add Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Students Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Import Students</h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Select CSV/Excel File</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                File should contain columns: Name, Email, USN, Branch, Semester, CGPA, Attendance
              </p>
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleImportStudents}
                disabled={!importFile || importLoading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
              >
                {importLoading ? 'Importing...' : 'Import Students'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings 
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />

      {/* Integration Manager Modal */}
      {/* <IntegrationManager 
        isOpen={showIntegrationManager}
        onClose={() => setShowIntegrationManager(false)}
      /> */}
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition ${
        active 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
};

const DashboardCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const AnnouncementItem = ({ title, date, content, onEdit, onDelete }) => {
  return (
    <div className="border-b border-gray-200 pb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{title}</h4>
          <span className="text-sm text-gray-500">{date}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button 
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="text-gray-600">{content}</p>
    </div>
  );
};

// ClassItem component
const ClassItem = ({ subject, time, room }) => (
  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
    <div>
      <h4 className="font-medium text-gray-800">{subject}</h4>
      <p className="text-sm text-gray-600">{room}</p>
    </div>
    <span className="text-sm font-medium text-blue-600">{time}</span>
  </div>
);

// SidebarLink component
const SidebarLink = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded font-medium transition ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'}`}
  >
    {label}
  </button>
);

export default TeacherDashboard;