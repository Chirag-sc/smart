import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import profileAPI from '../services/profileAPI';
import TwoFactorAuth from './TwoFactorAuth';

const ProfileSettings = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme, accentColor, fontSize, updateTheme, updateAccentColor, updateFontSize } = useTheme();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile picture states
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Preferences states
  const [preferences, setPreferences] = useState({
    theme: 'light',
    accentColor: '#3B82F6',
    fontSize: 'medium'
  });

  // Personal information states
  const [personalInfo, setPersonalInfo] = useState({
    bio: '',
    interests: '',
    phone: '',
    address: '',
    linkedin: '',
    github: ''
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: {
      announcements: true,
      assignments: true,
      grades: true,
      attendance: true
    },
    push: {
      enabled: true,
      announcements: true,
      urgent: true
    }
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'students',
    showEmail: false,
    allowMessages: true
  });

  // Account management states
  const [accountStatus, setAccountStatus] = useState('active');
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserPreferences();
    }
  }, [isOpen]);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileAPI.getUserPreferences();
      const data = response.data;
      
      console.log('Loaded user preferences:', data);
      
      if (data.profilePicture) {
        setProfilePicture(data.profilePicture);
      }
      
      if (data.preferences) {
        setPreferences(data.preferences);
      }
      
      if (data.notificationPreferences) {
        setNotificationPreferences(data.notificationPreferences);
      }
      
      if (data.privacySettings) {
        setPrivacySettings(data.privacySettings);
      }
      
      if (data.personalInfo) {
        setPersonalInfo(data.personalInfo);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setProfilePictureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) {
      setError('Please select an image file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('profilePicture', profilePictureFile);
      
      const response = await profileAPI.uploadProfilePicture(formData);
      setProfilePicture(response.data.profilePicture);
      setSuccess('Profile picture uploaded successfully');
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await profileAPI.deleteProfilePicture();
      setProfilePicture(null);
      setSuccess('Profile picture deleted successfully');
    } catch (err) {
      console.error('Error deleting profile picture:', err);
      setError(err.message || 'Failed to delete profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePersonalInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await profileAPI.updatePersonalInfo(personalInfo);
      setSuccess('Personal information updated successfully');
    } catch (err) {
      console.error('Error updating personal information:', err);
      setError(err.message || 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      setError(null);
      
      const response = await profileAPI.exportUserData();
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-sit-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await profileAPI.deactivateAccount();
      setSuccess('Account deactivated successfully');
      setAccountStatus('deactivated');
    } catch (err) {
      console.error('Error deactivating account:', err);
      setError(err.message || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await profileAPI.deleteAccount();
      setSuccess('Account deleted successfully. You will be logged out.');
      
      // Logout user after successful deletion
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await profileAPI.updateUserPreferences({
        preferences,
        notificationPreferences,
        privacySettings
      });
      
      setSuccess('Preferences saved successfully');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    updateTheme(newTheme);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'personal', label: 'Personal' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy' },
            { id: 'security', label: 'Security' },
            { id: 'account', label: 'Account' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
              
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profilePicture?.url ? (
                    <img
                      src={`http://localhost:5000${profilePicture.url}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-2xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  
                  <div className="flex space-x-2">
                    {profilePictureFile && (
                      <button
                        onClick={handleUploadProfilePicture}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {loading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                    
                    {profilePicture && (
                      <button
                        onClick={handleDeleteProfilePicture}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={personalInfo.bio}
                onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Interests</label>
              <textarea
                value={personalInfo.interests}
                onChange={(e) => handlePersonalInfoChange('interests', e.target.value)}
                placeholder="What are your interests and hobbies?"
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                    placeholder="Your address"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Social Links</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                  <input
                    type="url"
                    value={personalInfo.linkedin}
                    onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">GitHub</label>
                  <input
                    type="url"
                    value={personalInfo.github}
                    onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSavePersonalInfo}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Personal Information'}
              </button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Appearance Settings</h3>
            
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: '☀️' },
                  { value: 'dark', label: 'Dark', icon: '🌙' },
                  { value: 'auto', label: 'Auto', icon: '🔄' }
                ].map(themeOption => (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    className={`p-4 border-2 rounded-lg text-center transition ${
                      theme === themeOption.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{themeOption.icon}</div>
                    <div className="font-medium">{themeOption.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex space-x-2">
                {[
                  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'
                ].map(color => (
                  <button
                    key={color}
                    onClick={() => updateAccentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      accentColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <select
                value={fontSize}
                onChange={(e) => updateFontSize(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Notification Preferences</h3>
            
            {/* Email Notifications */}
            <div>
              <h4 className="text-lg font-medium mb-3">Email Notifications</h4>
              <div className="space-y-3">
                {Object.entries(notificationPreferences.email).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotificationPreferences(prev => ({
                        ...prev,
                        email: { ...prev.email, [key]: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h4 className="text-lg font-medium mb-3">Push Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.push.enabled}
                    onChange={(e) => setNotificationPreferences(prev => ({
                      ...prev,
                      push: { ...prev.push, enabled: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Push Notifications</span>
                </label>
                
                {notificationPreferences.push.enabled && (
                  <div className="ml-6 space-y-2">
                    {Object.entries(notificationPreferences.push).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, [key]: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Privacy Settings</h3>
            
            {/* Profile Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="students">Students Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="text-lg font-medium">Contact Information</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={privacySettings.showEmail}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Email Address</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={privacySettings.allowMessages}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessages: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Allow Messages</span>
              </label>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Security Settings</h3>
            
            {/* Two-Factor Authentication */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to your account with 2FA
                  </p>
                </div>
                <button
                  onClick={() => setShow2FA(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Manage 2FA
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Secure your account with authenticator apps
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Backup codes for account recovery
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  SMS verification as additional option
                </div>
              </div>
            </div>

            {/* Login Security */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="text-lg font-medium text-yellow-900 mb-2">Login Security</h4>
              <div className="space-y-2 text-sm text-yellow-800">
                <p>• Account locks after 5 failed login attempts</p>
                <p>• 2-hour lockout period for security</p>
                <p>• Login attempts are tracked and monitored</p>
                <p>• Trusted devices can be managed</p>
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-medium text-green-900 mb-2">Security Best Practices</h4>
              <div className="space-y-2 text-sm text-green-800">
                <p>• Use a strong, unique password</p>
                <p>• Enable two-factor authentication</p>
                <p>• Keep your backup codes in a safe place</p>
                <p>• Log out from shared devices</p>
                <p>• Report suspicious activity immediately</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Management Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Account Management</h3>
            
            {/* Account Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Account Status</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${accountStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {accountStatus === 'active' ? 'Active' : 'Deactivated'}
                </span>
              </div>
            </div>

            {/* Data Export */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Export Your Data</h4>
              <p className="text-sm text-gray-600 mb-4">
                Download a copy of all your data including profile information, preferences, and settings.
              </p>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {exportLoading ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            {/* Account Deactivation */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Deactivate Account</h4>
              <p className="text-sm text-gray-600 mb-4">
                Temporarily deactivate your account. You can reactivate it later by logging in.
              </p>
              <button
                onClick={handleDeactivateAccount}
                disabled={loading || accountStatus === 'deactivated'}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
              >
                {loading ? 'Deactivating...' : 'Deactivate Account'}
              </button>
            </div>

            {/* Account Deletion */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-lg font-medium text-red-900 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-4">
                <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirm !== 'DELETE'}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Deleting...' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-8 pt-6 border-t">
          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* 2FA Modal */}
      <TwoFactorAuth
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
      />
    </div>
  );
};

export default ProfileSettings;
