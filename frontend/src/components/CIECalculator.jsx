import React, { useState, useEffect, useCallback } from 'react';
import './CIECalculator.css';
import courseAPI from '../services/courseAPI';
import studentAPI from '../services/studentAPI';
import internalMarksAPI from '../services/internalMarksAPI';

const CIECalculator = () => {
  const [subjectType, setSubjectType] = useState('theory');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Theory Only
    test1: '',
    test2: '',
    assignment1: '',
    seminar2: '',
    
    // Theory + Lab
    theoryTest1: '',
    theoryTest2: '',
    theoryAssignment1: '',
    theorySeminar: '',
    conduction: '',
    record: '',
    labTest: '',
    
    // Lab Only
    conductionViva: '',
    recordJournal: '',
    labTestOnly: ''
  });

  const [results, setResults] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Load courses
  const loadCourses = async () => {
    try {
      const response = await courseAPI.getCourses();
      setCourses(response.data || []);
    } catch {
      setError('Failed to load courses');
    }
  };

  // Load students
  const loadStudents = async () => {
    try {
      const response = await studentAPI.getStudents();
      setStudents(response.data || []);
    } catch {
      setError('Failed to load students');
    }
  };

  // Load existing internal marks
  const loadExistingMarks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await internalMarksAPI.getStudentCourseMarks(selectedStudent, selectedCourse);
      const marks = response.data;
      
      if (marks) {
        // Pre-populate form with existing marks
        setFormData({
          test1: marks.test1 || '',
          test2: marks.test2 || '',
          assignment1: marks.assignment1 || '',
          seminar2: marks.seminar2 || '',
          theoryTest1: marks.theoryTest1 || '',
          theoryTest2: marks.theoryTest2 || '',
          theoryAssignment1: marks.theoryAssignment1 || '',
          theorySeminar: marks.theorySeminar || '',
          conduction: marks.conduction || '',
          record: marks.record || '',
          labTest: marks.labTest || '',
          conductionViva: marks.conductionViva || '',
          recordJournal: marks.recordJournal || '',
          labTestOnly: marks.labTestOnly || ''
        });
      }
    } catch (err) {
      console.error('Error loading existing marks:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, selectedCourse]);

  // Load courses and students on component mount
  useEffect(() => {
    loadCourses();
    loadStudents();
  }, []);

  // Load existing marks when course and student are selected
  useEffect(() => {
    if (selectedCourse && selectedStudent) {
      loadExistingMarks();
    }
  }, [selectedCourse, selectedStudent, loadExistingMarks]);

  // Handle course selection
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    
    // Find the selected course and set subject type
    const course = courses.find(c => c._id === courseId);
    if (course) {
      setSubjectType(course.subjectType);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    // Define maximum values for each field
    const maxValues = {
      // Theory Only
      test1: 25,
      test2: 25,
      assignment1: 25,
      seminar2: 25,
      
      // Theory + Lab
      theoryTest1: 25,
      theoryTest2: 25,
      theoryAssignment1: 10,
      theorySeminar: 10,
      conduction: 5,
      record: 10,
      labTest: 50,
      
      // Lab Only
      conductionViva: 15,
      recordJournal: 10,
      labTestOnly: 100
    };
    
    // Check if value exceeds maximum
    if (numValue > maxValues[name]) {
      alert(`Value cannot exceed ${maxValues[name]} marks for ${name}`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWheel = (e) => {
    // Prevent wheel events from changing number input values
    e.target.blur();
  };

  const calculateCIE = () => {
    let calculation = {};
    
    switch (subjectType) {
      case 'theory':
        calculation = calculateTheoryOnly();
        break;
      case 'theoryLab':
        calculation = calculateTheoryLab();
        break;
      case 'lab':
        calculation = calculateLabOnly();
        break;
      default:
        return;
    }
    
    setResults(calculation);
  };

  const calculateTheoryOnly = () => {
    const test1 = parseFloat(formData.test1) || 0;
    const test2 = parseFloat(formData.test2) || 0;
    const assignment1 = parseFloat(formData.assignment1) || 0;
    const seminar2 = parseFloat(formData.seminar2) || 0;

    const testAverage = (test1 + test2) / 2;
    const assignmentAverage = (assignment1 + seminar2) / 2;
    const finalCIE = testAverage + assignmentAverage;

    return {
      testAverage: testAverage.toFixed(2),
      assignmentAverage: assignmentAverage.toFixed(2),
      finalCIE: finalCIE.toFixed(2),
      breakdown: {
        test1,
        test2,
        assignment1,
        seminar2
      }
    };
  };

  const calculateTheoryLab = () => {
    const theoryTest1 = parseFloat(formData.theoryTest1) || 0;
    const theoryTest2 = parseFloat(formData.theoryTest2) || 0;
    const theoryAssignment1 = parseFloat(formData.theoryAssignment1) || 0;
    const theorySeminar = parseFloat(formData.theorySeminar) || 0;
    const conduction = parseFloat(formData.conduction) || 0;
    const record = parseFloat(formData.record) || 0;
    const labTest = parseFloat(formData.labTest) || 0;

    // Theory calculations
    const theoryTestAverage = (theoryTest1 + theoryTest2) / 2;
    const theoryTestReduced = (theoryTestAverage / 25) * 15; // Reduced to 15
    const theoryAssignmentSum = theoryAssignment1 + theorySeminar;
    const theoryAssignmentReduced = (theoryAssignmentSum / 20) * 10; // Reduced to 10 (from 20, not 25)
    
    // Lab calculations
    const conductionRecord = conduction + record;
    const labTestReduced = (labTest / 50) * 10; // Reduced to 10

    const theoryTotal = theoryTestReduced + theoryAssignmentReduced;
    const labTotal = conductionRecord + labTestReduced;
    const finalCIE = theoryTotal + labTotal;

    return {
      theoryTestAverage: theoryTestAverage.toFixed(2),
      theoryTestReduced: theoryTestReduced.toFixed(2),
      theoryAssignmentSum: theoryAssignmentSum.toFixed(2),
      theoryAssignmentReduced: theoryAssignmentReduced.toFixed(2),
      conductionRecord: conductionRecord.toFixed(2),
      labTestReduced: labTestReduced.toFixed(2),
      theoryTotal: theoryTotal.toFixed(2),
      labTotal: labTotal.toFixed(2),
      finalCIE: finalCIE.toFixed(2),
      breakdown: {
        theoryTest1: theoryTest1,
        theoryTest2: theoryTest2,
        theoryAssignment1: theoryAssignment1,
        theorySeminar: theorySeminar,
        conduction: conduction,
        record: record,
        labTest: labTest
      }
    };
  };

  const calculateLabOnly = () => {
    const conductionViva = parseFloat(formData.conductionViva) || 0;
    const recordJournal = parseFloat(formData.recordJournal) || 0;
    const labTestOnly = parseFloat(formData.labTestOnly) || 0;

    const conductionVivaTotal = conductionViva + 5; // Conduction + viva = 15+5
    const recordJournalTotal = recordJournal; // Record/journal = 10
    const labTestReduced = (labTestOnly / 100) * 20; // Reduced to 20

    const finalCIE = conductionVivaTotal + recordJournalTotal + labTestReduced;

    return {
      conductionVivaTotal: conductionVivaTotal.toFixed(2),
      recordJournalTotal: recordJournalTotal.toFixed(2),
      labTestReduced: labTestReduced.toFixed(2),
      finalCIE: finalCIE.toFixed(2),
      breakdown: {
        conductionViva: conductionViva,
        recordJournal: recordJournal,
        labTestOnly: labTestOnly
      }
    };
  };

  const resetForm = () => {
    setFormData({
      test1: '',
      test2: '',
      assignment1: '',
      seminar2: '',
      theoryTest1: '',
      theoryTest2: '',
      theoryAssignment1: '',
      theorySeminar: '',
      conduction: '',
      record: '',
      labTest: '',
      conductionViva: '',
      recordJournal: '',
      labTestOnly: ''
    });
    setResults(null);
  };

  // Save CIE marks to database
  const saveCIEMarks = async () => {
    if (!selectedCourse || !selectedStudent) {
      setError('Please select both course and student');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await internalMarksAPI.saveMarks(selectedStudent, selectedCourse, formData, subjectType);
      alert('CIE marks saved successfully!');
      
      // Reload existing marks to get updated calculated CIE
      await loadExistingMarks();
    } catch (error) {
      setError('Failed to save CIE marks: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel file upload
  const handleExcelUpload = async () => {
    if (!excelFile) {
      setUploadError('Please select an Excel file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadMessage('');

      const response = await internalMarksAPI.uploadCIEMarksExcel(excelFile);
      setUploadMessage(response.message);
      
      // Reload courses and students to reflect any updates
      await loadCourses();
      await loadStudents();
      
      setExcelFile(null);
    } catch (error) {
      setUploadError('Failed to upload Excel file: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Excel export
  const handleExcelExport = async () => {
    if (!selectedCourse) {
      setError('Please select a course to export');
      return;
    }

    try {
      setLoading(true);
      const blob = await internalMarksAPI.exportCIEMarksExcel(selectedCourse);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CIE_Marks_${selectedCourse}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export Excel file: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="cie-calculator">
      <div className="cie-header">
        <h2>CIE Calculator</h2>
        <p>Calculate your Continuous Internal Evaluation marks (Total: 50)</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="error-message">
          {uploadError}
        </div>
      )}

      {uploadMessage && (
        <div className="success-message">
          {uploadMessage}
        </div>
      )}

      <div className="selection-section">
        <div className="form-group">
          <label>Select Course:</label>
          <select
            value={selectedCourse}
            onChange={handleCourseChange}
            className="form-select"
          >
            <option value="">Choose a course...</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.title} ({course.subjectType})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Student:</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-select"
          >
            <option value="">Choose a student...</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.usn} - {student.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="subject-type-info">
          <p><strong>Subject Type:</strong> {
            subjectType === 'theory' ? 'Theory Only' :
            subjectType === 'theoryLab' ? 'Theory + Lab' :
            'Lab Only'
          }</p>
        </div>
      )}

      {/* Excel Upload and Export Section */}
      <div className="excel-section">
        <h3>Excel Operations</h3>
        <div className="excel-controls">
          <div className="excel-upload">
            <label>Upload CIE Marks from Excel:</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="file-input"
            />
            <button 
              onClick={handleExcelUpload}
              disabled={!excelFile || isUploading}
              className="upload-btn"
            >
              {isUploading ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>
          
          <div className="excel-export">
            <button 
              onClick={handleExcelExport}
              disabled={!selectedCourse || loading}
              className="export-btn"
            >
              {loading ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
          
        </div>
        
        <div className="excel-info">
          <h4>Excel Format Guidelines:</h4>
          <div className="format-info">
            <p><strong>Required columns:</strong> USN, Course Code</p>
            <p><strong>For Theory subjects:</strong> IA-1, IA-2, Assignment, Seminar</p>
            <p><strong>For Theory+Lab subjects:</strong> IA-1, IA-2, Assignment, Seminar, Lab Performance, Record, Viva</p>
            <p><strong>For Lab subjects:</strong> Lab Performance, Record, Viva</p>
            <p><strong>Note:</strong> The system will automatically map Excel columns to the appropriate CIE fields based on the course's subject type.</p>
          </div>
        </div>
      </div>


      <div className="calculation-form">
        {subjectType === 'theory' && (
          <div className="theory-only">
            <h3>Theory Only Calculation</h3>
            <div className="form-group">
              <label>IA-1 (out of 25):</label>
                <input
                  type="number"
                  name="test1"
                  value={formData.test1}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="25"
                  min="0"
                />
            </div>
            <div className="form-group">
              <label>IA-2 (out of 25):</label>
              <input
                type="number"
                name="test2"
                value={formData.test2}
                onChange={handleInputChange}
                max="25"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Assignment (out of 25):</label>
              <input
                type="number"
                name="assignment1"
                value={formData.assignment1}
                onChange={handleInputChange}
                max="25"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Seminar (out of 25):</label>
              <input
                type="number"
                name="seminar2"
                value={formData.seminar2}
                onChange={handleInputChange}
                max="25"
                min="0"
              />
            </div>
          </div>
        )}

        {subjectType === 'theoryLab' && (
          <div className="theory-lab">
            <h3>Theory + Lab Calculation</h3>
            <div className="theory-section">
              <h4>Theory Component</h4>
              <div className="form-group">
                <label>IA-1 (out of 25):</label>
                <input
                  type="number"
                  name="theoryTest1"
                  value={formData.theoryTest1}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="25"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>IA-2 (out of 25):</label>
                <input
                  type="number"
                  name="theoryTest2"
                  value={formData.theoryTest2}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="25"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Assignment (out of 10):</label>
                <input
                  type="number"
                  name="theoryAssignment1"
                  value={formData.theoryAssignment1}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="10"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Seminar (out of 10):</label>
                <input
                  type="number"
                  name="theorySeminar"
                  value={formData.theorySeminar}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="10"
                  min="0"
                />
              </div>
            </div>
            <div className="lab-section">
              <h4>Lab Component</h4>
              <div className="form-group">
                <label>Lab Performance (out of 5):</label>
                <input
                  type="number"
                  name="conduction"
                  value={formData.conduction}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="5"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Record (out of 10):</label>
                <input
                  type="number"
                  name="record"
                  value={formData.record}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="10"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Viva (out of 50):</label>
                <input
                  type="number"
                  name="labTest"
                  value={formData.labTest}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="50"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {subjectType === 'lab' && (
          <div className="lab-only">
            <h3>Lab Only Calculation</h3>
            <div className="form-group">
              <label>Lab Performance (out of 15):</label>
                <input
                  type="number"
                  name="conductionViva"
                  value={formData.conductionViva}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="15"
                  min="0"
                />
            </div>
            <div className="form-group">
              <label>Record (out of 10):</label>
              <input
                type="number"
                name="recordJournal"
                value={formData.recordJournal}
                onChange={handleInputChange}
                max="10"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Viva (out of 100):</label>
              <input
                type="number"
                name="labTestOnly"
                value={formData.labTestOnly}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  max="100"
                  min="0"
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button onClick={calculateCIE} className="calculate-btn">
            Calculate CIE
          </button>
          {selectedCourse && selectedStudent && (
            <button onClick={saveCIEMarks} className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save CIE Marks'}
            </button>
          )}
          <button onClick={resetForm} className="reset-btn">
            Reset
          </button>
        </div>
      </div>

      {results && (
        <div className="results">
          <h3>CIE Calculation Results</h3>
          
          {subjectType === 'theory' && (
            <div className="theory-results">
              <div className="result-item">
                <span>IA Average (A):</span>
                <span>{results.testAverage}/25</span>
              </div>
              <div className="result-item">
                <span>Assignment Average (B):</span>
                <span>{results.assignmentAverage}/25</span>
              </div>
              <div className="result-item final">
                <span>Final CIE (A + B):</span>
                <span>{results.finalCIE}/50</span>
              </div>
            </div>
          )}

          {subjectType === 'theoryLab' && (
            <div className="theory-lab-results">
              <div className="theory-results-section">
                <h4>Theory Component</h4>
                <div className="result-item">
                  <span>IA Average:</span>
                  <span>{results.breakdown.theoryTest1} + {results.breakdown.theoryTest2} = {results.theoryTestAverage}/25</span>
                </div>
                <div className="result-item">
                  <span>Reduced to 15:</span>
                  <span>{results.theoryTestReduced}/15</span>
                </div>
                <div className="result-item">
                  <span>Assignment Sum:</span>
                  <span>{results.breakdown.theoryAssignment1} + {results.breakdown.theorySeminar} = {results.theoryAssignmentSum}/20</span>
                </div>
                <div className="result-item">
                  <span>Reduced to 10:</span>
                  <span>{results.theoryAssignmentReduced}/10</span>
                </div>
                <div className="result-item">
                  <span>Theory Total (A+B):</span>
                  <span>{results.theoryTotal}/25</span>
                </div>
              </div>
              
              <div className="lab-results-section">
                <h4>Lab Component</h4>
                <div className="result-item">
                  <span>Lab Performance + Record:</span>
                  <span>{results.breakdown.conduction} + {results.breakdown.record} = {results.conductionRecord}/15</span>
                </div>
                <div className="result-item">
                  <span>Viva (reduced to 10):</span>
                  <span>{results.labTestReduced}/10</span>
                </div>
                <div className="result-item">
                  <span>Lab Total (C+D):</span>
                  <span>{results.labTotal}/25</span>
                </div>
              </div>
              
              <div className="result-item final">
                <span>Final CIE (Theory + Lab):</span>
                <span>{results.finalCIE}/50</span>
              </div>
            </div>
          )}

          {subjectType === 'lab' && (
            <div className="lab-results">
              <div className="result-item">
                <span>Lab Performance + Viva:</span>
                <span>{results.breakdown.conductionViva} + 5 = {results.conductionVivaTotal}/20</span>
              </div>
              <div className="result-item">
                <span>Record:</span>
                <span>{results.recordJournalTotal}/10</span>
              </div>
              <div className="result-item">
                <span>Viva (reduced to 20):</span>
                <span>{results.labTestReduced}/20</span>
              </div>
              <div className="result-item final">
                <span>Final CIE:</span>
                <span>{results.finalCIE}/50</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CIECalculator;
