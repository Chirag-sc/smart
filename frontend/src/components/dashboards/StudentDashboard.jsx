import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import studentAPI from '../../services/studentAPI';
import announcementAPI from '../../services/announcementAPI';
import courseAPI from '../../services/courseAPI';
import teacherAPI from '../../services/teacherAPI';
import CGPACalculator from '../CGPACalculator';
import CIECalculator from '../CIECalculator';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [studentProfile, setStudentProfile] = useState({
    usn: '',
    branch: '',
    semester: '',
    cgpa: '',
    attendance: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchStudentProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentAPI.getProfile();
      const studentData = response.user;
      
      if (!studentData) {
        throw new Error('No student data found');
      }
      
      setStudentProfile({
        usn: studentData.usn || '',
        branch: studentData.branch || '',
        semester: studentData.semester || '',
        cgpa: studentData.cgpa || '',
        attendance: studentData.attendance || ''
      });
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [courseMaterials, setCourseMaterials] = useState({});
  const [attendanceSemester, setAttendanceSemester] = useState(1);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]); // per-subject rows
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksError, setMarksError] = useState(null);
  const [marks, setMarks] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState(null);
  const [teachers, setTeachers] = useState([]);

  // React Query for Announcements
  const { 
    data: announcements = [], 
    isLoading: announcementsLoading, 
    error: announcementsError 
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await announcementAPI.getAnnouncements();
      return response.data || [];
    },
  });

  // React Query for Courses
  const { 
    data: courses = [], 
    isLoading: coursesLoading, 
    error: coursesError 
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await courseAPI.getCourses();
      return response.data || [];
    },
  });

  // Consolidated loading and error states for initial data
  const initialDataLoading = announcementsLoading || coursesLoading;
  const initialDataError = announcementsError || coursesError;

  const fetchCourseMaterials = useCallback(async (courseId) => {
    try {
      const response = await courseAPI.getMaterials(courseId);
      setCourseMaterials(prev => ({ ...prev, [courseId]: response.materials || [] }));
    } catch {
      setCourseMaterials(prev => ({ ...prev, [courseId]: [] }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'courses') {
      courses.forEach(course => {
        if (!courseMaterials[course._id]) {
          fetchCourseMaterials(course._id);
        }
      });
    }
  }, [activeTab, courses, courseMaterials, fetchCourseMaterials]);

  const loadAttendance = useCallback(async (semester) => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      const resp = await studentAPI.getMyAttendance(semester);
      setAttendanceData(resp.data || []);
    } catch (e) {
      setAttendanceError(e.message || 'Failed to load attendance');
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const loadMarks = useCallback(async () => {
    try {
      setMarksLoading(true);
      setMarksError(null);
      const resp = await studentAPI.getMyMarks();
      setMarks(resp.data || []);
    } catch (e) {
      setMarksError(e.message || 'Failed to load marks');
    } finally {
      setMarksLoading(false);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    try {
      setTeachersLoading(true);
      setTeachersError(null);
      const resp = await teacherAPI.getTeachers();
      setTeachers(resp.data || []);
    } catch (e) {
      setTeachersError(e.message || 'Failed to load teachers');
    } finally {
      setTeachersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendance(attendanceSemester);
    }
  }, [activeTab, attendanceSemester, loadAttendance]);

  useEffect(() => {
    if (activeTab === 'performance') {
      loadMarks();
    }
  }, [activeTab, loadMarks]);

  useEffect(() => {
    if (activeTab === 'teachers') {
      loadTeachers();
    }
  }, [activeTab, loadTeachers]);

  const recentAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ACAD-SYNC</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user?.name || 'Student'}</span>
              <button 
                onClick={logout}
                className="bg-blue-700 px-4 py-1 rounded hover:bg-blue-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Student Dashboard</h2>
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
          </div>
        </div>
        
        <div className="flex border-b border-gray-200 mb-8">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            label="Overview"
          />
          <TabButton 
            active={activeTab === 'courses'} 
            onClick={() => setActiveTab('courses')}
            label="Courses"
          />
          <TabButton 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')}
            label="Attendance"
          />
         
          <TabButton 
            active={activeTab === 'performance'} 
            onClick={() => setActiveTab('performance')}
            label="Performance"
          />
          <TabButton 
            active={activeTab === 'teachers'} 
            onClick={() => setActiveTab('teachers')}
            label="Teachers"
          />
          <TabButton 
            active={activeTab === 'cgpa-calculator'} 
            onClick={() => setActiveTab('cgpa-calculator')}
            label="CGPA Calculator"
          />
          <TabButton 
            active={activeTab === 'cie-calculator'} 
            onClick={() => setActiveTab('cie-calculator')}
            label="CIE Calculator"
          />
        </div>
        
        {(loading || initialDataLoading) && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        )}
        
        {(error || initialDataError) && !(loading || initialDataLoading) && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-2">Error</div>
              <p className="text-gray-600">{error || initialDataError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <DashboardCard title="CGPA" value={studentProfile.cgpa || 'N/A'} />
                  <DashboardCard title="Attendance" value={studentProfile.attendance || 'N/A'} />
                  <DashboardCard title="Courses" value={courses.length} />
                  <DashboardCard title="Upcoming Exams" value="2" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Recent Announcements</h3>
                    <div className="space-y-4">
                      {recentAnnouncements.map(a => (
                        <AnnouncementItem key={a._id} title={a.title} date={new Date(a.date).toLocaleDateString()} content={a.content} />
                      ))}
                      {announcements.length === 0 && <p className="text-gray-500 text-center py-4">No announcements yet</p>}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Your Courses</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {courses.map(course => (
                        <div key={course._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="font-bold text-blue-800">{course.code} - {course.title}</div>
                          <div className="text-gray-600 text-sm mt-1">{course.description}</div>
                          <div className="text-gray-500 text-xs mt-2">Credits: {course.credits} | Dept: {course.department} | Sem: {course.semester}</div>
                        </div>
                      ))}
                      {courses.length === 0 && <p className="text-gray-500 text-center py-4">No courses found</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'courses' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-6">Your Courses</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <div key={course._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{course.code}</h3>
                        <p className="text-gray-600 font-bold mb-2">{course.title}</p>
                        <p className="text-gray-500 mb-1">{course.description}</p>
                        <div className="text-sm text-gray-500 mb-1">Credits: {course.credits}</div>
                        <div className="text-sm text-gray-500 mb-1">Department: {course.department}</div>
                        <div className="text-sm text-gray-500 mb-1">Semester: {course.semester}</div>
                      </div>
                      {courseMaterials[course._id] && courseMaterials[course._id].length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Study Materials</h4>
                          <ul className="space-y-2">
                            {courseMaterials[course._id].map(mat => (
                              <li key={mat._id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                <div>
                                  <div className="font-medium text-blue-800">{mat.title}</div>
                                  <div className="text-xs text-gray-500">{mat.description}</div>
                                  <a href={`${BACKEND_URL}${mat.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs">{mat.filename}</a>
                                </div>
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
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-end justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Attendance (by Subject)</h3>
                    <p className="text-sm text-gray-500">Select semester to view attendance per subject</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <select
                      value={attendanceSemester}
                      onChange={(e) => { const s = Number(e.target.value); setAttendanceSemester(s); }}
                      className="mt-1 block w-48 border border-gray-300 rounded-md px-3 py-2"
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading attendance...</p>
                  </div>
                ) : attendanceError ? (
                  <div className="text-center py-8 text-red-500">{attendanceError}</div>
                ) : attendanceData.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No attendance records found for this semester.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.map((row, idx) => (
                          <tr key={idx}>
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
            )}

            {activeTab === 'performance' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-6">Academic Performance</h3>
                {marksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading performance...</p>
                  </div>
                ) : marksError ? (
                  <div className="text-center py-8 text-red-500">{marksError}</div>
                ) : marks.length === 0 ? (
                  <p className="text-gray-500">No performance data available</p>
                ) : (
                  <div className="space-y-4">
                    {marks.map((m) => (
                      <div key={m._id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                        <h4 className="font-medium text-gray-800">{m.subjectName} ({m.course?.code})</h4>
                        <div className="flex space-x-4">
                          <span className="text-gray-600">Score: {m.score}</span>
                          <span className="font-semibold text-blue-600">Grade: {m.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-6">Teachers</h3>
                {teachersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading teachers...</p>
                  </div>
                ) : teachersError ? (
                  <div className="text-center py-8 text-red-500">{teachersError}</div>
                ) : teachers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No teachers found</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map(teacher => (
                      <TeacherCard key={teacher._id} teacher={teacher} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CGPA Calculator Tab Content */}
            {activeTab === 'cgpa-calculator' && (
              <CGPACalculator />
            )}

            {/* CIE Calculator Tab Content */}
            {activeTab === 'cie-calculator' && (
              <CIECalculator />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition ${active 
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

const AnnouncementItem = ({ title, date, content }) => {
  return (
    <div className="border-b border-gray-200 pb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <p className="text-gray-600">{content}</p>
    </div>
  );
};

const TeacherCard = ({ teacher }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          {teacher.profilePicture?.url ? (
            <img
              src={`${BACKEND_URL}${teacher.profilePicture.url}`}
              alt={teacher.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-blue-600">
              {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{teacher.name}</h3>
          <p className="text-sm text-gray-600">{teacher.email}</p>
          {teacher.department && (
            <p className="text-sm text-gray-500">{teacher.department}</p>
          )}
        </div>
      </div>
      
      {teacher.personalInfo?.bio && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 italic">"{teacher.personalInfo.bio}"</p>
        </div>
      )}
      
      {teacher.courses && teacher.courses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Courses Taught:</h4>
          <div className="flex flex-wrap gap-2">
            {teacher.courses.map((course, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                title={`${course.code} - ${course.title} (Semester ${course.semester})`}
              >
                {course.code}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {teacher.personalInfo?.interests && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Interests:</h4>
          <p className="text-sm text-gray-600">{teacher.personalInfo.interests}</p>
        </div>
      )}
      
      {(teacher.personalInfo?.linkedin || teacher.personalInfo?.github) && (
        <div className="mt-4 flex space-x-3">
          {teacher.personalInfo.linkedin && (
            <a
              href={teacher.personalInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              LinkedIn
            </a>
          )}
          {teacher.personalInfo.github && (
            <a
              href={teacher.personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Removed unused components: ClassItem, CourseCard

export default StudentDashboard;
