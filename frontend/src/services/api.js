import axios from 'axios';

// Simple cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Resolve base URLs from Vite environment
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const normalizedBackendUrl = VITE_BACKEND_URL.replace(/\/$/, '');

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${normalizedBackendUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache helper functions
const getCacheKey = (url, params) => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}${paramString}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// Enhanced API with caching
export const cachedApi = {
  get: async (url, params = null, useCache = true) => {
    if (useCache) {
      const cacheKey = getCacheKey(url, params);
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    const response = await api.get(url, { params });
    if (useCache) {
      const cacheKey = getCacheKey(url, params);
      setCache(cacheKey, response);
    }
    return response;
  },
  
  post: api.post,
  put: api.put,
  delete: api.delete,
  patch: api.patch
};

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login a user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default api; 