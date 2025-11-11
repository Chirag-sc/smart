const express = require('express');
const router = express.Router();
const {
  setup2FA,
  verify2FASetup,
  disable2FA,
  generateBackupCodes,
  get2FAStatus,
  verify2FA,
  sendSMSVerification,
  verifySMSCode
} = require('../controllers/twoFactorController');
const { protect } = require('../middleware/auth');

// Protected routes (require authentication)
router.use(protect);

// 2FA setup and management
router.post('/setup', setup2FA);
router.post('/verify-setup', verify2FASetup);
router.post('/disable', disable2FA);
router.post('/backup-codes', generateBackupCodes);
router.get('/status', get2FAStatus);

// SMS verification
router.post('/send-sms', sendSMSVerification);
router.post('/verify-sms', verifySMSCode);

// Public route for 2FA verification during login
router.post('/verify', verify2FA);

module.exports = router;
