// const Integration = require('../models/Integration');
// const googleClassroomService = require('../services/googleClassroomService');
// const zoomService = require('../services/zoomService');
// const smsService = require('../services/smsService');
// const asyncHandler = require('express-async-handler');

// // @desc    Get all integrations for a user
// // @route   GET /api/integrations
// // @access  Private
// const getIntegrations = asyncHandler(async (req, res) => {
//   try {
//     console.log('🔍 getIntegrations called');
//     console.log('User ID:', req.user?.id);
//     console.log('User object:', req.user);
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not authenticated'
//       });
//     }
    
//     const integrations = await Integration.find({ user: req.user.id });
//     console.log('Found integrations:', integrations.length);
//     console.log('User ID:', req.user.id);
//     console.log('Integrations:', integrations.map(i => ({ id: i._id, type: i.type, isActive: i.isActive })));
    
//     // Remove sensitive credentials from response
//     const safeIntegrations = integrations.map(integration => ({
//       _id: integration._id,
//       type: integration.type,
//       isActive: integration.isActive,
//       settings: integration.settings,
//       lastSync: integration.lastSync,
//       syncStatus: integration.syncStatus,
//       createdAt: integration.createdAt,
//       updatedAt: integration.updatedAt
//     }));

//     res.json({
//       success: true,
//       data: safeIntegrations
//     });
//   } catch (error) {
//     console.error('Error fetching integrations:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching integrations',
//       error: error.message
//     });
//   }
// });

// // @desc    Get integration status
// // @route   GET /api/integrations/:type/status
// // @access  Private
// const getIntegrationStatus = asyncHandler(async (req, res) => {
//   try {
//     const { type } = req.params;
//     const integration = await Integration.findOne({ 
//       user: req.user.id, 
//       type: type 
//     });

//     if (!integration) {
//       return res.json({
//         success: true,
//         data: {
//           isActive: false,
//           isIntegrated: false,
//           lastSync: null,
//           syncStatus: 'never'
//         }
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         isActive: integration.isActive,
//         isIntegrated: true,
//         lastSync: integration.lastSync,
//         syncStatus: integration.syncStatus,
//         settings: integration.settings
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching integration status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching integration status',
//       error: error.message
//     });
//   }
// });

// // @desc    Google Classroom - Get auth URL
// // @route   GET /api/integrations/google/auth
// // @access  Private
// const getGoogleAuthUrl = asyncHandler(async (req, res) => {
//   try {
//     console.log('🔍 getGoogleAuthUrl called');
//     console.log('User ID:', req.user?.id);
//     console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
//     console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
    
//     if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
//       return res.status(500).json({
//         success: false,
//         message: 'Google Classroom credentials not configured'
//       });
//     }
    
//     const authUrl = googleClassroomService.getAuthUrl(req.user.id);
//     console.log('Generated auth URL:', authUrl);
    
//     res.json({
//       success: true,
//       authUrl: authUrl
//     });
//   } catch (error) {
//     console.error('Error getting Google auth URL:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error getting Google auth URL',
//       error: error.message
//     });
//   }
// });

// // @desc    Google Classroom - Handle OAuth callback
// // @route   GET /api/integrations/google/callback
// // @access  Public
// const handleGoogleCallback = asyncHandler(async (req, res) => {
//   try {
//     console.log('🔍 Google callback received');
//     console.log('🔍 Full URL:', req.url);
//     console.log('🔍 Query params:', req.query);
//     console.log('🔍 Headers:', req.headers);
    
//     const { code, state: userId } = req.query;
    
//     if (!code || !userId) {
//       console.log('❌ Missing code or userId');
//       return res.status(400).json({
//         success: false,
//         message: 'Missing authorization code or user ID'
//       });
//     }

//     console.log('✅ Processing callback for user:', userId);
//     const result = await googleClassroomService.handleCallback(code, userId);
//     console.log('✅ Callback processed successfully');
//     console.log('✅ Integration result:', result);
    
