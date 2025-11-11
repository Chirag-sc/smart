const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

exports.protect = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called');
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
    
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', !!token);
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      console.log('Token decoded:', decoded);

      // Get user from the token
      const user = await Student.findById(decoded.id) ||
                   await Parent.findById(decoded.id) ||
                   await Teacher.findById(decoded.id);

      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User authenticated:', user.email);
      req.user = user;
      next();
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.log('❌ Auth middleware error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error in authentication',
      error: error.message
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 