// const { google } = require('googleapis');
// const Integration = require('../models/Integration');
// const Course = require('../models/Course');
// const Student = require('../models/Student');
// const Mark = require('../models/Mark');

// class GoogleClassroomService {
//   constructor() {
//     this.oauth2Client = null;
//     this.classroom = null;
//   }

//   // Initialize OAuth2 client
//   initializeOAuth2(credentials) {
//     this.oauth2Client = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//       process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback'
//     );

//     if (credentials.googleAccessToken) {
//       this.oauth2Client.setCredentials({
//         access_token: credentials.googleAccessToken,
//         refresh_token: credentials.googleRefreshToken,
//         expiry_date: credentials.googleTokenExpiry
//       });
//     }

//     this.classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
//   }

//   // Get authorization URL
//   getAuthUrl(userId) {
//     // Initialize OAuth2 client if not already done
//     if (!this.oauth2Client) {
//       this.oauth2Client = new google.auth.OAuth2(
//         process.env.GOOGLE_CLIENT_ID,
//         process.env.GOOGLE_CLIENT_SECRET,
//         process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback'
//       );
//     }

//     const scopes = [
//       'https://www.googleapis.com/auth/classroom.courses.readonly',
//       'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
//       'https://www.googleapis.com/auth/classroom.coursework.students',
//       'https://www.googleapis.com/auth/classroom.rosters.readonly',
//       'https://www.googleapis.com/auth/classroom.profile.emails'
//     ];

//     return this.oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: scopes,
//       state: userId,
//       prompt: 'consent'
//     });
//   }

//   // Handle OAuth callback
//   async handleCallback(code, userId) {
//     try {
//       // Initialize OAuth2 client if not already done
//       if (!this.oauth2Client) {
//         this.oauth2Client = new google.auth.OAuth2(
//           process.env.GOOGLE_CLIENT_ID,
//           process.env.GOOGLE_CLIENT_SECRET,
//           process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback'
//         );
//       }
      
//       const { tokens } = await this.oauth2Client.getToken(code);
//       this.oauth2Client.setCredentials(tokens);

//       // Save tokens to database
//       console.log('💾 Saving integration to database for user:', userId);
//       const integration = await Integration.findOneAndUpdate(
//         { user: userId, type: 'google_classroom' },
//         {
//           user: userId,
//           type: 'google_classroom',
//           isActive: true,
//           credentials: {
//             googleAccessToken: tokens.access_token,
//             googleRefreshToken: tokens.refresh_token,
//             googleTokenExpiry: new Date(tokens.expiry_date)
//           },
//           lastSync: new Date(),
//           syncStatus: 'success'
//         },
//         { upsert: true, new: true }
//       );
//       console.log('💾 Integration saved:', integration);

//       return { success: true, tokens };
//     } catch (error) {
//       console.error('Google Classroom OAuth error:', error);
//       throw error;
//     }
//   }

//   // Sync courses from Google Classroom
//   async syncCourses(userId) {
//     try {
//       const integration = await Integration.findOne({ 
//         user: userId, 
//         type: 'google_classroom',
//         isActive: true 
//       });

//       if (!integration) {
//         throw new Error('Google Classroom not integrated');
//       }

//       this.initializeOAuth2(integration.credentials);

//       // Get courses from Google Classroom
//       const response = await this.classroom.courses.list({
//         courseStates: 'ACTIVE'
//       });

//       const googleCourses = response.data.courses || [];
//       const syncedCourses = [];

//       for (const googleCourse of googleCourses) {
//         try {
//           // Check if course already exists
//           let course = await Course.findOne({ 
//             googleClassroomId: googleCourse.id 
//           });

//           if (!course) {
//             // Create new course
//             course = new Course({
//               name: googleCourse.name,
//               code: googleCourse.courseState || '',
//               description: googleCourse.description || '',
//               semester: 1, // Default semester
//               teacher: userId,
//               googleClassroomId: googleCourse.id,
//               googleClassroomLink: googleCourse.alternateLink
//             });
//           } else {
//             // Update existing course
//             course.name = googleCourse.name;
//             course.description = googleCourse.description || '';
//             course.googleClassroomLink = googleCourse.alternateLink;
//           }

//           await course.save();
//           syncedCourses.push(course);

//           // Sync students if enabled
//           if (integration.settings.autoSyncStudents) {
//             await this.syncCourseStudents(course._id, googleCourse.id);
//           }
//         } catch (error) {
//           console.error(`Error syncing course ${googleCourse.name}:`, error);
//         }
//       }

//       // Update sync status
//       await Integration.findByIdAndUpdate(integration._id, {
//         lastSync: new Date(),
//         syncStatus: 'success'
//       });

//       return { success: true, syncedCourses };
//     } catch (error) {
//       console.error('Error syncing courses:', error);
//       await this.logError(userId, 'google_classroom', error);
//       throw error;
//     }
//   }

