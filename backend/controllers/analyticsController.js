const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Mark = require('../models/Mark');
const Attendance = require('../models/Attendance');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
const mongoose = require('mongoose');

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private (Teacher)
const getAnalyticsOverview = async (req, res) => {
  try {
    console.log('Overview API called with params:', req.query);
    const { semester, course, dateRange } = req.query;

    // Get basic counts with error handling
    console.log('Fetching student count...');
    const totalStudents = await Student.countDocuments();
    console.log('Total students found:', totalStudents);
    
    console.log('Fetching course count...');
    const totalCourses = await Course.countDocuments();
    console.log('Total courses found:', totalCourses);
    
    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$percentage' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    // Get marks statistics
    const marksStats = await Mark.aggregate([
      {
        $group: {
          _id: null,
          avgMarks: { $avg: '$score' },
          totalRecords: { $sum: 1 }
        }
      }
    ]);

    // Calculate pass rate (assuming passing score is 60)
    const passCount = await Mark.countDocuments({ score: { $gte: 60 } });
    const totalMarks = await Mark.countDocuments();
    const passRate = totalMarks > 0 ? (passCount / totalMarks) * 100 : 0;

    // Get at-risk students (attendance < 75% or marks < 60)
    const atRiskStudents = await Student.aggregate([
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student',
          as: 'attendanceRecords'
        }
      },
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'student',
          as: 'markRecords'
        }
      },
      {
        $addFields: {
          avgAttendance: { $avg: '$attendanceRecords.percentage' },
          avgMarks: { $avg: '$markRecords.score' }
        }
      },
      {
        $match: {
          $or: [
            { avgAttendance: { $lt: 75 } },
            { avgMarks: { $lt: 60 } }
          ]
        }
      },
      {
        $count: 'atRiskCount'
      }
    ]);

    // Simplified overview - just return basic counts for now
    const overview = {
      totalStudents,
      avgAttendance: 0, // Will be calculated when attendance data exists
      avgMarks: 0,      // Will be calculated when marks data exists  
      passRate: 0,      // Will be calculated when marks data exists
      atRiskCount: 0    // Will be calculated when data exists
    };

    console.log('Final overview (simplified):', overview);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics overview',
      error: error.message
    });
  }
};

// @desc    Get student performance analytics
// @route   GET /api/analytics/performance
// @access  Private (Teacher)
const getPerformanceAnalytics = async (req, res) => {
  try {
    const { semester, course, limit = 50 } = req.query;

    let matchConditions = {};
    if (semester) matchConditions.semester = semester;

    const performanceData = await Student.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student',
          as: 'attendanceRecords'
        }
      },
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'student',
          as: 'markRecords'
        }
      },
      {
        $addFields: {
          avgAttendance: { $avg: '$attendanceRecords.percentage' },
          avgMarks: { $avg: '$markRecords.score' },
          totalSubjects: { $size: '$markRecords' }
        }
      },
      {
        $project: {
          name: 1,
          usn: 1,
          branch: 1,
          semester: 1,
          cgpa: 1,
          avgAttendance: { $round: ['$avgAttendance', 1] },
          avgMarks: { $round: ['$avgMarks', 1] },
          totalSubjects: 1
        }
      },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance analytics',
      error: error.message
    });
  }
};

// @desc    Get attendance trends
// @route   GET /api/analytics/attendance-trends
// @access  Private (Teacher)
const getAttendanceTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const startDate = subMonths(new Date(), parseInt(months));

    const trends = await Attendance.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          avgAttendance: { $avg: '$percentage' },
          totalRecords: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.month' },
              '/',
              { $toString: '$_id.year' }
            ]
          },
          avgAttendance: { $round: ['$avgAttendance', 1] },
          totalRecords: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance trends',
      error: error.message
    });
  }
};

