// const mongoose = require('mongoose');

// const IntegrationSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['google_classroom', 'zoom', 'sms', 'whatsapp', 'email'],
//     required: true
//   },
//   isActive: {
//     type: Boolean,
//     default: false
//   },
//   credentials: {
//     // Google Classroom
//     googleAccessToken: String,
//     googleRefreshToken: String,
//     googleTokenExpiry: Date,
//     googleClassroomId: String,
    
//     // Zoom
//     zoomAccessToken: String,
//     zoomRefreshToken: String,
//     zoomTokenExpiry: Date,
//     zoomAccountId: String,
//     zoomUserId: String,
    
//     // SMS/WhatsApp (Twilio)
//     twilioAccountSid: String,
//     twilioAuthToken: String,
//     twilioPhoneNumber: String,
    
//     // Email
//     smtpHost: String,
//     smtpPort: Number,
//     smtpUser: String,
//     smtpPassword: String,
//     smtpSecure: Boolean
//   },
//   settings: {
//     // Google Classroom settings
//     autoSyncCourses: { type: Boolean, default: true },
//     autoSyncStudents: { type: Boolean, default: true },
//     autoSyncGrades: { type: Boolean, default: true },
    
//     // Zoom settings
//     autoCreateMeetings: { type: Boolean, default: false },
//     meetingDuration: { type: Number, default: 60 }, // minutes
//     recordMeetings: { type: Boolean, default: false },
    
//     // SMS/WhatsApp settings
//     sendAttendanceAlerts: { type: Boolean, default: true },
//     sendGradeNotifications: { type: Boolean, default: true },
//     sendAnnouncements: { type: Boolean, default: true },
    
//     // Email settings
//     emailTemplate: String,
//     sendBulkEmails: { type: Boolean, default: true }
//   },
//   lastSync: {
//     type: Date,
//     default: null
//   },
//   syncStatus: {
//     type: String,
//     enum: ['success', 'error', 'pending', 'never'],
//     default: 'never'
//   },
//   errorLog: [{
//     timestamp: { type: Date, default: Date.now },
//     error: String,
//     details: String
//   }]
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// IntegrationSchema.index({ user: 1, type: 1 });
// IntegrationSchema.index({ isActive: 1 });

// module.exports = mongoose.model('Integration', IntegrationSchema);