//     // Redirect to frontend with success message
//     const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?integration=google&status=success&message=Google Classroom connected successfully! Please login to continue.`;
//     console.log('🔄 Redirecting to:', redirectUrl);
//     res.redirect(redirectUrl);
//   } catch (error) {
//     console.error('❌ Error handling Google callback:', error);
//     const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?integration=google&status=error&message=${encodeURIComponent(error.message)}`;
//     console.log('🔄 Redirecting to error page:', redirectUrl);
//     res.redirect(redirectUrl);
//   }
// });

// // @desc    Google Classroom - Sync courses
// // @route   POST /api/integrations/google/sync-courses
// // @access  Private
// const syncGoogleCourses = asyncHandler(async (req, res) => {
//   try {
//     const result = await googleClassroomService.syncCourses(req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Courses synced successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error syncing Google courses:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error syncing Google courses',
//       error: error.message
//     });
//   }
// });

// // @desc    Google Classroom - Create assignment
// // @route   POST /api/integrations/google/create-assignment
// // @access  Private
// const createGoogleAssignment = asyncHandler(async (req, res) => {
//   try {
//     const { courseId, assignmentData } = req.body;
//     const result = await googleClassroomService.createAssignment(courseId, assignmentData);
    
//     res.json({
//       success: true,
//       message: 'Assignment created successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error creating Google assignment:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating Google assignment',
//       error: error.message
//     });
//   }
// });

// // @desc    Zoom - Get auth URL
// // @route   GET /api/integrations/zoom/auth
// // @access  Private
// const getZoomAuthUrl = asyncHandler(async (req, res) => {
//   try {
//     const authUrl = zoomService.getAuthUrl(req.user.id);
    
//     res.json({
//       success: true,
//       authUrl: authUrl
//     });
//   } catch (error) {
//     console.error('Error getting Zoom auth URL:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error getting Zoom auth URL',
//       error: error.message
//     });
//   }
// });

// // @desc    Zoom - Handle OAuth callback
// // @route   GET /api/integrations/zoom/callback
// // @access  Public
// const handleZoomCallback = asyncHandler(async (req, res) => {
//   try {
//     const { code, state: userId } = req.query;
    
//     if (!code || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing authorization code or user ID'
//       });
//     }

//     const result = await zoomService.handleCallback(code, userId);
    
//     res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/teacher?integration=zoom&status=success`);
//   } catch (error) {
//     console.error('Error handling Zoom callback:', error);
//     res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/teacher?integration=zoom&status=error&message=${encodeURIComponent(error.message)}`);
//   }
// });

// // @desc    Zoom - Create meeting
// // @route   POST /api/integrations/zoom/create-meeting
// // @access  Private
// const createZoomMeeting = asyncHandler(async (req, res) => {
//   try {
//     const { courseId, meetingData } = req.body;
//     const result = await zoomService.createMeeting(courseId, meetingData);
    
//     res.json({
//       success: true,
//       message: 'Meeting created successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error creating Zoom meeting:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating Zoom meeting',
//       error: error.message
//     });
//   }
// });

// // @desc    Zoom - Get meetings
// // @route   GET /api/integrations/zoom/meetings
// // @access  Private
// const getZoomMeetings = asyncHandler(async (req, res) => {
//   try {
//     const result = await zoomService.getUserMeetings(req.user.id);
    
//     res.json({
//       success: true,
//       data: result
//     });
//   } catch (error) {
//     console.error('Error getting Zoom meetings:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error getting Zoom meetings',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Setup SMS integration
// // @route   POST /api/integrations/sms/setup
// // @access  Private
// const setupSMS = asyncHandler(async (req, res) => {
//   try {
//     const { credentials } = req.body;
//     const result = await smsService.setupSMS(req.user.id, credentials);
    