// @desc    Get course performance comparison
// @route   GET /api/analytics/course-performance
// @access  Private (Teacher)
const getCoursePerformance = async (req, res) => {
  try {
    const { semester } = req.query;

    let matchConditions = {};
    if (semester) matchConditions.semester = parseInt(semester);

    const coursePerformance = await Course.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'course',
          as: 'marks'
        }
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'course',
          as: 'attendances'
        }
      },
      {
        $addFields: {
          avgMarks: { $avg: '$marks.score' },
          avgAttendance: { $avg: '$attendances.percentage' },
          totalStudents: { $size: '$students' },
          passCount: {
            $size: {
              $filter: {
                input: '$marks',
                cond: { $gte: ['$$this.score', 60] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          passRate: {
            $cond: [
              { $gt: [{ $size: '$marks' }, 0] },
              { $multiply: [{ $divide: ['$passCount', { $size: '$marks' }] }, 100] },
              0
            ]
          }
        }
      },
      {
        $project: {
          code: 1,
          title: 1,
          department: 1,
          avgMarks: { $round: ['$avgMarks', 1] },
          avgAttendance: { $round: ['$avgAttendance', 1] },
          passRate: { $round: ['$passRate', 1] },
          totalStudents: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: coursePerformance
    });
  } catch (error) {
    console.error('Course performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course performance',
      error: error.message
    });
  }
};

// @desc    Get at-risk students
// @route   GET /api/analytics/at-risk-students
// @access  Private (Teacher)
const getAtRiskStudents = async (req, res) => {
  try {
    const { semester, riskLevel } = req.query;

    let matchConditions = {};
    if (semester) matchConditions.semester = semester;

    const atRiskStudents = await Student.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student',
          as: 'attendanceRecords'
        }
      },
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'student',
          as: 'markRecords'
        }
      },
      {
        $addFields: {
          avgAttendance: { $avg: '$attendanceRecords.percentage' },
          avgMarks: { $avg: '$markRecords.score' }
        }
      },
      {
        $match: {
          $or: [
            { avgAttendance: { $lt: 75 } },
            { avgMarks: { $lt: 60 } }
          ]
        }
      },
      {
        $addFields: {
          riskLevel: {
            $cond: [
              {
                $or: [
                  { $lt: ['$avgAttendance', 60] },
                  { $lt: ['$avgMarks', 50] }
                ]
              },
              'high',
              'medium'
            ]
          },
          riskFactors: {
            $filter: {
              input: [
                {
                  $cond: [
                    { $lt: ['$avgAttendance', 75] },
                    'Poor attendance',
                    null
                  ]
                },
                {
                  $cond: [
                    { $lt: ['$avgMarks', 60] },
                    'Low academic performance',
                    null
                  ]
                }
              ],
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          usn: 1,
          branch: 1,
          semester: 1,
          cgpa: 1,
          avgAttendance: { $round: ['$avgAttendance', 1] },
          avgMarks: { $round: ['$avgMarks', 1] },
          riskLevel: 1,
          riskFactors: 1
        }
      },
      { $sort: { riskLevel: -1, avgMarks: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: atRiskStudents
    });
  } catch (error) {
    console.error('At-risk students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get at-risk students',
      error: error.message
    });
  }
};

