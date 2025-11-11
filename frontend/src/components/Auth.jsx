import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TwoFactorVerification from './TwoFactorVerification';

const Auth = () => {
  const location = useLocation();
  const { register, login, error, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(location.state?.role || 'student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    usn: '',
    branch: '',
    semester: '',
    cgpa: '',
    attendance: '',
    facultyId: '',
    department: '',
    designation: '',
    childUSN: ''
  });
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  
  // Integration message states
  const [integrationMessage, setIntegrationMessage] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState(null);

  // Handle URL parameters for integration messages
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const integration = urlParams.get('integration');
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    
    if (integration && status && message) {
      setIntegrationStatus(status);
      setIntegrationMessage(message);
      
      // Clear URL parameters after showing message
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      try {
        const result = await login({
          email: formData.email,
          password: formData.password
        });
        
        // Check if 2FA is required
        if (result && result.requires2FA) {
          setPendingLogin({ email: formData.email, password: formData.password });
          setShow2FA(true);
          return;
        }
        // Navigation will be handled by the AuthContext
      } catch (err) {
        console.error('Login error:', err);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
      };

      // Add role-specific data
      if (role === 'student') {
        userData.usn = formData.usn;
        userData.branch = formData.branch;
        userData.semester = formData.semester;
      } else if (role === 'parent') {
        userData.childUSN = formData.childUSN;
        userData.children = [];
      } else if (role === 'teacher') {
        userData.facultyId = formData.facultyId;
        userData.department = formData.department;
        userData.designation = formData.designation;
      }

      try {
        await register(userData);
        setIsLogin(true); // Switch to login form after successful registration
      } catch (err) {
        console.error('Registration error:', err);
      }
    }
  };

  const handle2FAVerification = async (verificationData) => {
    try {
      await login({
        email: pendingLogin.email,
        password: pendingLogin.password,
        ...verificationData
      });
      setShow2FA(false);
      setPendingLogin(null);
    } catch (err) {
      console.error('2FA verification error:', err);
    }
  };

  const handle2FAClose = () => {
    setShow2FA(false);
    setPendingLogin(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Integration Message */}
        {integrationMessage && (
          <div className={`px-4 py-3 rounded mb-4 ${
            integrationStatus === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {integrationMessage}
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <RoleButton 
              active={role === 'student'} 
              onClick={() => setRole('student')}
              label="Student"
            />
            <RoleButton 
              active={role === 'parent'} 
              onClick={() => setRole('parent')}
              label="Parent"
            />
            <RoleButton 
              active={role === 'teacher'} 
              onClick={() => setRole('teacher')}
              label="Teacher"
            />
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {!isLogin && role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USN
                </label>
                <input
                  type="text"
                  name="usn"
                  value={formData.usn}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your USN (e.g., 1MS20CS001)"
                  pattern="[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}"
                  title="Please enter a valid USN (e.g., 1MS20CS001)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">Computer Science Engineering</option>
                  <option value="ECE">Electronics & Communication</option>
                  <option value="EEE">Electrical & Electronics</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="IT">Information Technology</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                  <option value="4">4th Semester</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                </select>
              </div>
            </>
          )}

          {!isLogin && role === 'parent' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's USN
                </label>
                <input
                  type="text"
                  name="childUSN"
                  value={formData.childUSN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your child's USN (e.g., 1MS20CS001)"
                  pattern="[1-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}"
                  title="Please enter a valid USN (e.g., 1MS20CS001)"
                  required
                />
              </div>
            </>
          )}

          {!isLogin && role === 'teacher' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty ID
                </label>
                <input
                  type="text"
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your faculty ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Designation</option>
                  <option value="PROFESSOR">PROFESSOR</option>
                  <option value="ASSOCIATE_PROFESSOR">ASSOCIATE PROFESSOR</option>
                  <option value="ASSISTANT_PROFESSOR">ASSISTANT PROFESSOR</option>
                  <option value="LECTURER">LECTURER</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
      
      {/* 2FA Verification Modal */}
      <TwoFactorVerification
        isOpen={show2FA}
        onClose={handle2FAClose}
        onVerify={handle2FAVerification}
        userEmail={pendingLogin?.email}
        loading={loading}
      />
    </div>
  );
};

const RoleButton = ({ active, onClick, label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-4 rounded-lg transition ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

export default Auth; 