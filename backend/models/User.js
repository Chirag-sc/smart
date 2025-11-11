const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'parent', 'teacher'],
    required: [true, 'Please specify a role']
  },
  profilePicture: {
    url: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    accentColor: {
      type: String,
      default: '#3B82F6'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },
  notificationPreferences: {
    email: {
      announcements: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      grades: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true }
    },
    push: {
      enabled: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      urgent: { type: Boolean, default: true }
    }
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'students', 'teachers', 'private'],
      default: 'students'
    },
    showEmail: { type: Boolean, default: false },
    allowMessages: { type: Boolean, default: true }
  },
  personalInfo: {
    bio: { type: String, default: '' },
    interests: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  // 2FA Security Fields
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: {
      type: String,
      default: null
    },
    backupCodes: [{
      code: String,
      used: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    lastUsed: {
      type: Date,
      default: null
    }
  },
  securitySettings: {
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockoutUntil: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    lastLoginIP: {
      type: String,
      default: null
    },
    trustedDevices: [{
      deviceId: String,
      deviceName: String,
      lastUsed: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 2FA Methods
UserSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      used: false,
      createdAt: new Date()
    });
  }
  this.twoFactorAuth.backupCodes = codes;
  return codes;
};

UserSchema.methods.isAccountLocked = function() {
  return this.securitySettings.lockoutUntil && this.securitySettings.lockoutUntil > Date.now();
};

UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.securitySettings.lockoutUntil && this.securitySettings.lockoutUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'securitySettings.lockoutUntil': 1 },
      $set: { 'securitySettings.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'securitySettings.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.securitySettings.loginAttempts + 1 >= 5 && !this.securitySettings.lockoutUntil) {
    updates.$set = { 'securitySettings.lockoutUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'securitySettings.loginAttempts': 1, 'securitySettings.lockoutUntil': 1 }
  });
};

UserSchema.methods.addTrustedDevice = function(deviceId, deviceName) {
  const existingDevice = this.securitySettings.trustedDevices.find(d => d.deviceId === deviceId);
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
  } else {
    this.securitySettings.trustedDevices.push({
      deviceId,
      deviceName,
      lastUsed: new Date(),
      createdAt: new Date()
    });
  }
  
  return this.save();
};

UserSchema.methods.removeTrustedDevice = function(deviceId) {
  this.securitySettings.trustedDevices = this.securitySettings.trustedDevices.filter(
    d => d.deviceId !== deviceId
  );
  return this.save();
};

module.exports = mongoose.model('User', UserSchema); 