// @desc    Get student rankings
// @route   GET /api/analytics/rankings
// @access  Private (Teacher)
const getStudentRankings = async (req, res) => {
  try {
    console.log('Rankings API called with params:', req.query);
    const { semester, course, limit = 50 } = req.query;

    let matchConditions = {};
    if (semester) matchConditions.semester = semester;

    console.log('Match conditions:', matchConditions);

    // Simplified approach - first check if we have any marks data
    const marksCount = await Mark.countDocuments();
    console.log('Total marks in database:', marksCount);
    
    if (marksCount === 0) {
      console.log('No marks data found, returning empty array');
      // No marks data available
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Build pipeline with proper course and semester filtering
    let pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'student',
          as: 'allMarks'
        }
      }
    ];

    // Add course filtering if specific course is selected
    if (course && course !== 'all') {
      console.log('Filtering by course:', course);
      pipeline.push({
        $addFields: {
          markRecords: {
            $filter: {
              input: '$allMarks',
              cond: { $eq: ['$$this.course', new mongoose.Types.ObjectId(course)] }
            }
          }
        }
      });
    } else {
      // If no specific course filter, use all marks
      pipeline.push({
        $addFields: {
          markRecords: '$allMarks'
        }
      });
    }

    // Add semester filtering if needed
    if (semester) {
      console.log('Filtering by semester:', semester);
      pipeline.push(
        {
          $lookup: {
            from: 'courses',
            localField: 'markRecords.course',
            foreignField: '_id',
            as: 'courseInfo'
          }
        },
        {
          $addFields: {
            markRecords: {
              $filter: {
                input: '$markRecords',
                as: 'mark',
                cond: {
                  $in: [
                    '$$mark.course',
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: '$courseInfo',
                            cond: { $eq: ['$$this.semester', parseInt(semester)] }
                          }
                        },
                        in: '$$this._id'
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      );
    }

    // Calculate totals and filter students with marks
    pipeline.push(
      {
        $addFields: {
          totalMarks: { $sum: '$markRecords.score' },
          totalCourses: { $size: '$markRecords' },
          avgMarks: {
            $cond: [
              { $gt: [{ $size: '$markRecords' }, 0] },
              { $avg: '$markRecords.score' },
              0
            ]
          }
        }
      },
      {
        $match: {
          totalCourses: { $gt: 0 } // Only include students with marks
        }
      },
      {
        $sort: { 
          totalMarks: -1,  // Primary sort by total marks
          avgMarks: -1     // Secondary sort by average marks
        }
      },
      {
        $project: {
          name: 1,
          usn: 1,
          branch: 1,
          semester: 1,
          cgpa: 1,
          totalMarks: 1,
          totalCourses: 1,
          avgMarks: { $round: ['$avgMarks', 1] }
        }
      },
      { $limit: parseInt(limit) }
    );

    console.log('Executing pipeline with', pipeline.length, 'stages');
    const rankings = await Student.aggregate(pipeline);
    console.log('Rankings result:', rankings.length, 'students found');

    res.status(200).json({
      success: true,
      data: rankings
    });
  } catch (error) {
    console.error('Student rankings error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to get student rankings',
      error: error.message
    });
  }
};

// @desc    Test endpoint for debugging
// @route   GET /api/analytics/test
// @access  Private (Teacher)  
const testAnalytics = async (req, res) => {
  try {
    const studentsCount = await Student.countDocuments();
    const marksCount = await Mark.countDocuments();
    const coursesCount = await Course.countDocuments();
    
    // Simple aggregation test
    const studentsWithMarks = await Student.aggregate([
      {
        $lookup: {
          from: 'marks',
          localField: '_id',
          foreignField: 'student',
          as: 'marks'
        }
      },
      {
        $project: {
          name: 1,
          usn: 1,
          marksCount: { $size: '$marks' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        studentsCount,
        marksCount,
        coursesCount,
        studentsWithMarks: studentsWithMarks.slice(0, 5) // First 5 for testing
      }
    });
  } catch (error) {
    console.error('Test analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/analytics/department-stats
// @access  Private (Teacher)
const getDepartmentStats = async (req, res) => {
  try {
    const departmentStats = await Student.aggregate([
      {
        $group: {
          _id: '$branch',
          totalStudents: { $sum: 1 },
          avgCGPA: { $avg: '$cgpa' },
          avgAttendance: { $avg: '$attendance' }
        }
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          totalStudents: 1,
          avgCGPA: { $round: ['$avgCGPA', 2] },
          avgAttendance: { $round: ['$avgAttendance', 1] }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: departmentStats
    });
  } catch (error) {
    console.error('Department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAnalyticsOverview,
  getPerformanceAnalytics,
  getAttendanceTrends,
  getCoursePerformance,
  getAtRiskStudents,
  getStudentRankings,
  getDepartmentStats,
  testAnalytics
};
