const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    totalClasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendedClasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ student: 1, course: 1, subjectName: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);


