const express = require('express');
const router = express.Router();
const multer = require('multer');
const InternalMarks = require('../models/InternalMarks');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Protect all routes
router.use(protect);

// GET /api/internal-marks/student/:studentId/course/:courseId
router.get('/student/:studentId/course/:courseId', authorize('teacher', 'student'), async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    
    const internalMarks = await InternalMarks.findOne({ 
      student: studentId, 
      course: courseId 
    }).populate('student', 'name usn').populate('course', 'code title subjectType');
    
    if (!internalMarks) {
      return res.status(404).json({ 
        success: false, 
        message: 'No internal marks found for this student and course' 
      });
    }
    
    res.json({ success: true, data: internalMarks });
  } catch (error) {
    console.error('Error fetching internal marks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch internal marks',
      error: error.message 
    });
  }
});

// POST /api/internal-marks
router.post('/', authorize('teacher'), async (req, res) => {
  try {
    const { studentId, courseId, marks, subjectType } = req.body;
    
    // Get course to verify subject type
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    // Calculate CIE based on subject type
    let calculatedCIE = 0;
    
    if (subjectType === 'theory') {
      const testAverage = (marks.test1 + marks.test2) / 2;
      const assignmentAverage = (marks.assignment1 + marks.seminar2) / 2;
      calculatedCIE = testAverage + assignmentAverage;
    } else if (subjectType === 'theoryLab') {
      const theoryTestAverage = (marks.theoryTest1 + marks.theoryTest2) / 2;
      const theoryTestReduced = (theoryTestAverage / 25) * 15;
      const theoryAssignmentSum = marks.theoryAssignment1 + marks.theorySeminar;
      const theoryAssignmentReduced = (theoryAssignmentSum / 20) * 10;
      const conductionRecord = marks.conduction + marks.record;
      const labTestReduced = (marks.labTest / 50) * 10;
      calculatedCIE = theoryTestReduced + theoryAssignmentReduced + conductionRecord + labTestReduced;
    } else if (subjectType === 'lab') {
      const conductionVivaTotal = marks.conductionViva + 5;
      const recordJournalTotal = marks.recordJournal;
      const labTestReduced = (marks.labTestOnly / 100) * 20;
      calculatedCIE = conductionVivaTotal + recordJournalTotal + labTestReduced;
    }
    
    // Create or update internal marks
    const internalMarks = await InternalMarks.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        student: studentId,
        course: courseId,
        subjectType: course.subjectType,
        ...marks,
        calculatedCIE: Math.round(calculatedCIE * 100) / 100,
        uploadedBy: req.user.id
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Internal marks saved successfully',
      data: internalMarks 
    });
  } catch (error) {
    console.error('Error saving internal marks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save internal marks',
      error: error.message 
    });
  }
});

// GET /api/internal-marks/course/:courseId
router.get('/course/:courseId', authorize('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const internalMarks = await InternalMarks.find({ course: courseId })
      .populate('student', 'name usn')
      .populate('course', 'code title subjectType')
      .sort({ 'student.usn': 1 });
    
    res.json({ success: true, data: internalMarks });
  } catch (error) {
    console.error('Error fetching course internal marks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch course internal marks',
      error: error.message 
    });
  }
});

