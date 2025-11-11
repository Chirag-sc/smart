import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TwoFactorAuth = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 2FA Setup states
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  // 2FA Status
  const [status, setStatus] = useState({
    enabled: false,
    hasSecret: false,
    backupCodesCount: 0
  });
  
  // SMS states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch2FAStatus();
    }
  }, [isOpen]);

  const fetch2FAStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

  const setup2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.manualEntryKey);
    } catch (error) {
      setError('Failed to setup 2FA: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verify2FASetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/2fa/verify-setup', {
        token: verificationToken
      });
      
      setBackupCodes(response.data.backupCodes);
      setSuccess('2FA enabled successfully! Please save your backup codes.');
      fetch2FAStatus();
    } catch (error) {
      setError('Failed to verify 2FA: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const password = prompt('Enter your password to disable 2FA:');
      if (!password) return;
      
      const token = prompt('Enter your 2FA code:');
      if (!token) return;
      
      await api.post('/2fa/disable', {
        password,
        token
      });
      
      setSuccess('2FA disabled successfully!');
      fetch2FAStatus();
    } catch (error) {
      setError('Failed to disable 2FA: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const password = prompt('Enter your password:');
      if (!password) return;
      
      const token = prompt('Enter your 2FA code:');
      if (!token) return;
      
      const response = await api.post('/2fa/backup-codes', {
        password,
        token
      });
      
      setBackupCodes(response.data.backupCodes);
      setSuccess('New backup codes generated!');
      fetch2FAStatus();
    } catch (error) {
      setError('Failed to generate backup codes: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const sendSMSVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/2fa/send-sms', {
        phoneNumber
      });
      
      setSmsSent(true);
      setSuccess('SMS verification code sent!');
    } catch (error) {
      setError('Failed to send SMS: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verifySMSCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/2fa/verify-sms', {
        code: smsCode
      });
      
      setSuccess('SMS code verified successfully!');
      setSmsCode('');
      setSmsSent(false);
    } catch (error) {
      setError('Failed to verify SMS code: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Status Overview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Status</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              <span>2FA Status: {status.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <span>Backup Codes: {status.backupCodesCount} remaining</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'setup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Setup 2FA
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'sms'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SMS Verification
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'manage'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Setup 2FA Tab */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            {!status.enabled ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
                
                {!qrCode ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Two-factor authentication adds an extra layer of security to your account.
                    </p>
                    <button
                      onClick={setup2FA}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Setting up...' : 'Setup 2FA'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Use an authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator) to scan this QR code:
                      </p>
                      <div className="flex justify-center mb-4">
                        <img src={qrCode} alt="QR Code" className="border rounded" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Step 2: Manual Entry (Alternative)</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        If you can't scan the QR code, enter this key manually:
                      </p>
                      <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                        {secret}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Step 3: Verify Setup</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Enter the 6-digit code from your authenticator app:
                      </p>
                      <input
                        type="text"
                        value={verificationToken}
                        onChange={(e) => setVerificationToken(e.target.value)}
                        placeholder="123456"
                        className="w-full p-2 border border-gray-300 rounded"
                        maxLength="6"
                      />
                    </div>

                    <button
                      onClick={verify2FASetup}
                      disabled={loading || !verificationToken}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-green-600 text-6xl mb-4">✓</div>
                <h3 className="text-lg font-semibold mb-2">2FA is Enabled</h3>
                <p className="text-gray-600">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            )}

            {/* Backup Codes Display */}
            {backupCodes.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Save Your Backup Codes</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  These codes can be used to access your account if you lose your authenticator device.
                  Save them in a secure location.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white p-2 border rounded font-mono text-sm">
                      {code.code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SMS Verification Tab */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">SMS Verification</h3>
            <p className="text-gray-600">
              Add SMS verification as an additional security layer to your account.
            </p>

            {!smsSent ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={sendSMSVerification}
                  disabled={loading || !phoneNumber}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send SMS Code'}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter SMS Code
                  </label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="123456"
                    className="w-full p-2 border border-gray-300 rounded"
                    maxLength="6"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={verifySMSCode}
                    disabled={loading || !smsCode}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    onClick={() => {
                      setSmsSent(false);
                      setSmsCode('');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Manage 2FA</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded">
                <h4 className="font-semibold mb-2">Backup Codes</h4>
                <p className="text-sm text-gray-600 mb-3">
                  You have {status.backupCodesCount} backup codes remaining.
                </p>
                <button
                  onClick={generateBackupCodes}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate New Backup Codes'}
                </button>
              </div>

              {status.enabled && (
                <div className="p-4 border border-red-200 rounded">
                  <h4 className="font-semibold text-red-800 mb-2">Disable 2FA</h4>
                  <p className="text-sm text-red-600 mb-3">
                    This will remove the extra security from your account.
                  </p>
                  <button
                    onClick={disable2FA}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
