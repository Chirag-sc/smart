const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a course code'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  credits: {
    type: Number,
    required: [true, 'Please specify course credits'],
    min: 1,
    max: 6
  },
  department: {
    type: String,
    required: [true, 'Please specify a department'],
    enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'HUMANITIES', 'SCIENCE']
  },
  semester: {
    type: Number,
    required: [true, 'Please specify a semester'],
    min: 1,
    max: 8
  },
  subjectType: {
    type: String,
    required: [true, 'Please specify the subject type'],
    enum: ['theory', 'theoryLab', 'lab'],
    default: 'theory'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    },
    startTime: String,
    endTime: String,
    room: String
  }],
  assignments: [{
    title: String,
    description: String,
    dueDate: Date,
    totalMarks: Number
  }],
  exams: [{
    title: String,
    date: Date,
    totalMarks: Number,
    duration: Number // in minutes
  }],
  studyMaterials: [{
    title: String,
    description: String,
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema); 