// PUT /api/internal-marks/:id
router.put('/:id', authorize('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { marks } = req.body;
    
    const internalMarks = await InternalMarks.findById(id);
    if (!internalMarks) {
      return res.status(404).json({ 
        success: false, 
        message: 'Internal marks not found' 
      });
    }
    
    // Recalculate CIE
    let calculatedCIE = 0;
    
    if (internalMarks.subjectType === 'theory') {
      const testAverage = (marks.test1 + marks.test2) / 2;
      const assignmentAverage = (marks.assignment1 + marks.seminar2) / 2;
      calculatedCIE = testAverage + assignmentAverage;
    } else if (internalMarks.subjectType === 'theoryLab') {
      const theoryTestAverage = (marks.theoryTest1 + marks.theoryTest2) / 2;
      const theoryTestReduced = (theoryTestAverage / 25) * 15;
      const theoryAssignmentSum = marks.theoryAssignment1 + marks.theorySeminar;
      const theoryAssignmentReduced = (theoryAssignmentSum / 20) * 10;
      const conductionRecord = marks.conduction + marks.record;
      const labTestReduced = (marks.labTest / 50) * 10;
      calculatedCIE = theoryTestReduced + theoryAssignmentReduced + conductionRecord + labTestReduced;
    } else if (internalMarks.subjectType === 'lab') {
      const conductionVivaTotal = marks.conductionViva + 5;
      const recordJournalTotal = marks.recordJournal;
      const labTestReduced = (marks.labTestOnly / 100) * 20;
      calculatedCIE = conductionVivaTotal + recordJournalTotal + labTestReduced;
    }
    
    const updatedMarks = await InternalMarks.findByIdAndUpdate(
      id,
      {
        ...marks,
        calculatedCIE: Math.round(calculatedCIE * 100) / 100
      },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Internal marks updated successfully',
      data: updatedMarks 
    });
  } catch (error) {
    console.error('Error updating internal marks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update internal marks',
      error: error.message 
    });
  }
});

// DELETE /api/internal-marks/:id
router.delete('/:id', authorize('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const internalMarks = await InternalMarks.findByIdAndDelete(id);
    if (!internalMarks) {
      return res.status(404).json({ 
        success: false, 
        message: 'Internal marks not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Internal marks deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting internal marks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete internal marks',
      error: error.message 
    });
  }
});

