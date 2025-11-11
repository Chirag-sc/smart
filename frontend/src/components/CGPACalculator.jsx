import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import studentAPI from '../services/studentAPI';

const CGPACalculator = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [cgpa, setCgpa] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalGradePoints, setTotalGradePoints] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [message, setMessage] = useState('');
  const [isStudentMode, setIsStudentMode] = useState(false);

  // VTU 2022 Scheme Grade Points
  const gradePoints = useMemo(() => ({
    'S': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'D': 4,
    'E': 0,
    'F': 0
  }), []);

  // VTU 2022 Scheme Credits (typical for engineering)
  const semesterCredits = useMemo(() => ({
    1: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 3 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    2: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 3 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 2 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    3: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    4: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 4 },
      { subject: 'Subject 4', credits: 4 },
      { subject: 'Subject 5', credits: 3 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    5: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    6: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    7: [
      { subject: 'Subject 1', credits: 4 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 3 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 1 },
      { subject: 'Subject 7', credits: 2 },
      { subject: 'Subject 8', credits: 1 }
    ],
    8: [
      { subject: 'Subject 1', credits: 8 },
      { subject: 'Subject 2', credits: 4 },
      { subject: 'Subject 3', credits: 3 },
      { subject: 'Subject 4', credits: 2 },
      { subject: 'Subject 5', credits: 2 },
      { subject: 'Subject 6', credits: 2 },
      { subject: 'Subject 7', credits: 1 },
      { subject: 'Subject 8', credits: 1 }
    ]
  }), []);

  // Determine if this is student mode (user is a student) or teacher mode
  useEffect(() => {
    if (user?.role === 'student') {
      setIsStudentMode(true);
      setSelectedStudent(user.id || user._id);
    } else {
      setIsStudentMode(false);
      fetchStudents();
    }
  }, [user]);

  // Initialize subjects for current semester
  useEffect(() => {
    if (semesterCredits[currentSemester]) {
      const initialSubjects = semesterCredits[currentSemester].map(subject => ({
        ...subject,
        grade: '',
        gradePoint: 0,
        marks: ''
      }));
      setSubjects(initialSubjects);
    }
  }, [currentSemester, semesterCredits]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Error fetching students');
    }
  };

  // Calculate CGPA (only from saved semesters)
  useEffect(() => {
    let totalCreditsSum = 0;
    let totalGradePointsSum = 0;

    // Only calculate from saved semesters (not current semester)
    semesters.forEach(semester => {
      totalCreditsSum += semester.totalCredits;
      totalGradePointsSum += semester.totalGradePoints;
    });

    setTotalCredits(totalCreditsSum);
    setTotalGradePoints(totalGradePointsSum);
    
    if (totalCreditsSum > 0) {
      setCgpa((totalGradePointsSum / totalCreditsSum).toFixed(2));
    } else {
      setCgpa(0);
    }
  }, [semesters]);

  const handleMarksChange = (index, marks) => {
    const newSubjects = [...subjects];
    const marksValue = parseFloat(marks) || 0;
    newSubjects[index].marks = marksValue;
    
    // Convert marks to grade based on VTU grading system
    let grade = '';
    if (marksValue >= 90) grade = 'S';
    else if (marksValue >= 80) grade = 'A+';
    else if (marksValue >= 70) grade = 'A';
    else if (marksValue >= 60) grade = 'B+';
    else if (marksValue >= 50) grade = 'B';
    else if (marksValue >= 45) grade = 'C';
    else if (marksValue >= 40) grade = 'D';
    else if (marksValue >= 0) grade = 'E';
    else grade = 'F';
    
    newSubjects[index].grade = grade;
    newSubjects[index].gradePoint = gradePoints[grade] || 0;
    setSubjects(newSubjects);
  };

  const handleCreditsChange = (index, credits) => {
    const newSubjects = [...subjects];
    const creditsValue = parseFloat(credits) || 0;
    newSubjects[index].credits = creditsValue;
    setSubjects(newSubjects);
  };

  const saveSemester = () => {
    const semesterTotalCredits = subjects.reduce((sum, subject) => 
      subject.grade && subject.grade !== '' ? sum + subject.credits : sum, 0
    );
    
    const semesterTotalGradePoints = subjects.reduce((sum, subject) => 
      subject.grade && subject.grade !== '' ? sum + (subject.gradePoint * subject.credits) : sum, 0
    );

    if (semesterTotalCredits > 0) {
      const newSemester = {
        semester: currentSemester,
        subjects: subjects.filter(subject => subject.grade && subject.grade !== '').map(subject => ({
          ...subject,
          marks: subject.marks || 0
        })),
        totalCredits: semesterTotalCredits,
        totalGradePoints: semesterTotalGradePoints,
        gpa: (semesterTotalGradePoints / semesterTotalCredits).toFixed(2)
      };

      setSemesters(prev => {
        const updated = prev.filter(s => s.semester !== currentSemester);
        return [...updated, newSemester];
      });

      // Move to next semester
      if (currentSemester < 8) {
        setCurrentSemester(currentSemester + 1);
      }
    }
  };

  const resetCalculator = () => {
    setSemesters([]);
    setCurrentSemester(1);
    setSubjects([]);
    setCgpa(0);
    setTotalCredits(0);
    setTotalGradePoints(0);
    setSelectedStudent('');
    setMessage('');
  };

  const updateStudentCGPA = async () => {
    if (!selectedStudent) {
      setMessage('Please select a student first');
      return;
    }

    if (semesters.length === 0) {
      setMessage('Please save at least one semester first');
      return;
    }

    setIsCalculating(true);
    setMessage('');

    try {
      if (isStudentMode) {
        // For student mode, update their own profile
        await studentAPI.updateProfile({
          cgpa: cgpa
        });
        setMessage(`Successfully updated your CGPA to ${cgpa}`);
      } else {
        // For teacher mode, update selected student
        const student = students.find(s => s._id === selectedStudent);
        if (!student) {
          setMessage('Student not found');
          return;
        }

        await studentAPI.updateStudent(selectedStudent, {
          cgpa: cgpa,
          name: student.name,
          email: student.email,
          usn: student.usn,
          branch: student.branch,
          semester: student.semester,
          attendance: student.attendance
        });

        setMessage(`Successfully updated ${student.name}'s CGPA to ${cgpa}`);
        
        // Refresh students list
        await fetchStudents();
      }
    } catch (error) {
      console.error('Error updating student CGPA:', error);
      setMessage('Error updating CGPA');
    } finally {
      setIsCalculating(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'S': 'text-green-600 bg-green-100',
      'A+': 'text-green-600 bg-green-100',
      'A': 'text-blue-600 bg-blue-100',
      'B+': 'text-blue-600 bg-blue-100',
      'B': 'text-yellow-600 bg-yellow-100',
      'C': 'text-orange-600 bg-orange-100',
      'D': 'text-red-600 bg-red-100',
      'E': 'text-red-600 bg-red-100',
      'F': 'text-red-600 bg-red-100'
    };
    return colors[grade] || 'text-gray-600 bg-gray-100';
  };

  const getCGPAStatus = (cgpa) => {
    if (cgpa >= 9.0) return { status: 'Excellent', color: 'text-green-600' };
    if (cgpa >= 8.0) return { status: 'Very Good', color: 'text-blue-600' };
    if (cgpa >= 7.0) return { status: 'Good', color: 'text-yellow-600' };
    if (cgpa >= 6.0) return { status: 'Average', color: 'text-orange-600' };
    if (cgpa >= 5.0) return { status: 'Below Average', color: 'text-red-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const cgpaStatus = getCGPAStatus(parseFloat(cgpa));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">VTU CGPA Calculator</h2>
          <div className="flex space-x-2">
            <button
              onClick={resetCalculator}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Student Selection - Only show for teacher mode */}
        {!isStudentMode && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Select Student to Update CGPA</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.usn}) - Current CGPA: {student.cgpa || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={updateStudentCGPA}
                disabled={!selectedStudent || semesters.length === 0 || isCalculating}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  !selectedStudent || semesters.length === 0 || isCalculating
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isCalculating ? 'Updating...' : 'Update Student CGPA'}
              </button>
            </div>
            {message && (
              <div className={`mt-3 p-3 rounded-lg ${
                message.includes('Successfully') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* Student Mode - Update Own CGPA */}
        {isStudentMode && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Update Your CGPA</h3>
            <p className="text-gray-600 mb-4">
              Calculate your CGPA based on your semester grades and update your profile.
            </p>
            <button
              onClick={updateStudentCGPA}
              disabled={semesters.length === 0 || isCalculating}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                semesters.length === 0 || isCalculating
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isCalculating ? 'Updating...' : 'Update My CGPA'}
            </button>
            {message && (
              <div className={`mt-3 p-3 rounded-lg ${
                message.includes('Successfully') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* CGPA Display */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">Calculated CGPA</h3>
            <div className="text-6xl font-bold mb-2">{cgpa}</div>
            <div className={`text-xl font-semibold ${cgpaStatus.color}`}>
              {cgpaStatus.status}
            </div>
            <div className="text-sm mt-2">
              Total Credits: {totalCredits} | Total Grade Points: {totalGradePoints.toFixed(2)}
            </div>
            <div className="text-xs mt-2 opacity-80">
              *Calculated from {semesters.length} saved semester(s)
            </div>
          </div>
        </div>

        {/* Semester Navigation */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Calculate SGPA for Semester {currentSemester}</h3>
          <p className="text-gray-600 mb-4">Enter grades for current semester to calculate SGPA</p>
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <button
                key={sem}
                onClick={() => setCurrentSemester(sem)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentSemester === sem
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                S{sem}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Table */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4">Enter Marks/Grades for Semester {currentSemester}</h4>
          <p className="text-sm text-gray-600 mb-4">
            You can edit both credits and marks. Credits are typically 1-8, marks are 0-100.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Credits (0-10)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Marks (0-100)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Grade Points</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Points × Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subjects.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{subject.subject}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={subject.credits || ''}
                        onChange={(e) => handleCreditsChange(index, e.target.value)}
                        className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subject.marks || ''}
                        onChange={(e) => handleMarksChange(index, e.target.value)}
                        placeholder="Enter marks"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-color)'
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getGradeColor(subject.grade)}`}>
                        {subject.grade || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{subject.gradePoint}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(subject.gradePoint * subject.credits).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Marks to Grade Conversion Guide */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <h5 className="text-sm font-semibold text-yellow-800 mb-2">Marks to Grade Conversion (VTU System)</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-green-600">90-100</div>
              <div className="text-gray-600">S (10)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">80-89</div>
              <div className="text-gray-600">A+ (9)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">70-79</div>
              <div className="text-gray-600">A (8)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">60-69</div>
              <div className="text-gray-600">B+ (7)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">50-59</div>
              <div className="text-gray-600">B (6)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">45-49</div>
              <div className="text-gray-600">C (5)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">40-44</div>
              <div className="text-gray-600">D (4)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">0-39</div>
              <div className="text-gray-600">E/F (0)</div>
            </div>
          </div>
        </div>

        {/* Save Semester Button */}
        <div className="mb-6">
          <button
            onClick={saveSemester}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Save Semester {currentSemester} (Add to CGPA Calculation)
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will save the current semester's SGPA and add it to the overall CGPA calculation
          </p>
        </div>

        {/* Previous Semesters */}
        {semesters.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4">Saved Semesters (Contributing to CGPA)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesters.map((semester, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">Semester {semester.semester}</h5>
                  <div className="space-y-1 text-sm">
                    <div>SGPA: <span className="font-semibold text-blue-600">{semester.gpa}</span></div>
                    <div>Credits: <span className="font-semibold">{semester.totalCredits}</span></div>
                    <div>Grade Points: <span className="font-semibold">{semester.totalGradePoints.toFixed(2)}</span></div>
                  </div>
                  <div className="mt-3">
                    <h6 className="text-xs font-semibold text-gray-600 mb-1">Subjects:</h6>
                    <div className="space-y-1">
                      {semester.subjects.map((subject, subIndex) => (
                        <div key={subIndex} className="text-xs flex justify-between">
                          <span className="text-gray-700">{subject.subject}</span>
                          <span className="text-gray-500">
                            {subject.marks}% → {subject.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Total Semesters:</strong> {semesters.length} | 
                <strong> Total Credits:</strong> {totalCredits} | 
                <strong> Total Grade Points:</strong> {totalGradePoints.toFixed(2)} | 
                <strong> CGPA:</strong> {cgpa}
              </p>
            </div>
          </div>
        )}

        {/* Grade Scale Reference */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-4">VTU Grade Scale</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2">
            {Object.entries(gradePoints).map(([grade, points]) => (
              <div key={grade} className="text-center">
                <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${getGradeColor(grade)}`}>
                  {grade}
                </div>
                <div className="text-xs text-gray-600 mt-1">{points} points</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPACalculator;