//     res.json({
//       success: true,
//       message: 'SMS integration setup successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error setting up SMS:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error setting up SMS integration',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send SMS
// // @route   POST /api/integrations/sms/send
// // @access  Private
// const sendSMS = asyncHandler(async (req, res) => {
//   try {
//     const { to, message } = req.body;
//     const result = await smsService.sendSMS(to, message, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'SMS sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending SMS',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send bulk SMS
// // @route   POST /api/integrations/sms/send-bulk
// // @access  Private
// const sendBulkSMS = asyncHandler(async (req, res) => {
//   try {
//     const { recipients, message } = req.body;
//     const result = await smsService.sendBulkSMS(recipients, message, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Bulk SMS sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending bulk SMS:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending bulk SMS',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send attendance alert
// // @route   POST /api/integrations/sms/attendance-alert
// // @access  Private
// const sendAttendanceAlert = asyncHandler(async (req, res) => {
//   try {
//     const { studentId, attendanceData } = req.body;
//     const result = await smsService.sendAttendanceAlert(studentId, attendanceData, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Attendance alert sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending attendance alert:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending attendance alert',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send grade notification
// // @route   POST /api/integrations/sms/grade-notification
// // @access  Private
// const sendGradeNotification = asyncHandler(async (req, res) => {
//   try {
//     const { studentId, gradeData } = req.body;
//     const result = await smsService.sendGradeNotification(studentId, gradeData, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Grade notification sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending grade notification:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending grade notification',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send announcement
// // @route   POST /api/integrations/sms/announcement
// // @access  Private
// const sendAnnouncement = asyncHandler(async (req, res) => {
//   try {
//     const { announcement } = req.body;
//     const result = await smsService.sendAnnouncement(announcement, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Announcement sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending announcement:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending announcement',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Send emergency alert
// // @route   POST /api/integrations/sms/emergency-alert
// // @access  Private
// const sendEmergencyAlert = asyncHandler(async (req, res) => {
//   try {
//     const { alertData } = req.body;
//     const result = await smsService.sendEmergencyAlert(alertData, req.user.id);
    
//     res.json({
//       success: true,
//       message: 'Emergency alert sent successfully',
//       data: result
//     });
//   } catch (error) {
//     console.error('Error sending emergency alert:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error sending emergency alert',
//       error: error.message
//     });
//   }
// });

// // @desc    SMS - Get SMS history
// // @route   GET /api/integrations/sms/history
// // @access  Private
// const getSMSHistory = asyncHandler(async (req, res) => {
//   try {
//     const { limit = 50 } = req.query;
//     const result = await smsService.getSMSHistory(req.user.id, limit);
    
//     res.json({
//       success: true,
//       data: result
//     });
//   } catch (error) {
//     console.error('Error getting SMS history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error getting SMS history',
//       error: error.message
//     });
//   }
// });

// // @desc    Update integration settings
// // @route   PUT /api/integrations/:type/settings
// // @access  Private
// const updateIntegrationSettings = asyncHandler(async (req, res) => {
//   try {
//     const { type } = req.params;
//     const { settings } = req.body;
    
//     const integration = await Integration.findOneAndUpdate(
//       { user: req.user.id, type: type },
//       { $set: { settings: settings } },
//       { new: true }
//     );

//     if (!integration) {
//       return res.status(404).json({
//         success: false,
//         message: 'Integration not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Settings updated successfully',
//       data: integration.settings
//     });
//   } catch (error) {
//     console.error('Error updating integration settings:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating integration settings',
//       error: error.message
//     });
//   }
// });

// // @desc    Disable integration
// // @route   DELETE /api/integrations/:type
// // @access  Private
// const disableIntegration = asyncHandler(async (req, res) => {
//   try {
//     const { type } = req.params;
    
//     const integration = await Integration.findOneAndUpdate(
//       { user: req.user.id, type: type },
//       { isActive: false },
//       { new: true }
//     );

//     if (!integration) {
//       return res.status(404).json({
//         success: false,
//         message: 'Integration not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Integration disabled successfully'
//     });
//   } catch (error) {
//     console.error('Error disabling integration:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error disabling integration',
//       error: error.message
//     });
//   }
// });

// module.exports = {
//   getIntegrations,
//   getIntegrationStatus,
//   getGoogleAuthUrl,
//   handleGoogleCallback,
//   syncGoogleCourses,
//   createGoogleAssignment,
//   getZoomAuthUrl,
//   handleZoomCallback,
//   createZoomMeeting,
//   getZoomMeetings,
//   setupSMS,
//   sendSMS,
//   sendBulkSMS,
//   sendAttendanceAlert,
//   sendGradeNotification,
//   sendAnnouncement,
//   sendEmergencyAlert,
//   getSMSHistory,
//   updateIntegrationSettings,
//   disableIntegration
// };
