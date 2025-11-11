# 🚀 Quick Start: Testing 2FA

## 1. Install Dependencies
```bash
cd backend
npm install speakeasy qrcode
```

## 2. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

## 3. Test the Flow

### Step 1: Register & Login
1. Go to `http://localhost:3000`
2. Register a new account
3. Login normally (should work)

### Step 2: Enable 2FA
1. Go to Profile Settings → Security tab
2. Click "Manage 2FA" → "Setup 2FA"
3. Scan QR code with Google Authenticator
4. Enter the 6-digit code
5. Save your backup codes!

### Step 3: Test 2FA Login
1. Logout
2. Login again
3. You should see 2FA verification modal
4. Enter code from authenticator app
5. Should login successfully

## 🔍 What You Should See

### ✅ Success Indicators:
- QR code appears when setting up 2FA
- Authenticator app shows "Smart SIT" account
- 2FA modal appears during login
- Backup codes are displayed
- Login works with both TOTP and backup codes

### 🐛 If Something Goes Wrong:

**QR Code not showing?**
- Check browser console (F12)
- Make sure `qrcode` package is installed
- Restart backend server

**Authenticator not working?**
- Check device time is correct
- Try manual entry instead of QR code
- Make sure you're using the right authenticator app

**2FA modal not appearing?**
- Check if 2FA is actually enabled
- Look at network tab in browser DevTools
- Check backend console for errors

## 📱 Mobile Testing
1. Open on your phone
2. Test QR code scanning
3. Verify responsive design

## 🧪 Backend Test (Optional)
```bash
cd backend
node test-2fa.js
```

This will test all 2FA components and show you if everything is working.

## 🎯 Expected Results
- ✅ Registration works
- ✅ Normal login works  
- ✅ 2FA setup works
- ✅ Authenticator integration works
- ✅ 2FA login works
- ✅ Backup codes work
- ✅ Account security enhanced

## 🆘 Need Help?
1. Check the detailed `TESTING_2FA.md` guide
2. Look at browser console for errors
3. Check backend console for logs
4. Verify all dependencies are installed

Happy testing! 🚀
