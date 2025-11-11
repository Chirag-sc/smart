import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import parentAPI from '../../services/parentAPI';
import announcementAPI from '../../services/announcementAPI';

const ParentDashboard = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childAttendance, setChildAttendance] = useState(0);
  const [childMarks, setChildMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Derived data
  const recentAnnouncements = announcements.slice(0, 3);
  
  const fetchChildData = async (childId) => {
    try {
      const attendanceData = await parentAPI.getChildAttendance(childId);
      const marksData = await parentAPI.getChildMarks(childId);
      setChildAttendance(attendanceData.data.attendance || 0);
      setChildMarks(marksData.data || []);
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  };

  const fetchInitialData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch parent profile
      const profileData = await parentAPI.getProfile();
      setProfile(profileData.user);
      
      // Fetch children information
      if (profileData.user.id) {
        const childrenData = await parentAPI.getChildren(profileData.user.id);
        setChildren(childrenData.data || []);
        
        // If there are children, select the first one by default
        if (childrenData.data && childrenData.data.length > 0) {
          setSelectedChild(childrenData.data[0]);
          await fetchChildData(childrenData.data[0]._id);
        }
      }
      
      // Fetch announcements from API
      const announcementData = await announcementAPI.getAnnouncements();
      setAnnouncements(announcementData.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  // Handle child selection
  const handleChildSelect = async (child) => {
    try {
      setSelectedChild(child);
      await fetchChildData(child._id);
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ACAD-SYNC</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {profile?.name || 'Parent'}</span>
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
          <h2 className="text-3xl font-bold text-gray-800">Parent Dashboard</h2>
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
        
        {children.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Student Information</h3>
              
              {children.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student:
                  </label>
                  <div className="flex space-x-2">
                    {children.map(child => (
                      <button
                        key={child._id}
                        onClick={() => handleChildSelect(child)}
                        className={`px-4 py-2 rounded ${
                          selectedChild && selectedChild._id === child._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedChild && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 mb-2">Student Name: <span className="font-medium text-gray-800">{selectedChild.name}</span></p>
                    <p className="text-gray-600 mb-2">Student ID: <span className="font-medium text-gray-800">{selectedChild.usn}</span></p>
                    <p className="text-gray-600 mb-2">Branch: <span className="font-medium text-gray-800">{selectedChild.branch}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">CGPA: <span className="font-medium text-gray-800">{selectedChild.cgpa || 'N/A'}</span></p>
                    
                    <p className="text-gray-600 mb-2">Semester: <span className="font-medium text-gray-800">{selectedChild.semester}</span></p>
                   
                    <p className="text-gray-600 mb-2">Attendance: <span className="font-medium text-gray-800">{childAttendance}%</span></p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <DashboardCard title="Attendance" value={`${childAttendance}%`} />
              <DashboardCard title="Current CGPA" value={selectedChild?.cgpa || "0.0"} />
              <DashboardCard title="Pending Fees" value="₹0" />
              <DashboardCard title="Upcoming Tests" value="2" />
              
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Academic Performance</h3>
                <div className="space-y-4">
                  {childMarks.length > 0 ? (
                    childMarks.map(mark => (
                      <SubjectPerformance 
                        key={mark._id}
                        subject={mark.subjectName} 
                        marks={mark.score} 
                        grade={mark.grade} 
                      />
                    ))
                  ) : (
                    <p className="text-gray-500">No academic performance data available</p>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Announcements</h3>
                <div className="space-y-4">
                  {recentAnnouncements.map(announcement => (
                    <AnnouncementItem 
                      key={announcement._id}
                      title={announcement.title} 
                      date={new Date(announcement.date).toLocaleDateString()}
                      content={announcement.content}
                    />
                  ))}
                  {announcements.length === 0 && <p className="text-gray-500 text-center py-4">No announcements yet</p>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No children registered under your account.</p>
            <p className="text-gray-600 mt-2">Please contact the school administration to add your children.</p>
          </div>
        )}
      </div>
    </div>
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

const SubjectPerformance = ({ subject, marks, grade }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
      <h4 className="font-medium text-gray-800">{subject}</h4>
      <div className="flex space-x-4">
        <span className="text-gray-600">{marks}</span>
        <span className="font-semibold text-blue-600">{grade}</span>
      </div>
    </div>
  );
};

export default ParentDashboard;