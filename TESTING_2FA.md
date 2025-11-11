# 🧪 2FA Testing Guide for Smart SIT

## Prerequisites
1. Make sure backend dependencies are installed:
   ```bash
   cd backend
   npm install speakeasy qrcode
   ```

2. Start both servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

## 🧪 Testing Steps

### Step 1: Register a New User
1. Go to `http://localhost:3000/auth`
2. Click "Create Account" 
3. Fill in registration form
4. Submit and verify successful registration

### Step 2: Login (First Time - No 2FA)
1. Use the credentials you just created
2. Login should work normally
3. You should be redirected to your dashboard

### Step 3: Enable 2FA
1. In your dashboard, look for Profile Settings (usually a gear icon)
2. Click on Profile Settings
3. Go to the "Security" tab
4. Click "Manage 2FA"
5. Click "Setup 2FA"
6. You should see a QR code

### Step 4: Setup Authenticator App
1. Install Google Authenticator, Authy, or Microsoft Authenticator on your phone
2. Scan the QR code with your authenticator app
3. You should see a 6-digit code appear in the app
4. Enter this code in the "Verify Setup" field
5. Click "Verify & Enable 2FA"
6. You should see backup codes - **SAVE THESE!**

### Step 5: Test 2FA Login
1. Logout from your account
2. Try to login again with your credentials
3. After entering email/password, you should see a 2FA verification modal
4. Open your authenticator app and enter the 6-digit code
5. Click "Verify & Continue"
6. You should be logged in successfully

### Step 6: Test Backup Codes
1. Logout again
2. Try to login
3. In the 2FA modal, click "Use Backup Code Instead"
4. Enter one of the backup codes you saved earlier
5. Click "Verify & Continue"
6. You should be logged in (and that backup code is now used)

### Step 7: Test SMS Verification (Optional)
1. In Profile Settings → Security → 2FA Management
2. Go to "SMS Verification" tab
3. Enter a phone number
4. Click "Send SMS Code"
5. Check the browser console or network tab for the code
6. Enter the code to verify

## 🔍 What to Look For

### ✅ Success Indicators:
- QR code displays properly
- Authenticator app shows the account
- 2FA verification modal appears during login
- Backup codes are generated and displayed
- Login works with both TOTP and backup codes
- Account lockout after 5 failed attempts

### ❌ Common Issues:
- **QR code not showing**: Check browser console for errors
- **Authenticator not working**: Make sure device time is synchronized
- **2FA modal not appearing**: Check if 2FA is actually enabled
- **Backend errors**: Check server console for error messages

## 🐛 Debugging

### Check Backend Logs:
```bash
# Look for these in your backend console:
# - "SMS Code for +1234567890: 123456"
# - "2FA setup successful"
# - "2FA verification successful"
```

### Check Frontend Console:
```bash
# Open browser DevTools (F12)
# Look for:
# - Network requests to /api/2fa/*
# - Any JavaScript errors
# - Successful API responses
```

### Test API Endpoints Directly:
```bash
# Test 2FA status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/2fa/status

# Test 2FA setup
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/2fa/setup
```

## 📱 Mobile Testing

1. Open the app on your phone
2. Follow the same steps
3. Test the responsive design
4. Verify QR code scanning works

## 🔒 Security Testing

1. **Account Lockout**: Try wrong password 5 times
2. **2FA Bypass**: Try to login without 2FA when enabled
3. **Backup Code Usage**: Use a backup code and verify it's marked as used
4. **Session Management**: Check if tokens work properly

## 📊 Expected Results

### Successful Test Flow:
1. ✅ User registration works
2. ✅ Normal login works (before 2FA)
3. ✅ 2FA setup works with QR code
4. ✅ Authenticator app shows the account
5. ✅ 2FA verification modal appears
6. ✅ Login works with TOTP code
7. ✅ Login works with backup code
8. ✅ Account lockout works
9. ✅ 2FA can be disabled
10. ✅ New backup codes can be generated

## 🚨 Troubleshooting

### If QR Code Doesn't Show:
- Check if `qrcode` package is installed
- Check browser console for errors
- Verify the API endpoint is working

### If Authenticator Doesn't Work:
- Check device time synchronization
- Try manual entry key instead of QR code
- Verify the secret is being generated correctly

### If 2FA Modal Doesn't Appear:
- Check if 2FA is actually enabled in database
- Verify the login flow is calling the right endpoints
- Check AuthContext for 2FA handling

### If SMS Doesn't Work:
- Check server console for the code
- Verify the phone number format
- Check if the SMS verification endpoint is working

## 📝 Test Checklist

- [ ] User registration
- [ ] Normal login (no 2FA)
- [ ] 2FA setup with QR code
- [ ] Authenticator app integration
- [ ] 2FA verification during login
- [ ] Backup code usage
- [ ] SMS verification (optional)
- [ ] Account lockout protection
- [ ] 2FA disable functionality
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Security measures

## 🎯 Success Criteria

Your 2FA implementation is working correctly if:
1. Users can enable 2FA through the UI
2. QR codes are generated and scannable
3. Authenticator apps work with the generated codes
4. Login requires 2FA verification when enabled
5. Backup codes work as fallback
6. Account security is enhanced
7. User experience is smooth and intuitive

Happy testing! 🚀
