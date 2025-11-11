const mongoose = require('mongoose');
const User = require('./User');

const StudentSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: [true, 'Please provide USN'],
    trim: true,
    unique: true
  },
  branch: {
    type: String,
    required: [true, 'Please provide branch'],
    trim: true
  },
  semester: {
    type: String,
    required: [true, 'Please provide semester'],
    trim: true
  },
  cgpa: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  attendance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true
  }
});

// Create a Student model that extends the User model
const Student = User.discriminator('Student', StudentSchema);

module.exports = Student; 