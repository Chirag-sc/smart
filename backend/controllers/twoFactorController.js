const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

// @desc    Setup 2FA for user
// @route   POST /api/2fa/setup
// @access  Private
const setup2FA = asyncHandler(async (req, res) => {
  try {
    // Find user by ID
    let user = await Student.findById(req.user.id);
    let role = 'student';
    if (!user) {
      user = await Parent.findById(req.user.id);
      if (user) role = 'parent';
    }
    if (!user) {
      user = await Teacher.findById(req.user.id);
      if (user) role = 'teacher';
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Smart SIT (${user.email})`,
      issuer: 'Smart SIT',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret to user (but don't enable 2FA yet)
    user.twoFactorAuth.secret = secret.base32;
    await user.save();

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up 2FA',
      error: error.message
    });
  }
});

// @desc    Verify 2FA setup
// @route   POST /api/2fa/verify-setup
// @access  Private
const verify2FASetup = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;

    // Find user
    let user = await Student.findById(req.user.id);
    if (!user) {
      user = await Parent.findById(req.user.id);
    }
    if (!user) {
      user = await Teacher.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorAuth.secret) {
      return res.status(400).json({
        success: false,
        message: '2FA not set up. Please setup 2FA first.'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA and generate backup codes
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.lastUsed = new Date();
    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(code => ({
        code: code.code,
        used: code.used
      }))
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA setup',
      error: error.message
    });
  }
});

// @desc    Disable 2FA
// @route   POST /api/2fa/disable
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
  try {
    const { password, token } = req.body;

    // Find user
    let user = await Student.findById(req.user.id).select('+password');
    if (!user) {
      user = await Parent.findById(req.user.id).select('+password');
    }
    if (!user) {
      user = await Teacher.findById(req.user.id).select('+password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // If 2FA is enabled, verify token
    if (user.twoFactorAuth.enabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA token'
        });
      }
    }

    // Disable 2FA
    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.secret = null;
    user.twoFactorAuth.backupCodes = [];
    await user.save();

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA',
      error: error.message
    });
  }
});

// @desc    Generate new backup codes
// @route   POST /api/2fa/backup-codes
// @access  Private
const generateBackupCodes = asyncHandler(async (req, res) => {
  try {
    const { password, token } = req.body;

    // Find user
    let user = await Student.findById(req.user.id).select('+password');
    if (!user) {
      user = await Parent.findById(req.user.id).select('+password');
    }
    if (!user) {
      user = await Teacher.findById(req.user.id).select('+password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Generate new backup codes
    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      success: true,
      message: 'New backup codes generated',
      backupCodes: backupCodes.map(code => ({
        code: code.code,
        used: code.used
      }))
    });
  } catch (error) {
    console.error('Backup codes generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating backup codes',
      error: error.message
    });
  }
});

// @desc    Get 2FA status
// @route   GET /api/2fa/status
// @access  Private
const get2FAStatus = asyncHandler(async (req, res) => {
  try {
    // Find user
    let user = await Student.findById(req.user.id);
    if (!user) {
      user = await Parent.findById(req.user.id);
    }
    if (!user) {
      user = await Teacher.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      enabled: user.twoFactorAuth.enabled,
      hasSecret: !!user.twoFactorAuth.secret,
      backupCodesCount: user.twoFactorAuth.backupCodes.filter(code => !code.used).length,
      lastUsed: user.twoFactorAuth.lastUsed
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting 2FA status',
      error: error.message
    });
  }
});

// @desc    Verify 2FA token during login
// @route   POST /api/2fa/verify
// @access  Public
const verify2FA = asyncHandler(async (req, res) => {
  try {
    const { email, token, backupCode } = req.body;

    // Find user
    let user = await Student.findOne({ email });
    if (!user) {
      user = await Parent.findOne({ email });
    }
    if (!user) {
      user = await Teacher.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account'
      });
    }

    let verified = false;

    // Check if it's a backup code
    if (backupCode) {
      const backupCodeEntry = user.twoFactorAuth.backupCodes.find(
        code => code.code === backupCode.toUpperCase() && !code.used
      );

      if (backupCodeEntry) {
        backupCodeEntry.used = true;
        verified = true;
        await user.save();
      }
    } else if (token) {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }

    // Update last used
    user.twoFactorAuth.lastUsed = new Date();
    await user.save();

    res.json({
      success: true,
      message: '2FA verified successfully'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA',
      error: error.message
    });
  }
});

// @desc    Send SMS verification code
// @route   POST /api/2fa/send-sms
// @access  Private
const sendSMSVerification = asyncHandler(async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Find user
    let user = await Student.findById(req.user.id);
    if (!user) {
      user = await Parent.findById(req.user.id);
    }
    if (!user) {
      user = await Teacher.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real implementation, you would send SMS here using services like Twilio
    // For now, we'll just simulate it
    console.log(`SMS Code for ${phoneNumber}: ${code}`);
    
    // Store code temporarily (in production, use Redis with expiration)
    user.smsVerificationCode = code;
    user.smsVerificationExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    res.json({
      success: true,
      message: 'SMS verification code sent',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending SMS verification',
      error: error.message
    });
  }
});

// @desc    Verify SMS code
// @route   POST /api/2fa/verify-sms
// @access  Private
const verifySMSCode = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;

    // Find user
    let user = await Student.findById(req.user.id);
    if (!user) {
      user = await Parent.findById(req.user.id);
    }
    if (!user) {
      user = await Teacher.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if code exists and is not expired
    if (!user.smsVerificationCode || !user.smsVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No SMS code found. Please request a new code.'
      });
    }

    if (new Date() > user.smsVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'SMS code has expired. Please request a new code.'
      });
    }

    if (user.smsVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SMS code'
      });
    }

    // Clear the code
    user.smsVerificationCode = undefined;
    user.smsVerificationExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'SMS code verified successfully'
    });
  } catch (error) {
    console.error('SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying SMS code',
      error: error.message
    });
  }
});

module.exports = {
  setup2FA,
  verify2FASetup,
  disable2FA,
  generateBackupCodes,
  get2FAStatus,
  verify2FA,
  sendSMSVerification,
  verifySMSCode
};