// POST /api/internal-marks/upload-excel
router.post('/upload-excel', authorize('teacher'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Excel file uploaded' 
      });
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Excel file is empty or malformed' 
      });
    }

    const uploadedMarks = [];
    const errors = [];
    const updatedMarks = [];

    for (const row of data) {
      const { 
        USN, 
        'Course Code': courseCode, 
        'IA-1': ia1, 
        'IA-2': ia2,
        'Assignment': assignment,
        'Seminar': seminar,
        'Lab Performance': labPerformance,
        'Record': record,
        'Viva': viva,
        'Report': report,
        'Presentation': presentation,
        'Evaluation': evaluation
      } = row;

      if (!USN || !courseCode) {
        errors.push(`Missing USN or Course Code in row: ${JSON.stringify(row)}`);
        continue;
      }

      // Validate USN format (basic validation)
      if (typeof USN !== 'string' || USN.trim().length === 0) {
        errors.push(`Invalid USN format in row: ${JSON.stringify(row)}`);
        continue;
      }

      try {
        const student = await Student.findOne({ usn: USN });
        if (!student) {
          errors.push(`Student with USN ${USN} not found`);
          continue;
        }

        const course = await Course.findOne({ code: courseCode });
        if (!course) {
          errors.push(`Course with code ${courseCode} not found`);
          continue;
        }

        // Prepare marks object based on subject type
        let marksData = {};
        let calculatedCIE = 0;

        if (course.subjectType === 'theory') {
          // Validate marks for theory subjects
          const ia1Value = parseFloat(ia1) || 0;
          const ia2Value = parseFloat(ia2) || 0;
          const assignmentValue = parseFloat(assignment) || 0;
          const seminarValue = parseFloat(seminar) || 0;

          if (ia1Value < 0 || ia1Value > 25) {
            errors.push(`IA-1 value out of range (0-25) for USN ${USN}: ${ia1Value}`);
            continue;
          }
          if (ia2Value < 0 || ia2Value > 25) {
            errors.push(`IA-2 value out of range (0-25) for USN ${USN}: ${ia2Value}`);
            continue;
          }
          if (assignmentValue < 0 || assignmentValue > 25) {
            errors.push(`Assignment value out of range (0-25) for USN ${USN}: ${assignmentValue}`);
            continue;
          }
          if (seminarValue < 0 || seminarValue > 25) {
            errors.push(`Seminar value out of range (0-25) for USN ${USN}: ${seminarValue}`);
            continue;
          }

          marksData = {
            test1: ia1Value,
            test2: ia2Value,
            assignment1: assignmentValue,
            seminar2: seminarValue
          };
          const testAverage = (marksData.test1 + marksData.test2) / 2;
          const assignmentAverage = (marksData.assignment1 + marksData.seminar2) / 2;
          calculatedCIE = testAverage + assignmentAverage;
        } else if (course.subjectType === 'theoryLab') {
          // Validate marks for theory+lab subjects
          const ia1Value = parseFloat(ia1) || 0;
          const ia2Value = parseFloat(ia2) || 0;
          const assignmentValue = parseFloat(assignment) || 0;
          const seminarValue = parseFloat(seminar) || 0;
          const labPerformanceValue = parseFloat(labPerformance) || 0;
          const recordValue = parseFloat(record) || 0;
          const vivaValue = parseFloat(viva) || 0;

          if (ia1Value < 0 || ia1Value > 25) {
            errors.push(`IA-1 value out of range (0-25) for USN ${USN}: ${ia1Value}`);
            continue;
          }
          if (ia2Value < 0 || ia2Value > 25) {
            errors.push(`IA-2 value out of range (0-25) for USN ${USN}: ${ia2Value}`);
            continue;
          }
          if (assignmentValue < 0 || assignmentValue > 10) {
            errors.push(`Assignment value out of range (0-10) for USN ${USN}: ${assignmentValue}`);
            continue;
          }
          if (seminarValue < 0 || seminarValue > 10) {
            errors.push(`Seminar value out of range (0-10) for USN ${USN}: ${seminarValue}`);
            continue;
          }
          if (labPerformanceValue < 0 || labPerformanceValue > 5) {
            errors.push(`Lab Performance value out of range (0-5) for USN ${USN}: ${labPerformanceValue}`);
            continue;
          }
          if (recordValue < 0 || recordValue > 10) {
            errors.push(`Record value out of range (0-10) for USN ${USN}: ${recordValue}`);
            continue;
          }
          if (vivaValue < 0 || vivaValue > 50) {
            errors.push(`Viva value out of range (0-50) for USN ${USN}: ${vivaValue}`);
            continue;
          }

          marksData = {
            theoryTest1: ia1Value,
            theoryTest2: ia2Value,
            theoryAssignment1: assignmentValue,
            theorySeminar: seminarValue,
            conduction: labPerformanceValue,
            record: recordValue,
            labTest: vivaValue
          };
          const theoryTestAverage = (marksData.theoryTest1 + marksData.theoryTest2) / 2;
          const theoryTestReduced = (theoryTestAverage / 25) * 15;
          const theoryAssignmentSum = marksData.theoryAssignment1 + marksData.theorySeminar;
          const theoryAssignmentReduced = (theoryAssignmentSum / 20) * 10;
          const conductionRecord = marksData.conduction + marksData.record;
          const labTestReduced = (marksData.labTest / 50) * 10;
          calculatedCIE = theoryTestReduced + theoryAssignmentReduced + conductionRecord + labTestReduced;
          
          // Debug logging for theoryLab calculation
          console.log(`=== CIE Calculation Debug for ${USN} ===`);
          console.log(`Theory Test: ${marksData.theoryTest1} + ${marksData.theoryTest2} = ${theoryTestAverage}, Reduced: ${theoryTestReduced}`);
          console.log(`Theory Assignment: ${marksData.theoryAssignment1} + ${marksData.theorySeminar} = ${theoryAssignmentSum}, Reduced: ${theoryAssignmentReduced}`);
          console.log(`Lab: ${marksData.conduction} + ${marksData.record} = ${conductionRecord}, Lab Test: ${labTestReduced}`);
          console.log(`Final CIE: ${theoryTestReduced} + ${theoryAssignmentReduced} + ${conductionRecord} + ${labTestReduced} = ${calculatedCIE}`);
          console.log(`==========================================`);
        } else if (course.subjectType === 'lab') {
          // Validate marks for lab subjects
          const labPerformanceValue = parseFloat(labPerformance) || 0;
          const recordValue = parseFloat(record) || 0;
          const vivaValue = parseFloat(viva) || 0;

          if (labPerformanceValue < 0 || labPerformanceValue > 15) {
            errors.push(`Lab Performance value out of range (0-15) for USN ${USN}: ${labPerformanceValue}`);
            continue;
          }
          if (recordValue < 0 || recordValue > 10) {
            errors.push(`Record value out of range (0-10) for USN ${USN}: ${recordValue}`);
            continue;
          }
          if (vivaValue < 0 || vivaValue > 100) {
            errors.push(`Viva value out of range (0-100) for USN ${USN}: ${vivaValue}`);
            continue;
          }

          marksData = {
            conductionViva: labPerformanceValue,
            recordJournal: recordValue,
            labTestOnly: vivaValue
          };
          const conductionVivaTotal = marksData.conductionViva + 5;
          const recordJournalTotal = marksData.recordJournal;
          const labTestReduced = (marksData.labTestOnly / 100) * 20;
          calculatedCIE = conductionVivaTotal + recordJournalTotal + labTestReduced;
        }

        // Create or update internal marks
        const internalMarks = await InternalMarks.findOneAndUpdate(
          { student: student._id, course: course._id },
          {
            student: student._id,
            course: course._id,
            subjectType: course.subjectType,
            ...marksData,
            calculatedCIE: Math.round(calculatedCIE * 100) / 100,
            uploadedBy: req.user.id
          },
          { upsert: true, new: true }
        );

        // Force recalculate CIE for this specific record to ensure accuracy
        console.log(`Recalculating CIE for ${USN} in ${courseCode}: ${internalMarks.calculatedCIE} -> ${calculatedCIE}`);
        
        // Double-check: Update the record again to ensure correct CIE is saved
        await InternalMarks.findByIdAndUpdate(internalMarks._id, {
          calculatedCIE: Math.round(calculatedCIE * 100) / 100
        });

        if (internalMarks.isNew) {
          uploadedMarks.push(internalMarks);
        } else {
          updatedMarks.push(internalMarks);
        }
      } catch (error) {
        errors.push(`Error processing row for USN ${USN}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `CIE marks processed successfully. ${uploadedMarks.length} new records created, ${updatedMarks.length} records updated`,
      data: {
        uploaded: uploadedMarks.length,
        updated: updatedMarks.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Error uploading CIE marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload CIE marks',
      error: error.message
    });
  }
});

// GET /api/internal-marks/export-excel/:courseId
router.get('/export-excel/:courseId', authorize('teacher'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const internalMarks = await InternalMarks.find({ course: courseId })
      .populate('student', 'name usn')
      .populate('course', 'code title subjectType')
      .sort({ 'student.usn': 1 });

    if (internalMarks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No CIE marks found for this course'
      });
    }

    // Prepare data based on subject type
    let excelData = [];
    
    if (course.subjectType === 'theory') {
      excelData = internalMarks.map(mark => ({
        'USN': mark.student.usn,
        'Student Name': mark.student.name,
        'Course Code': mark.course.code,
        'Course Title': mark.course.title,
        'IA-1': mark.test1,
        'IA-2': mark.test2,
        'Assignment': mark.assignment1,
        'Seminar': mark.seminar2,
        'Calculated CIE': mark.calculatedCIE
      }));
    } else if (course.subjectType === 'theoryLab') {
      excelData = internalMarks.map(mark => ({
        'USN': mark.student.usn,
        'Student Name': mark.student.name,
        'Course Code': mark.course.code,
        'Course Title': mark.course.title,
        'Theory IA-1': mark.theoryTest1,
        'Theory IA-2': mark.theoryTest2,
        'Theory Assignment': mark.theoryAssignment1,
        'Theory Seminar': mark.theorySeminar,
        'Lab Performance': mark.conduction,
        'Record': mark.record,
        'Lab Test': mark.labTest,
        'Calculated CIE': mark.calculatedCIE
      }));
    } else if (course.subjectType === 'lab') {
      excelData = internalMarks.map(mark => ({
        'USN': mark.student.usn,
        'Student Name': mark.student.name,
        'Course Code': mark.course.code,
        'Course Title': mark.course.title,
        'Lab Performance': mark.conductionViva,
        'Record/Journal': mark.recordJournal,
        'Lab Test': mark.labTestOnly,
        'Calculated CIE': mark.calculatedCIE
      }));
    }

    // Create Excel file
    const xlsx = require('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'CIE Marks');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CIE_Marks_${course.code}_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting CIE marks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export CIE marks',
      error: error.message
    });
  }
});


module.exports = router;
