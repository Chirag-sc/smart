import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(userData);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  // Login a user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(credentials);
      
      // Check if 2FA is required
      if (response.requires2FA) {
        setLoading(false);
        return response; // Return without setting user or navigating
      }
      
      setUser(response.user);
      setLoading(false);
      
      // Redirect to appropriate dashboard based on user role
      if (response.user.role === 'student') {
        navigate('/dashboard/student');
      } else if (response.user.role === 'parent') {
        navigate('/dashboard/parent');
      } else if (response.user.role === 'teacher') {
        navigate('/dashboard/teacher');
      } else {
        navigate('/');
      }
      
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  // Logout a user
  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/auth');
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Remove default export to fix Fast Refresh issue 