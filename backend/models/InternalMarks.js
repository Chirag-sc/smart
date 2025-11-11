const mongoose = require('mongoose');

const InternalMarksSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subjectType: {
    type: String,
    required: true,
    enum: ['theory', 'theoryLab', 'lab']
  },
  // Theory Only marks
  test1: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  test2: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  assignment1: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  seminar2: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  // Theory + Lab marks
  theoryTest1: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  theoryTest2: {
    type: Number,
    min: 0,
    max: 25,
    default: 0
  },
  theoryAssignment1: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  theorySeminar: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  conduction: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  record: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  labTest: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  // Lab Only marks
  conductionViva: {
    type: Number,
    min: 0,
    max: 15,
    default: 0
  },
  recordJournal: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  labTestOnly: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Calculated CIE
  calculatedCIE: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  // Uploaded by teacher
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  }
}, { timestamps: true });

// Ensure one record per student-course combination
InternalMarksSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('InternalMarks', InternalMarksSchema);
