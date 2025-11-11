<!-- # 🔗 Smart SIT Integrations Setup Guide

This guide will help you set up the three main integrations for Smart SIT: Google Classroom, Zoom, and SMS/WhatsApp.

## 📚 Google Classroom Integration

### Setup Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Classroom API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/integrations/google/callback`



### Features:
- ✅ Sync courses from Google Classroom
- ✅ Sync students and enrollments
- ✅ Create assignments in Google Classroom
- ✅ Sync grades back to Google Classroom

## 🎥 Zoom Integration

### Setup Steps:
1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a new app (OAuth type)
3. Add redirect URI: `http://localhost:5000/api/integrations/zoom/callback`
4. Get your Client ID and Client Secret

### Environment Variables:
```env
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=http://localhost:5000/api/integrations/zoom/callback
```

### Features:
- ✅ Create virtual meetings
- ✅ Schedule classes automatically
- ✅ Record meetings
- ✅ Get meeting participants
- ✅ Manage meeting recordings

## 📱 SMS/WhatsApp Integration (Twilio)

### Setup Steps:
1. Sign up for [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for SMS
4. Configure webhook URLs (optional)

### Environment Variables:
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Features:
- ✅ Send individual SMS messages
- ✅ Send bulk SMS to multiple recipients
- ✅ Automatic attendance alerts
- ✅ Grade notifications
- ✅ Announcement broadcasts
- ✅ Emergency alerts
- ✅ SMS delivery tracking

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the backend directory with the variables above.

### 3. Start the Server
```bash
npm run dev
```

### 4. Access Integrations
1. Login to Smart SIT as a teacher
2. Go to the "Integrations" tab
3. Click "Manage Integrations"
4. Set up each integration as needed

## 🔧 Integration Management

### Google Classroom:
- **Connect**: Click "Connect Google Classroom" and authorize access
- **Sync Courses**: Automatically import courses and students
- **Create Assignments**: Create assignments directly in Google Classroom
- **Sync Grades**: Push grades back to Google Classroom

### Zoom:
- **Connect**: Click "Connect Zoom" and authorize access
- **Create Meetings**: Schedule virtual classes with one click
- **Manage Meetings**: View and manage all your meetings
- **Recordings**: Access meeting recordings

### SMS/WhatsApp:
- **Setup**: Enter your Twilio credentials
- **Send SMS**: Send individual or bulk messages
- **Quick Actions**: Send announcements and emergency alerts
- **History**: View all sent messages and delivery status

## 🛠️ Troubleshooting

### Common Issues:

1. **Google Classroom OAuth Error**
   - Check if redirect URI matches exactly
   - Ensure Google Classroom API is enabled
   - Verify client ID and secret

2. **Zoom Integration Issues**
   - Verify Zoom app is published (not in development mode)
   - Check redirect URI configuration
   - Ensure proper scopes are selected

3. **SMS Not Sending**
   - Verify Twilio credentials
   - Check phone number format (+1234567890)
   - Ensure sufficient Twilio balance

### Debug Mode:
Set `NODE_ENV=development` to see detailed error logs.

## 📊 Usage Analytics

The system tracks:
- Integration usage statistics
- Sync success/failure rates
- Error logs for debugging
- User engagement metrics

## 🔒 Security Notes

- All credentials are encrypted in the database
- OAuth tokens are securely stored
- SMS messages are logged for audit purposes
- Integration access can be revoked anytime

## 📞 Support

For integration issues:
1. Check the error logs in the browser console
2. Verify all environment variables are set
3. Test each integration individually
4. Contact support with specific error messages

---

**Happy Integrating! 🎉**

Your Smart SIT system is now ready to work seamlessly with Google Classroom, Zoom, and SMS services. -->