//   // Sync students for a specific course
//   async syncCourseStudents(courseId, googleCourseId) {
//     try {
//       const response = await this.classroom.courses.students.list({
//         courseId: googleCourseId
//       });

//       const googleStudents = response.data.students || [];

//       for (const googleStudent of googleStudents) {
//         try {
//           // Find or create student
//           let student = await Student.findOne({ 
//             email: googleStudent.profile.emailAddress 
//           });

//           if (!student) {
//             student = new Student({
//               name: googleStudent.profile.name.fullName,
//               email: googleStudent.profile.emailAddress,
//               usn: googleStudent.profile.emailAddress.split('@')[0], // Use email prefix as USN
//               branch: 'Unknown',
//               semester: 1
//             });
//             await student.save();
//           }

//           // Add student to course if not already enrolled
//           const course = await Course.findById(courseId);
//           if (course && !course.students.includes(student._id)) {
//             course.students.push(student._id);
//             await course.save();
//           }
//         } catch (error) {
//           console.error(`Error syncing student ${googleStudent.profile.emailAddress}:`, error);
//         }
//       }
//     } catch (error) {
//       console.error('Error syncing course students:', error);
//       throw error;
//     }
//   }

//   // Create assignment in Google Classroom
//   async createAssignment(courseId, assignmentData) {
//     try {
//       const course = await Course.findById(courseId);
//       if (!course || !course.googleClassroomId) {
//         throw new Error('Course not linked to Google Classroom');
//       }

//       const integration = await Integration.findOne({ 
//         user: course.teacher, 
//         type: 'google_classroom',
//         isActive: true 
//       });

//       if (!integration) {
//         throw new Error('Google Classroom not integrated');
//       }

//       this.initializeOAuth2(integration.credentials);

//       const coursework = {
//         title: assignmentData.title,
//         description: assignmentData.description,
//         workType: 'ASSIGNMENT',
//         state: 'PUBLISHED',
//         dueDate: {
//           year: new Date(assignmentData.dueDate).getFullYear(),
//           month: new Date(assignmentData.dueDate).getMonth() + 1,
//           day: new Date(assignmentData.dueDate).getDate()
//         },
//         dueTime: {
//           hours: 23,
//           minutes: 59
//         }
//       };

//       const response = await this.classroom.courses.courseWork.create({
//         courseId: course.googleClassroomId,
//         requestBody: coursework
//       });

//       return { success: true, assignment: response.data };
//     } catch (error) {
//       console.error('Error creating Google Classroom assignment:', error);
//       throw error;
//     }
//   }

//   // Sync grades to Google Classroom
//   async syncGrades(courseId, studentId, gradeData) {
//     try {
//       const course = await Course.findById(courseId);
//       if (!course || !course.googleClassroomId) {
//         throw new Error('Course not linked to Google Classroom');
//       }

//       const integration = await Integration.findOne({ 
//         user: course.teacher, 
//         type: 'google_classroom',
//         isActive: true 
//       });

//       if (!integration) {
//         throw new Error('Google Classroom not integrated');
//       }

//       this.initializeOAuth2(integration.credentials);

//       // Find the student's Google Classroom ID
//       const student = await Student.findById(studentId);
//       if (!student) {
//         throw new Error('Student not found');
//       }

//       // Get course work (assignments)
//       const courseWorkResponse = await this.classroom.courses.courseWork.list({
//         courseId: course.googleClassroomId
//       });

//       // For now, we'll create a simple grade entry
//       // In a full implementation, you'd match with specific assignments
//       const gradeEntry = {
//         courseWorkId: courseWorkResponse.data.courseWork[0]?.id,
//         userId: student.email, // This would need to be the Google Classroom user ID
//         assignedGrade: gradeData.score,
//         draftGrade: gradeData.score
//       };

//       const response = await this.classroom.courses.courseWork.studentSubmissions.patch({
//         courseId: course.googleClassroomId,
//         courseWorkId: gradeEntry.courseWorkId,
//         id: student.email, // This would need proper student submission ID
//         requestBody: {
//           assignedGrade: gradeData.score,
//           draftGrade: gradeData.score
//         }
//       });

//       return { success: true, grade: response.data };
//     } catch (error) {
//       console.error('Error syncing grades to Google Classroom:', error);
//       throw error;
//     }
//   }

//   // Log errors
//   async logError(userId, type, error) {
//     try {
//       await Integration.findOneAndUpdate(
//         { user: userId, type },
//         {
//           $push: {
//             errorLog: {
//               timestamp: new Date(),
//               error: error.message,
//               details: error.stack
//             }
//           },
//           syncStatus: 'error'
//         }
//       );
//     } catch (logError) {
//       console.error('Error logging integration error:', logError);
//     }
//   }
// }

// module.exports = new GoogleClassroomService();
