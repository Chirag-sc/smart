const mongoose = require('mongoose');
const User = require('./User');

const TeacherSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: [true, 'Please provide a faculty ID'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please specify a department'],
    enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'HUMANITIES', 'SCIENCE']
  },
  designation: {
    type: String,
    required: [true, 'Please specify a designation'],
    enum: ['PROFESSOR', 'ASSOCIATE_PROFESSOR', 'ASSISTANT_PROFESSOR', 'LECTURER']
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  isAdmin: {
    type: Boolean,
    default: false
  }
});

// Create a Teacher model that extends the User model
const Teacher = User.discriminator('Teacher', TeacherSchema);

// Drop any existing indexes after model creation
Teacher.collection.dropIndexes().catch(err => {
  console.log('Error dropping indexes:', err);
});

module.exports = Teacher; 